import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function HomeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userData } = route.params || {};

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      Alert.alert('Error', 'Sign out failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello, {userData?.fullName || 'User'}!</Text>

      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>

      <TouchableOpacity
  style={[styles.button, { backgroundColor: '#D00000', marginTop: 20 }]}
  onPress={() => navigation.navigate('Panic', {
    userData: userData,  // Ensure this is the full object from Firestore
    isAnonymous: false
  })}
>
  <Text style={styles.buttonText}>PANIC BUTTON</Text>
</TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 24, marginBottom: 30, color: '#333' },
  button: { backgroundColor: '#ED4C5C', padding: 15, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 17 }
});
