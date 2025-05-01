import React, { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Your Mobile Number</Text>
      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        placeholder="+264 81 563 4143"
        value={phone}
        onChangeText={setPhone}
      />
      <Button title="Next" onPress={() => navigation.navigate('OTP')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, marginBottom: 20 },
  input: { borderWidth: 1, padding: 10, borderRadius: 5, marginBottom: 20 }
});
