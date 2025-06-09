// /screens/AlertNotificationScreen.js

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  Alert,
  Linking,
  TouchableOpacity 
} from 'react-native';
import firebase from '../firebase';

const instructionsMap = {
  Fire: {
    text: 'Call Nearest Fire Services Immediately',
    action: 'Call Fire Department',
    number: '10177', // Fire emergency number
    color: '#FF4444'
  },
  'Breaking & Entering': {
    text: 'Alert your neighbours and call the police immediately',
    action: 'Call Police',
    number: '10111', // Police emergency number
    color: '#FF6B35'
  },
  'Medical Emergency': {
    text: 'Call ambulance services and check on your neighbor',
    action: 'Call Ambulance',
    number: '10177', // Medical emergency number
    color: '#FF1744'
  },
  'General Emergency': {
    text: 'Check on your neighbor and call emergency services if needed',
    action: 'Call Emergency',
    number: '112', // General emergency number
    color: '#D32F2F'
  },
  Other: {
    text: 'Check on your neighbor - Help is on the way',
    action: 'Call Emergency',
    number: '112',
    color: '#F57C00'
  }
};

export default function AlertNotificationScreen({ route, navigation }) {
  const { alertId } = route.params;
  const [alertData, setAlertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!alertId) {
      setError('No alert ID provided');
      setLoading(false);
      return;
    }

    const unsubscribe = firebase
      .firestore()
      .collection('panic_alerts')
      .doc(alertId)
      .onSnapshot(
        doc => {
          if (doc.exists) {
            setAlertData({ id: doc.id, ...doc.data() });
          } else {
            setError('Alert not found');
          }
          setLoading(false);
        },
        err => {
          console.error('Error fetching alert:', err);
          setError('Failed to load alert data');
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [alertId]);

  const handleEmergencyCall = (phoneNumber) => {
    Alert.alert(
      'Call Emergency Services',
      `Do you want to call ${phoneNumber}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${phoneNumber}`);
          },
        },
      ]
    );
  };

  const handleCallNeighbor = (phoneNumber) => {
    if (phoneNumber && phoneNumber !== 'N/A') {
      Alert.alert(
        'Call Neighbor',
        `Do you want to call ${phoneNumber}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Call',
            onPress: () => {
              Linking.openURL(`tel:${phoneNumber}`);
            },
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF4444" />
        <Text style={styles.loadingText}>Loading alert details...</Text>
      </View>
    );
  }

  if (error || !alertData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>⚠️ {error || 'Alert not found'}</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    name,
    alertType,
    timestamp,
    cellphone,
    location,
    additionalInfo
  } = alertData;

  // Format timestamp
  const formatTimestamp = (ts) => {
    if (!ts) return 'Unknown time';
    
    try {
      const date = ts?.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return 'Invalid timestamp';
    }
  };

  const when = formatTimestamp(timestamp);
  const instruction = instructionsMap[alertType] || instructionsMap.Other;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Emergency Header */}
      <View style={[styles.emergencyHeader, { backgroundColor: instruction.color }]}>
        <Text style={styles.emergencyTitle}>🚨 EMERGENCY ALERT</Text>
        <Text style={styles.emergencySubtitle}>Your neighbor needs help</Text>
      </View>

      {/* Alert Details */}
      <View style={styles.alertCard}>
        <View style={styles.field}>
          <Text style={styles.label}>👤 Who?</Text>
          <Text style={styles.value}>{name || 'Anonymous Neighbor'}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>⚠️ Why?</Text>
          <Text style={[styles.value, styles.alertType]}>{alertType}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>🕐 When?</Text>
          <Text style={styles.value}>{when}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>📱 Contact</Text>
          <TouchableOpacity 
            onPress={() => handleCallNeighbor(cellphone)}
            disabled={!cellphone || cellphone === 'N/A'}
          >
            <Text style={[
              styles.value, 
              styles.phoneNumber,
              (!cellphone || cellphone === 'N/A') && styles.disabledPhone
            ]}>
              {cellphone || 'No phone number provided'}
            </Text>
          </TouchableOpacity>
        </View>

        {location && (
          <View style={styles.field}>
            <Text style={styles.label}>📍 Location</Text>
            <Text style={styles.value}>{location}</Text>
          </View>
        )}

        {additionalInfo && (
          <View style={styles.field}>
            <Text style={styles.label}>ℹ️ Additional Info</Text>
            <Text style={styles.value}>{additionalInfo}</Text>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsLabel}>📋 What should you do?</Text>
        <Text style={[styles.instructionText, { color: instruction.color }]}>
          {instruction.text}
        </Text>
        
        <TouchableOpacity 
          style={[styles.emergencyButton, { backgroundColor: instruction.color }]}
          onPress={() => handleEmergencyCall(instruction.number)}
        >
          <Text style={styles.emergencyButtonText}>
            {instruction.action} ({instruction.number})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Timestamp Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Alert received: {when}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emergencyHeader: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  emergencyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  emergencySubtitle: {
    fontSize: 16,
    color: 'white',
    marginTop: 4,
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  field: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  value: {
    fontSize: 18,
    color: '#555',
    lineHeight: 24,
  },
  alertType: {
    fontWeight: '700',
    color: '#FF4444',
    fontSize: 20,
  },
  phoneNumber: {
    color: '#007AFF',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  disabledPhone: {
    color: '#999',
    textDecorationLine: 'none',
  },
  instructionsCard: {
    backgroundColor: '#FFFBF0',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  instructionsLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 16,
  },
  emergencyButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});