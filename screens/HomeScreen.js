// /screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import NeighborhoodInfo from '../components/NeighborhoodInfo';

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
      {/* Greeting */}
      <Text style={styles.text}>
        Hello, {userData?.fullName || (currentUser?.isAnonymous ? 'Guest' : 'User')}!
      </Text>

      {/* ── User & Neighborhood Info Component ── */}
      <NeighborhoodInfo />

      {/* Sign Out */}
      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.emergencyPrompt}>
        Select Emergency Type:
      </Text>

      {/* Fire Button */}
      <TouchableOpacity
        style={[styles.emergencyButton, { backgroundColor: '#E74C3C' }]}
        onPress={() =>
          navigation.navigate('Panic', {
            emergencyType: 'Fire',
            userData: userData,
            isAnonymous: currentUser?.isAnonymous ?? true,
          })
        }
      >
        <Text style={styles.emergencyText}>Fire</Text>
      </TouchableOpacity>

      {/* Breaking & Entering Button */}
      <TouchableOpacity
        style={[styles.emergencyButton, { backgroundColor: '#F1C40F' }]}
        onPress={() =>
          navigation.navigate('Panic', {
            emergencyType: 'BreakingAndEntering',
            userData: userData,
            isAnonymous: currentUser?.isAnonymous ?? true,
          })
        }
      >
        <Text style={styles.emergencyText}>Breaking & Entering</Text>
      </TouchableOpacity>

      {/* Other Button */}
      <TouchableOpacity
        style={[styles.emergencyButton, { backgroundColor: '#3498DB' }]}
        onPress={() =>
          navigation.navigate('Panic', {
            emergencyType: 'Other',
            userData: userData,
            isAnonymous: currentUser?.isAnonymous ?? true,
          })
        }
      >
        <Text style={styles.emergencyText}>Other</Text>
      </TouchableOpacity>

      {/* Panic Buttons Navigation */}
      <TouchableOpacity
        style={[styles.emergencyButton, { backgroundColor: '#9B59B6' }]}
        onPress={() => navigation.navigate('PanicButton')}
      >
        <Text style={styles.emergencyText}>View Panic Buttons</Text>
      </TouchableOpacity>

      {/* Emergency Contacts Navigation */}
      <TouchableOpacity
        style={[styles.emergencyButton, { backgroundColor: '#1ABC9C' }]}
        onPress={() => navigation.navigate('Contacts')}
      >
        <Text style={styles.emergencyText}>Emergency Contacts</Text>
      </TouchableOpacity>

      <Text style={styles.noteText}>
        {currentUser && !currentUser.isAnonymous
          ? 'Logged in: full details will be sent.'
          : 'Not logged in: this alert will be sent anonymously.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    marginBottom: 15,
    color: '#333',
  },
  button: {
    backgroundColor: '#ED4C5C',
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
    width: '60%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
  },
  emergencyPrompt: {
    fontSize: 20,
    color: '#333',
    marginBottom: 20,
    fontWeight: '500',
  },
  emergencyButton: {
    width: '80%',
    paddingVertical: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  emergencyText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  noteText: {
    marginTop: 20,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
