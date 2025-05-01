import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function ReportScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Report</Text>
      <Button title="Threats Report" onPress={() => {}} />
      <Button title="Break-In Report" onPress={() => {}} />
      <Button title="Suspicious Activity Report" onPress={() => {}} />
      <Button title="Property Damage Report" onPress={() => {}} />
      <Button title="Stolen Property Report" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
});
