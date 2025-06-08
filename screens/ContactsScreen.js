import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const currentData = currentUserDoc.data();
        const neighborhood = currentData?.neighborhood;

        const allUsers = await getDocs(collection(db, 'users'));
        const filteredContacts = [];

        allUsers.forEach(userDoc => {
          const data = userDoc.data();
          if (data.neighborhood === neighborhood && userDoc.id !== currentUser.uid) {
            filteredContacts.push({ id: userDoc.id, ...data });
          }
        });

        setContacts(filteredContacts);
      } catch (error) {
        console.error("Error loading contacts: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#ED4C5C" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contacts in Your Neighborhood</Text>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.fullName}</Text>
            <Text style={styles.phone}>{item.phoneNumber}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  card: { marginBottom: 10, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 8 },
  name: { fontSize: 18, fontWeight: '500' },
  phone: { color: '#555' },
});