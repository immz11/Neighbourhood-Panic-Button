// context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth'; // Import signInAnonymously
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'; // Import doc, getDoc, setDoc
import { app } from '../services/firebaseConfig'; // Assuming your Firebase app is initialized here

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Firebase Auth User object
  const [userRole, setUserRole] = useState(null); // Role from Firestore
  const [userProfileData, setUserProfileData] = useState(null); // Full profile data
  const [loadingAuth, setLoadingAuth] = useState(true); // Explicitly tracks auth state loading
  const [db, setDb] = useState(null); // Firestore instance
  const [auth, setAuth] = useState(null); // Auth instance

  useEffect(() => {
    // This effect runs once to set up the Firebase instances
    // It's crucial that `app` from firebaseConfig is already initialized.
    try {
      const authInstance = getAuth(app); // Use the initialized app instance
      const firestoreDb = getFirestore(app); // Use the initialized app instance

      setAuth(authInstance);
      setDb(firestoreDb);
      console.log('AuthContext: Firebase Auth and Firestore instances set.');
    } catch (error) {
      console.error('AuthContext: Error initializing Firebase instances:', error);
      setLoadingAuth(false); // Stop loading if initialization fails
    }
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    // This effect listens for auth state changes *after* auth and db instances are set
    if (!auth || !db) {
      console.log('AuthContext: Waiting for Auth/DB instances before setting up listener.');
      return; // Wait until auth and db are available
    }

    // Function to ensure anonymous user exists and has a Firestore document
    const ensureAnonymousUserAndDoc = async (userRef) => {
      try {
        const userDocRef = doc(db, 'users', userRef.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          console.log('AuthContext: Anonymous user document not found. Creating new document.');
          await setDoc(userDocRef, {
            email: `${userRef.uid}@anon.com`, // Placeholder email
            role: 'client', // Default role for anonymous users
            createdAt: new Date(),
            profilePhotoUrl: null, // Initialize profilePhotoUrl
          });
          // Fetch again to get the data you just created
          const newUserDocSnap = await getDoc(userDocRef);
          return newUserDocSnap.data();
        } else {
          return userDocSnap.data();
        }
      } catch (error) {
        console.error('AuthContext: Error ensuring anonymous user document:', error);
        return null;
      }
    };

    console.log('AuthContext: Setting up onAuthStateChanged listener.');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user); // Set the Firebase Auth User object

      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          let fetchedUserData = null;
          if (userDocSnap.exists()) {
            fetchedUserData = userDocSnap.data();
            setUserRole(fetchedUserData.role);
            setUserProfileData(fetchedUserData);
            console.log('AuthContext: Fetched user data for UID:', user.uid);
          } else {
            // If user is logged in (e.g., via email/password) but no doc, assume new user or issue
            if (user.isAnonymous) {
              // Only create doc for anonymous users if it doesn't exist
              fetchedUserData = await ensureAnonymousUserAndDoc(user);
              setUserRole(fetchedUserData?.role || 'client');
              setUserProfileData(fetchedUserData);
              console.log('AuthContext: Ensured anonymous user document for UID:', user.uid);
            } else {
              setUserRole(null);
              setUserProfileData(null);
              console.warn('AuthContext: User document not found for non-anonymous user:', user.uid);
            }
          }
        } catch (error) {
          console.error('AuthContext: Error fetching user data from Firestore:', error);
          setUserRole(null);
          setUserProfileData(null);
        }
      } else {
        // No user found, attempt anonymous sign-in
        console.log('AuthContext: No user found. Attempting anonymous sign-in.');
        try {
          const anonCred = await signInAnonymously(auth);
          const anonUser = anonCred.user;
          console.log('AuthContext: Signed in anonymously. UID:', anonUser.uid);
          // Now ensure their Firestore doc exists
          const fetchedUserData = await ensureAnonymousUserAndDoc(anonUser);
          setUserRole(fetchedUserData?.role || 'client');
          setUserProfileData(fetchedUserData);
          setCurrentUser(anonUser); // Update currentUser with the new anonymous user
        } catch (anonError) {
          console.error('AuthContext: Anonymous sign-in failed:', anonError.message);
          // Handle this error appropriately, perhaps show a message or prevent app usage
        }
      }
      setLoadingAuth(false); // Authentication state has been determined (user or anonymous)
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('AuthContext: Unsubscribing from auth state listener.');
      unsubscribe();
    };
  }, [auth, db]); // Depend on auth and db instances

  return (
    <AuthContext.Provider value={{ currentUser, userRole, userProfileData, loadingAuth, auth, db }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };