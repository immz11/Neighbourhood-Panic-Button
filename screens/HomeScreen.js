import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser || currentUser.isAnonymous) {
        setUserData(null);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          console.warn('No user data found in Firestore');
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // After signOut, auth state listener in App.js will handle navigation
    } catch (error) {
      Alert.alert('Error', 'Sign out failed');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ED4C5C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Hello, {userData?.fullName || (currentUser?.isAnonymous ? 'Guest' : 'User')}!
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#D00000', marginTop: 20 }]}
        onPress={() =>
          navigation.navigate('Panic', {
            userData: userData,
            isAnonymous: currentUser?.isAnonymous ?? true,
          })
        }
      >
        <Text style={styles.buttonText}>PANIC BUTTON</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 24, marginBottom: 30, color: '#333' },
  button: { backgroundColor: '#ED4C5C', padding: 15, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 17 },
});
