// /screens/PanicButtonScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useUser } from '../UserContext';

export default function PanicButtonScreen({ navigation }) {
  const { user } = useUser();

  const handlePress = (type) => {
    navigation.navigate('PanicScreen', { emergencyType: type });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Emergency Type</Text>

      <TouchableOpacity
        style={[styles.panicButton, { backgroundColor: '#E74C3C' }]}
        onPress={() => handlePress('Fire')}
      >
        <Text style={styles.buttonText}>Fire</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.panicButton, { backgroundColor: '#F1C40F' }]}
        onPress={() => handlePress('BreakingAndEntering')}
      >
        <Text style={styles.buttonText}>Breaking & Entering</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.panicButton, { backgroundColor: '#3498DB' }]}
        onPress={() => handlePress('Other')}
      >
        <Text style={styles.buttonText}>Other</Text>
      </TouchableOpacity>

      <Text style={styles.smallText}>
        {user
          ? 'Logged in: this alert will include your details.'
          : 'Not logged in: this alert will be sent anonymously.'}
      </Text>
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
    fontWeight: 'bold',
  },
  panicButton: {
    width: '80%',
    paddingVertical: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  smallText: {
    marginTop: 20,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
