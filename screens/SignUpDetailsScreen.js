// screens/SignUpDetailsScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styles from '../styles'; // your shared styles

export default function SignUpDetailsScreen() {
  const navigation = useNavigation();

  // --- Form State (Step 1) ---
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState('');
  const [cellphone, setCellphone] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    setError('');
    if (!fullName || !idNumber || !email || !cellphone || !password || !gender) {
      setError('Please fill in all fields.');
      return;
    }

    // Navigate to the Neighborhood screen, passing along all collected values
    navigation.navigate('SignUpNeighborhood', {
      fullName,
      idNumber,
      email,
      cellphone,
      password,
      gender,
    });
  };

  return (
    <ScrollView contentContainerStyle={localStyles.container}>
      {/* Quick Panic Button (optional) */}
      <TouchableOpacity
        style={localStyles.quickPanicButton}
        onPress={() => navigation.navigate('Panic')}
      >
        <Text style={localStyles.quickPanicText}>Quick Panic</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Sign Up – Step 1 of 2</Text>
      <Text style={styles.subtitle}>Enter your basic details</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="ID or Passport Number"
        value={idNumber}
        onChangeText={setIdNumber}
      />
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Cellphone Number"
        keyboardType="phone-pad"
        value={cellphone}
        onChangeText={setCellphone}
      />
      <TextInput
        style={styles.input}
        placeholder="Create Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text style={[styles.label, { marginTop: 12 }]}>Select Gender</Text>
      <View style={styles.genderContainer}>
        <TouchableOpacity
          style={[
            styles.genderButton,
            gender === 'male' && styles.genderButtonSelected,
          ]}
          onPress={() => setGender('male')}
        >
          <Text style={styles.genderText}>Male</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.genderButton,
            gender === 'female' && styles.genderButtonSelected,
          ]}
          onPress={() => setGender('female')}
        >
          <Text style={styles.genderText}>Female</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Next →</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
    backgroundColor: '#F9FAFB',
    flexGrow: 1,
  },
  quickPanicButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    backgroundColor: '#ED4C5C',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickPanicText: {
    color: '#FFF',
    fontSize: 14,
  },
});
