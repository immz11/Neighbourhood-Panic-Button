// LoginScreen.js

import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import styles from '../styles';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // ---------- Forgot Password Flow ----------
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handlePasswordReset = async () => {
    setResetError('');
    setResetSuccess('');

    if (!resetEmail) {
      setResetError('Please enter your email address.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSuccess('Password reset link sent! Check your inbox.');
    } catch (err) {
      let message = 'Failed to send reset email.';
      if (err.code === 'auth/user-not-found') {
        message = 'No user found with that email.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Invalid email address.';
      }
      setResetError(message);
    }
  };
  // ------------------------------------------

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;

      navigation.navigate('Home', { userData });
    } catch (err) {
      let message = 'Login failed.';
      if (err.code === 'auth/user-not-found') message = 'User not found.';
      else if (err.code === 'auth/wrong-password') message = 'Wrong password.';
      setError(message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Forgot Password Link */}
      <TouchableOpacity onPress={() => setShowResetForm((prev) => !prev)}>
        <Text style={{ color: '#0066cc', marginTop: 10, textAlign: 'right' }}>
          Forgot Password?
        </Text>
      </TouchableOpacity>

      {/* Reset Form (shown when showResetForm === true) */}
      {showResetForm && (
        <View style={{ marginTop: 15, width: '100%' }}>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            keyboardType="email-address"
            value={resetEmail}
            onChangeText={setResetEmail}
          />

          {resetError ? (
            <Text style={styles.errorText}>{resetError}</Text>
          ) : null}

          {resetSuccess ? (
            <Text style={{ color: 'green', marginBottom: 10 }}>{resetSuccess}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.button, { marginBottom: 10 }]}
            onPress={handlePasswordReset}
          >
            <Text style={styles.buttonText}>Send Reset Link</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.loginText}>Don't have an account? Sign up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Panic', { isAnonymous: true })}>
        <Text style={{ color: 'red', textAlign: 'center', marginTop: 20 }}>
          Quick Panic (Anonymous)
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
