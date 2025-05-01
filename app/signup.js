import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, Button, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../firebase';

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert('Account created successfully');
      router.replace('/'); // or push to dashboard/home
    } catch (error) {
      console.error(error);
      Alert.alert('Signup Failed', error.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, marginBottom: 12, padding: 8 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, marginBottom: 12, padding: 8 }}
      />
      <Button title="Sign Up" onPress={handleSignup} />

      <TouchableOpacity onPress={() => router.push('/login')} style={{ marginTop: 12 }}>
        <Text style={{ color: 'blue', textAlign: 'center' }}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}
