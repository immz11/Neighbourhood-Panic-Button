// screens/RegisterPreferencesScreen.js
import React, { useState } from 'react';
import { View, Text, Button, Alert, Switch, StyleSheet, ActivityIndicator } from 'react-native'; // Added ActivityIndicator for loading state
import colors from '../constants/colors';
import commonStyles from '../constants/styles';
import { auth, firestore } from '../services/firebaseConfig'; // <--- CHANGED 'db' to 'firestore'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function RegisterPreferencesScreen({ navigation, route }) {
  const uid = route.params?.uid || auth.currentUser?.uid;
  const [pushNotifications, setPushNotifications] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  // If uid is not available, perhaps redirect or show an error
  if (!uid) {
    Alert.alert('Error', 'User ID not found. Please log in again.');
    navigation.navigate('Login'); // Or appropriate fallback
    return null; // Don't render the component if no UID
  }

  const handleNext = async () => {
    setLoading(true);
    try {
      const userDoc = doc(firestore, 'users', uid); // <--- Using 'firestore'
      await updateDoc(userDoc, {
        preferences: {
          pushNotifications,
          emailNotifications,
        },
        updatedAt: serverTimestamp(),
      });
      navigation.navigate('RegisterPayment', { uid });
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Could not save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.title}>Register: Preferences</Text>
      <View style={styles.row}>
        <Text>Push Notifications</Text>
        <Switch
          value={pushNotifications}
          onValueChange={setPushNotifications}
          trackColor={{ false: "#767577", true: colors.primary }}
          thumbColor={pushNotifications ? colors.primary : "#f4f3f4"}
        />
      </View>
      <View style={styles.row}>
        <Text>Email Notifications</Text>
        <Switch
          value={emailNotifications}
          onValueChange={setEmailNotifications}
          trackColor={{ false: "#767577", true: colors.primary }}
          thumbColor={emailNotifications ? colors.primary : "#f4f3f4"}
        />
      </View>
      <Button
        title={loading ? 'Saving...' : 'Next: Payment'}
        onPress={handleNext}
        color={colors.primary}
        disabled={loading}
      />
      <Button
        title="Back to Photo"
        onPress={() => navigation.navigate('RegisterPhoto', { uid })}
        color={colors.secondary}
      />
      {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 10 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    marginBottom: 10, // Added some margin
  },
});