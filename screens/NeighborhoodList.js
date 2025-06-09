import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function NeighborhoodList({ neighborhoodId }) {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch neighborhoods
        const nbSnapshot = await getDocs(collection(db, 'neighborhoods'));
        const nbData = nbSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Fetch panic alerts and filter by neighborhoodId
        const alertSnapshot = await getDocs(collection(db, 'panic_alerts'));
        const allAlerts = alertSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const filteredAlerts = allAlerts.filter(alert => alert.neighborhoodId === neighborhoodId);
        
        setNeighborhoods(nbData);
        setAlerts(filteredAlerts);
      } catch (error) {
        console.error('Failed to fetch collections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [neighborhoodId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#888" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Neighborhoods</Text>
      {neighborhoods.map(nb => (
        <View key={nb.id} style={styles.card}>
          {Object.entries(nb).map(([key, value]) => (
            <Text key={key} style={styles.field}>
              <Text style={styles.fieldKey}>{key}:</Text> {String(value)}
            </Text>
          ))}
        </View>
      ))}

      <Text style={[styles.header, { marginTop: 20 }]}>Your Neighborhood’s Panic Alerts</Text>
      {alerts.length
        ? alerts.map(alert => (
            <View key={alert.id} style={styles.card}>
              {Object.entries(alert).map(([key, value]) => (
                <Text key={key} style={styles.field}>
                  <Text style={styles.fieldKey}>{key}:</Text>{' '}
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </Text>
              ))}
            </View>
          ))
        : <Text style={styles.noAlerts}>No panic alerts for your area.</Text>
      }
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  field: {
    fontSize: 14,
    marginBottom: 4,
  },
  fieldKey: {
    fontWeight: '500',
  },
  noAlerts: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
  },
});
