// screens/RegisterInfoScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, ActivityIndicator } from 'react-native'; // Added ActivityIndicator
import colors from '../constants/colors';
import commonStyles from '../constants/styles';
import { auth, firestore } from '../services/firebaseConfig'; // <--- CHANGED 'db' to 'firestore'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function RegisterInfoScreen({ navigation, route }) {
  const uid = route.params?.uid || auth.currentUser?.uid;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState(''); // Consider using a Picker/Dropdown for gender
  const [loading, setLoading] = useState(false);

  // If uid is not available, perhaps redirect or show an error
  if (!uid) {
    Alert.alert('Error', 'User ID not found. Please complete signup again.');
    navigation.navigate('Signup'); // Or appropriate fallback
    return null; // Don't render the component if no UID
  }

  const handleNext = async () => {
    if (!firstName.trim() || !lastName.trim() || !gender.trim()) { // Added .trim() for input validation
      Alert.alert('Missing Fields', 'Please fill in all required fields (First Name, Last Name, and Gender).');
      return;
    }
    setLoading(true);
    try {
      const userDoc = doc(firestore, 'users', uid); // <--- Using 'firestore'
      await updateDoc(userDoc, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(), // Save trimmed phone number
        gender: gender.trim(),
        updatedAt: serverTimestamp(),
      });
      navigation.navigate('RegisterPhoto', { uid }); // Pass uid to the next screen
    } catch (error) {
      console.error('Error saving basic info:', error);
      Alert.alert('Error', 'Could not save info. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.title}>Register: Basic Info</Text>
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words" // Capitalize first letter of each word
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number (Optional)" // Make optional clear if it is
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Gender (e.g., Male, Female, Other)" // Provide examples or suggest a dropdown
        value={gender}
        onChangeText={setGender}
        autoCapitalize="words"
      />
      <Button
        title={loading ? 'Saving...' : 'Next: Photo'}
        onPress={handleNext}
        color={colors.primary}
        disabled={loading}
      />
      <Button
        title="Back to Sign Up"
        onPress={() => navigation.navigate('Signup')}
        color={colors.secondary}
      />
      {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 10 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 12,
  },
});