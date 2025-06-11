// /components/NeighborhoodInfo.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default function NeighborhoodInfo() {
  const [neighborhood, setNeighborhood] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.isAnonymous) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // 1. Fetch user document to get neighborhoodId
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userSnap.exists()) {
          console.warn('User document not found');
          setLoading(false);
          return;
        }
        const { neighborhoodId } = userSnap.data();

        // 2. Fetch neighborhood details
        const nbSnap = await getDoc(doc(db, 'neighborhoods', neighborhoodId));
        if (nbSnap.exists()) {
          setNeighborhood(nbSnap.data());
        }

        // 3. Fetch all panic alerts for this neighborhood
        const alertsQuery = query(
          collection(db, 'panic_alerts'),
          where('neighborhoodId', '==', neighborhoodId)
        );
        const alertSnaps = await getDocs(alertsQuery);
        const allAlerts = alertSnaps.docs.map(d => ({ id: d.id, ...d.data() }));

        // 4. Filter alerts to last 10 minutes on client-side
        const tenMinutesAgoDate = new Date(Date.now() - 10 * 60 * 1000);
        const recent = allAlerts.filter(item => {
          const ts = item.timestamp;
          const date = ts.toDate ? ts.toDate() : new Date(ts);
          return date >= tenMinutesAgoDate;
        });

        setAlerts(recent);
      } catch (err) {
        console.error('Error loading neighborhood or alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#333" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {neighborhood ? (
        <>
          <Text style={styles.header}>
            Neighborhood: {neighborhood.name} ({neighborhood.town})
          </Text>

          <Text style={styles.subheader}>Recent Panic Alerts (last 10 min):</Text>
          {alerts.length > 0 ? (
            <FlatList
              data={alerts}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const ts = item.timestamp;
                const date = ts.toDate ? ts.toDate() : new Date(ts);
                const senderName = item.anonymous ? 'Anonymous' : item.name || 'Unknown';
                return (
                  <View style={styles.alertItem}>
                    <Text style={styles.alertText}>
                      • {senderName}: {date.toLocaleString()}
                    </Text>
                  </View>
                );
              }}
            />
          ) : (
            <Text style={styles.noAlertText}>No recent alerts.</Text>
          )}
        </>
      ) : (
        <Text style={styles.noInfoText}>
          Unable to load neighborhood info.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    paddingHorizontal: 15,
  },
  loadingContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  subheader: {
    fontSize: 16,
    marginBottom: 6,
    color: '#555',
  },
  alertItem: {
    paddingVertical: 6,
  },
  alertText: {
    fontSize: 14,
    color: '#E74C3C',
  },
  noAlertText: {
    fontSize: 14,
    color: '#777',
    fontStyle: 'italic',
  },
  noInfoText: {
    fontSize: 14,
    color: '#777',
    fontStyle: 'italic',
  },
});
