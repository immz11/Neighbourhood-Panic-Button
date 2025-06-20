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
import styles from '../styles';

export default function SignUpDetailsScreen() {
  const navigation = useNavigation();

  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState('');
  const [cellphone, setCellphone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');

  const validatePhoneNumber = (number) => {
    const regex = /^[0-9]{7,15}$/; // Adjust range as needed
    return regex.test(number);
  };

  const handleNext = () => {
    setError('');

    if (!fullName || !idNumber || !email || !cellphone || !password || !confirmPassword || !gender) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!validatePhoneNumber(cellphone)) {
      setError('Invalid phone number. Only numbers allowed (7–15 digits).');
      return;
    }

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
      <TouchableOpacity
        style={localStyles.quickPanicButton}
        onPress={() => navigation.navigate('PanicAnonymous', { isAnonymous: true })}
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
        onChangeText={(text) => {
          setCellphone(text);
          if (!validatePhoneNumber(text)) {
            setError('Invalid phone number. Only numbers allowed (7–15 digits).');
          } else {
            setError('');
          }
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="Create Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
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

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 12 }}>
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
