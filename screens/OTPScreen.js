import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function OTPScreen({ navigation }) {
  const [otp, setOtp] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter your OTP code here</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="4-digit code"
        value={otp}
        onChangeText={setOtp}
        maxLength={4}
      />
      <Button title="Verify" onPress={() => navigation.navigate('PersonalInfo')} />
      <Text style={styles.resend}>RESEND NEW CODE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 20, marginBottom: 20 },
  input: { borderWidth: 1, padding: 10, borderRadius: 5, marginBottom: 20 },
  resend: { marginTop: 20, color: 'blue', textAlign: 'center' },
});
