import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function AlertScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Responders are en route.</Text>
      <Text style={styles.warning}>
        Stay safe, stay inside, and lock your doors. Avoid engaging with suspicious individuals.
      </Text>
      <Button title="Cancel Request" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 22, color: 'red', marginBottom: 20, textAlign: 'center' },
  warning: { fontSize: 16, marginBottom: 30, textAlign: 'center' },
});

import { db } from '../firebase';
import { addDoc, collection } from 'firebase/firestore';

useEffect(() => {
  (async () => {
    
    setLocation(loc.coords);
    
    // Save to Firestore
    await addDoc(collection(db, 'alerts'), {
      id: '04082400362',
      name: 'Ms Nangolo',
      phone: '+264 81 563 4143',
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      timestamp: new Date()
    });
  })();
}, []);
