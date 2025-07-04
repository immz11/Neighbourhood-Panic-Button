// /screens/PanicScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { auth, db } from '../firebase';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import * as Location from 'expo-location';

export default function PanicScreen({ navigation, route }) {
  const { emergencyType } = route.params;
  const [sending, setSending] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [showReassurance, setShowReassurance] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!cancelled) {
            sendPanicAlert();
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cancelled]);

  const sendPanicAlert = async () => {
    setSending(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is needed for panic alerts.');
        setSending(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const user = auth.currentUser;

      // Base alert data (location, timestamp, emergencyType)
      let alertData = {
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        timestamp: new Date(),
        emergencyType, // NEW FIELD: store Fire / BreakingAndEntering / Other
      };

      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          alertData = {
            ...alertData,
            uid: user.uid,
            name: userData.fullName,
            cellphone: userData.cellphone,
            gender: userData.gender,
            idNumber: userData.idNumber,
            email: user.email,
            neighborhoodId: userData.neighborhoodId,
            anonymous: false,
          };
        }
      } else {
        alertData.anonymous = true;
        alertData.deviceId = 'Unavailable'; // optional
        // If not logged in, neighborhoodId could be collected or left undefined. 
        // (You could prompt for neighborhood if needed—but here we leave it out.)
      }

      await addDoc(collection(db, 'panic_alerts'), alertData);
      setShowReassurance(true);

      // show reassurance for 3 seconds before navigating back
      setTimeout(() => {
        Alert.alert('Alert Sent', `Panic alert (${emergencyType}) has been sent.`);
        navigation.goBack();
      }, 3000);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to send panic alert.');
    } finally {
      setSending(false);
    }
  };

  const cancelAlert = () => {
    setCancelled(true);
    Alert.alert('Cancelled', 'Panic alert cancelled.');
    navigation.goBack();
  };

  if (showReassurance) {
    return (
      <View style={styles.reassuranceContainer}>
        <Text style={styles.reassuranceText}>
          🛡️ Help is on the way for your {emergencyType} emergency. Hang in there!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Sending {emergencyType} Alert in {countdown}s...
      </Text>
      {sending ? (
        <ActivityIndicator size="large" color="#ED4C5C" />
      ) : (
        <TouchableOpacity style={styles.cancelButton} onPress={cancelAlert}>
          <Text style={styles.cancelText}>Cancel Alert</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  cancelText: {
    fontSize: 16,
    color: '#000',
  },
  reassuranceContainer: {
    flex: 1,
    backgroundColor: '#bb0365',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  reassuranceText: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
