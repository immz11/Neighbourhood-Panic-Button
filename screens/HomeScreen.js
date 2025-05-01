import React from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Hi, Ms Nangolo</Text>
      <Text style={styles.subtitle}>+264 81 563 4143</Text>

      <Button
        title="🚨 Press Panic Button"
        color="red"
        onPress={() => navigation.navigate('Alert')}
      />

      <Text style={styles.section}>Nearby Neighbors</Text>
      <Text>Ethan - +264 81 283 0220</Text>
      <Text>Freddy - +264 81 676 0509</Text>

      <Button
        title="📋 Make a Report"
        onPress={() => navigation.navigate('Report')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, justifyContent: 'flex-start' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, marginBottom: 20 },
  section: { fontSize: 18, marginTop: 30, marginBottom: 10, fontWeight: '600' },
});
