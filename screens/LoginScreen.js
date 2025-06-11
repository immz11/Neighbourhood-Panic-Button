// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import commonStyles from '../constants/styles';
import { auth, firestore } from '../services/firebaseConfig'; // <--- Ensure 'firestore' is correctly imported here
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // <--- doc and getDoc are for document references, not collections

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const MIN_PASSWORD_LENGTH = 6;
  const isValid = email.trim() !== '' && password.length >= MIN_PASSWORD_LENGTH;

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // 1. Attempt to sign in
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCred.user.uid;
      console.log('User signed in with UID:', uid);

      // 2. Fetch user document
      // The original code was already correct for fetching a document,
      // the error message "Expected first argument to collection() to be..."
      // is usually related to how `firestore` itself is passed or if
      // there's another hidden call to `collection()` somewhere else.
      // However, let's re-verify the firebaseConfig.js to be absolutely sure.
      const userDocRef = doc(firestore, 'users', uid); // This line is correct if 'firestore' is a valid FirebaseFirestore instance
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;
        console.log('User data from Firestore:', userData);
        console.log('User role:', role);

        if (role === 'barber' || role === 'client') {
          navigation.reset({
            index: 0,
            routes: [{ name: role === 'barber' ? 'BarberApp' : 'ClientApp' }]
          });
        } else {
          console.warn('User document exists but role is missing or invalid:', userData);
          setError('User role not found or invalid. Please contact support.');
        }
      } else {
        console.warn('No user document found for UID:', uid);
        setError('User profile not found. Please complete registration or contact support.');
      }
    } catch (e) {
      console.error('Login error:', e.code, e.message);
      if (e.code === 'auth/invalid-email') {
        setError('That email address is badly formatted.');
      } else if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (e.code === 'auth/too-many-requests') {
        setError('Too many login attempts. Please try again later.');
      } else {
        setError(`Login failed: ${e.message}`);
      }
      Alert.alert('Login Error', error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={commonStyles.container}>
      <TouchableOpacity style={loginStyles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={colors.primary} />
      </TouchableOpacity>
      <Text style={commonStyles.title}>Log In</Text>
      {error ? <Text style={loginStyles.error}>{error}</Text> : null}
      <TextInput
        style={loginStyles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={loginStyles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        style={[loginStyles.button, (!isValid || loading) && loginStyles.buttonDisabled]}
        onPress={handleLogin}
        disabled={!isValid || loading}
      >
        {loading ? <ActivityIndicator /> : <Text style={loginStyles.buttonText}>Log In</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={loginStyles.switch} onPress={() => navigation.navigate('Signup')}>
        <Text style={loginStyles.switchText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const loginStyles = StyleSheet.create({
  back: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 12,
  },
  button: {
    width: '100%',
    padding: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    borderRadius: 4,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#aaa',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 8,
  },
  switch: {
    marginTop: 16,
  },
  switchText: {
    color: colors.secondary,
    textAlign: 'center',
  },
});