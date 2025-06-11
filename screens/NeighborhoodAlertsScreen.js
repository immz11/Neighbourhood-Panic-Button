// screens/NeighborhoodAlertsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native'; // Import TouchableOpacity
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

export default function NeighborhoodAlertsScreen() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [neighborhoodId, setNeighborhoodId] = useState(null);
  const currentUser = auth.currentUser;
  const navigation = useNavigation(); // Initialize useNavigation

  useEffect(() => {
    async function fetchUserNeighborhood() {
      if (!currentUser || currentUser.isAnonymous) {
        setLoading(false);
        return;
      }
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const { neighborhoodId: userNeighborhoodId } = userSnap.data();
          setNeighborhoodId(userNeighborhoodId);
        } else {
          Alert.alert('Error', 'User neighborhood information not found.');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching user neighborhood:', error);
        Alert.alert('Error', 'Failed to get neighborhood info.');
        setLoading(false);
      }
    }

    fetchUserNeighborhood();
  }, [currentUser]);

  useEffect(() => {
    if (!neighborhoodId) {
      if (!currentUser || currentUser.isAnonymous) {
         setLoading(false);
      }
      return;
    }

    const q = query(
      collection(db, 'panic_alerts'),
      where('neighborhoodId', '==', neighborhoodId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAlerts = [];
      snapshot.forEach((docSnap) => {
        fetchedAlerts.push({
          id: docSnap.id,
          ...docSnap.data(),
          timestamp: docSnap.data().timestamp?.toDate().toLocaleString(),
        });
      });
      setAlerts(fetchedAlerts);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching real-time alerts:', error);
      Alert.alert('Error', 'Failed to load neighborhood alerts.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [neighborhoodId, currentUser]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ED4C5C" />
      </View>
    );
  }

  if (!currentUser || currentUser.isAnonymous) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>
          Neighborhood alerts are not available for anonymous users. Please sign in.
        </Text>
      </View>
    );
  }

  if (!neighborhoodId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>
          Could not determine your neighborhood to fetch alerts.
        </Text>
      </View>
    );
  }

  if (alerts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No active alerts in your neighborhood.</Text>
      </View>
    );
  }

  const handlePressAlert = (alertItem) => {
    navigation.navigate('PanicAlertDetails', { alert: alertItem });
  };

  const renderAlertItem = ({ item }) => (
    <TouchableOpacity onPress={() => handlePressAlert(item)} style={styles.alertCard}>
      <Text style={styles.alertType}>
        Emergency Type: {item.emergencyType || 'Not specified'}
      </Text>
      <Text style={styles.alertSender}>
        {item.anonymous ? 'Sender: Anonymous' : `Sender: ${item.name || 'N/A'}`}
      </Text>
      <Text style={styles.alertTimestamp}>Time: {item.timestamp}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={renderAlertItem}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 }} />
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderLeftWidth: 5,
    borderLeftColor: '#ED4C5C',
  },
  alertType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D00000',
    marginBottom: 5,
  },
  alertSender: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  alertTimestamp: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
  },
});