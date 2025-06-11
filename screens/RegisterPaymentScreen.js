// screens/RegisterPaymentScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import colors from '../constants/colors';

export default function RegisterPaymentScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register: Payment Info</Text>
      <Button title="Next: Terms" onPress={() => navigation.navigate('RegisterTerms')} color={colors.primary} />
      <Button title="Back to Preferences" onPress={() => navigation.navigate('RegisterPreferences')} color={colors.secondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
});
