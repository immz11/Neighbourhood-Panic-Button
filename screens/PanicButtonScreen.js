import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import styles from '../styles';
import * as Location from 'expo-location';
import { useUser } from '../UserContext';

export default function PanicButtonScreen() {
  const { user } = useUser();

  const sendPanicAlert = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location access is needed for panic alerts.');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const payload = {
      timestamp: new Date().toISOString(),
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    if (user) {
      payload.name = user.name;
      payload.email = user.email;
      payload.phone = user.cellphone;
      payload.gender = user.gender;
      payload.idNumber = user.idNumber;
      payload.type = 'FULL';
    } else {
      payload.type = 'ANONYMOUS';
      payload.deviceId = 'some-unique-device-id'; // Optionally use a device ID library
    }

    // Replace this with your Firebase Firestore / API call
    console.log("Sending panic alert:", payload);

    Alert.alert('Panic alert sent!', `Type: ${payload.type}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panic Alert</Text>
      <TouchableOpacity style={styles.panicButton} onPress={sendPanicAlert}>
        <Text style={styles.buttonText}>SEND PANIC ALERT</Text>
      </TouchableOpacity>
      <Text style={styles.smallText}>
        {user ? "This will send your full details." : "You are not logged in. This alert will be sent anonymously."}
      </Text>
    </View>
  );
}
