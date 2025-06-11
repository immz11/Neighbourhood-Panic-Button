import React, { createContext, useState, useEffect } from 'react';
import { auth, firestore } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Will hold user data from Firestore
  const [loadingUser, setLoadingUser] = useState(true); // To indicate if user data is still loading

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in, fetch their Firestore document
        const userDocRef = doc(firestore, 'users', user.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = { id: userDocSnap.id, ...userDocSnap.data() };
            setCurrentUser(userData); // Store all user data, including profilePicUrl
            console.log("UserContext: Fetched and set currentUser:", userData);
          } else {
            console.warn("UserContext: User document not found for UID:", user.uid);
            setCurrentUser(null); // Or set a default minimal user object if needed
          }
        } catch (error) {
          console.error("UserContext: Error fetching user document:", error);
          setCurrentUser(null);
        }
      } else {
        // No user signed in
        setCurrentUser(null);
      }
      setLoadingUser(false);
    });

    // Clean up the subscription
    return () => unsubscribeAuth();
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, loadingUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
};