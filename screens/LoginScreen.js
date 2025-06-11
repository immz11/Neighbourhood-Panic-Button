import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import styles from '../styles';

export default function LoginScreen() {
  const navigation = useNavigation();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Forgot‐password modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;

      // Now that we have a user, go into MainStack → Home
      navigation.navigate('Main', { screen: 'Home', params: { userData } });
    } catch (err) {
      let message = 'Login failed.';
      if (err.code === 'auth/user-not-found') message = 'User not found.';
      else if (err.code === 'auth/wrong-password')
        message = 'Wrong password.';
      setError(message);
    }
  };

  const openResetModal = () => {
    setResetEmail('');
    setResetError('');
    setResetMessage('');
    setShowResetModal(true);
  };

  const closeResetModal = () => {
    setShowResetModal(false);
  };

  const handleSendReset = async () => {
    setResetError('');
    setResetMessage('');

    if (!resetEmail) {
      setResetError('Please enter your email.');
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage('A password reset link has been sent to your email.');
    } catch (err) {
      let msg = 'Failed to send reset email.';
      if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      setResetError(msg);
    }
    setResetLoading(false);
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(prev => !prev)}
            style={{ marginLeft: 10 }}
          >
            <Text style={{ color: '#007AFF', fontWeight: '500' }}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Forgot Password link */}
        <TouchableOpacity
          onPress={openResetModal}
          style={{ alignSelf: 'flex-end', marginRight: 10, marginTop: 8 }}
        >
          <Text style={{ color: '#007AFF' }}>Forgot Password?</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        {/* “Don’t have an account? Sign up” → go to SignUpDetails */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Auth', { screen: 'SignUpDetails' })}
          style={{ marginTop: 12 }}
        >
          <Text style={styles.loginText}>
            Don’t have an account? Sign up
          </Text>
        </TouchableOpacity>

        {/* Quick Panic (Anonymous) → goes to PanicAnonymous at root */}
        <TouchableOpacity
          onPress={() => navigation.navigate('PanicAnonymous', { isAnonymous: true })}
          style={{ marginTop: 20 }}
        >
          <Text style={{ color: 'red', textAlign: 'center' }}>
            Quick Panic (Anonymous)
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Password-Reset Modal */}
      <Modal
        visible={showResetModal}
        animationType="slide"
        transparent
        onRequestClose={closeResetModal}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              width: '80%',
              borderRadius: 8,
              padding: 20,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                marginBottom: 12,
                textAlign: 'center',
              }}
            >
              Reset Password
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={resetEmail}
              onChangeText={setResetEmail}
            />

            {resetError ? (
              <Text style={[styles.errorText, { marginTop: 4 }]}>
                {resetError}
              </Text>
            ) : null}

            {resetMessage ? (
              <Text
                style={{
                  color: 'green',
                  marginTop: 8,
                  textAlign: 'center',
                }}
              >
                {resetMessage}
              </Text>
            ) : null}

            <TouchableOpacity
              style={[styles.button, { marginTop: 16 }]}
              onPress={handleSendReset}
              disabled={resetLoading}
            >
              <Text style={styles.buttonText}>
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 12, alignSelf: 'center' }}
              onPress={closeResetModal}
            >
              <Text style={{ color: '#007AFF' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
