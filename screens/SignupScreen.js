// screens/SignupScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import commonStyles from '../constants/styles';
import { auth, firestore } from '../services/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState('client'); // Default role is client
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const MIN_PASSWORD_LENGTH = 6;
  const isValid =
    email.trim() !== '' &&
    password.length >= MIN_PASSWORD_LENGTH &&
    password === confirm;

  const handleSignup = async () => {
    setError('');
    setLoading(true);
    try {
      // 1. Create user with email and password
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCred.user.uid;
      console.log('SignupScreen: User created with UID:', uid);

      // 2. Store user data in Firestore
      await setDoc(doc(firestore, 'users', uid), {
        userId: uid,
        email: email.trim(),
        role, // 'client' or 'barber'
        firstName: '',
        lastName: '',
        phoneNumber: '',
        profilePhotoUrl: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('SignupScreen: User data saved to Firestore for UID:', uid);

      // 3. Navigate to the next registration step based on role
      if (role === 'barber') {
        // Direct barbers to their comprehensive onboarding screen
        navigation.reset({ index: 0, routes: [{ name: 'BarberOnboarding', params: { uid } }] });
      } else {
        // Clients go through their specific registration steps (e.g., RegisterInfo)
        navigation.reset({ index: 0, routes: [{ name: 'RegisterInfo', params: { uid } }] });
      }

    } catch (e) {
      console.error('SignupScreen: Signup error:', e.code, e.message); // Log detailed error

      let errorMessage = 'An unexpected error occurred during signup.';
      if (e.code === 'auth/email-already-in-use') {
        errorMessage = 'That email address is already in use.';
      } else if (e.code === 'auth/invalid-email') {
        errorMessage = 'That email address is badly formatted.';
      } else if (e.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password accounts are not enabled. Please enable them in Firebase Auth.';
      } else if (e.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else {
        errorMessage = `Signup failed: ${e.message}`;
      }
      setError(errorMessage);
      Alert.alert('Signup Error', errorMessage); // Show a native alert for user feedback
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={commonStyles.container}>
      <TouchableOpacity style={signupStyles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={colors.primary} />
      </TouchableOpacity>
      <Text style={commonStyles.title}>Sign Up</Text>
      {error ? <Text style={signupStyles.error}>{error}</Text> : null}
      <TextInput
        style={signupStyles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={signupStyles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={signupStyles.input}
        placeholder="Confirm Password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
      />
      <View style={signupStyles.roleContainer}>
        <TouchableOpacity
          style={[signupStyles.roleButton, role === 'client' && signupStyles.roleSelected]}
          onPress={() => setRole('client')}
        >
          <Text>Client</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[signupStyles.roleButton, role === 'barber' && signupStyles.roleSelected]}
          onPress={() => setRole('barber')}
        >
          <Text>Barber</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[signupStyles.button, (!isValid || loading) && signupStyles.buttonDisabled]}
        onPress={handleSignup}
        disabled={!isValid || loading}
      >
        {loading ? <ActivityIndicator /> : <Text style={signupStyles.buttonText}>Start Registration</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={signupStyles.switch} onPress={() => navigation.navigate('Login')}>
        <Text style={signupStyles.switchText}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const signupStyles = StyleSheet.create({
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
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  roleButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 4,
    width: '45%',
    alignItems: 'center',
  },
  roleSelected: {
    backgroundColor: colors.primary,
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