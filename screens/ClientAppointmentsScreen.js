// screens/ClientAppointmentsScreen.js

import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
  Platform, // Don't forget this import for Platform.OS
  Image, // Added for profile photo
  TouchableOpacity, // Added if you have actions like cancel on the card
} from 'react-native';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import colors from '../constants/colors';
import commonStyles from '../constants/styles';
import { format, parseISO } from 'date-fns'; // Import parseISO for date strings

export default function ClientAppointmentsScreen({ navigation }) {
  const { user, db, loading: authLoading } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClientAppointments = useCallback(async () => {
    setLoading(true);
    if (!user || !user.uid || !db) {
      console.warn('Client not logged in or DB not initialized.');
      setAppointments([]);
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'bookings'),
        where('clientId', '==', user.uid),
        orderBy('date', 'asc'),
        orderBy('time', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const fetchedAppointments = [];

      for (const docSnap of querySnapshot.docs) {
        const bookingData = docSnap.data();

        // 1. Fetch Barber Details (including photo and full name)
        let barberDisplayName = bookingData.barberName || 'Unknown Barber';
        let barberProfilePhoto = 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Photo';

        try {
          const barberRef = doc(db, 'users', bookingData.barberId);
          const barberSnap = await getDoc(barberRef);
          if (barberSnap.exists()) {
            const barberDetails = barberSnap.data();
            barberDisplayName = barberDetails.businessName || `${barberDetails.firstName} ${barberDetails.lastName}`.trim() || barberDisplayName;
            barberProfilePhoto = barberDetails.profilePhotoUrl || barberProfilePhoto;
          }
        } catch (barberFetchError) {
          console.error("Error fetching barber details for booking:", bookingData.id, barberFetchError);
        }

        // 2. Fetch Service Names
        let servicesSummary = 'No Services';
        if (bookingData.serviceIds && bookingData.serviceIds.length > 0) {
            const barberServicesRef = doc(db, 'users', bookingData.barberId);
            const barberServicesSnap = await getDoc(barberServicesRef);
            if (barberServicesSnap.exists() && barberServicesSnap.data().services) {
                const barberServices = barberServicesSnap.data().services;
                const serviceNames = bookingData.serviceIds.map(serviceId => {
                    const service = barberServices[serviceId];
                    return service ? service.name : `Unknown Service (${serviceId.substring(0, 4)}...)`;
                }).join(', ');
                servicesSummary = serviceNames;
            } else {
                servicesSummary = bookingData.serviceIds.map(serviceId => `Service ${serviceId.substring(0, 4)}`).join(', ');
            }
        }

        fetchedAppointments.push({
          id: docSnap.id,
          ...bookingData,
          barberDisplayName: barberDisplayName,
          barberProfilePhoto: barberProfilePhoto,
          servicesSummary: servicesSummary,
        });
      }
      setAppointments(fetchedAppointments);
    } catch (err) {
      console.error('Error fetching client appointments:', err);
      setError('Failed to load appointments.');
      Alert.alert('Error', 'Could not load your appointments.');
    } finally {
      setLoading(false);
    }
  }, [user, db]);

  useEffect(() => {
    if (!authLoading) {
      fetchClientAppointments();
    }
  }, [authLoading, fetchClientAppointments]);

  // --- Start: Inlined rendering logic for each appointment item ---
  // This replaces the separate BookingCard component
  const renderAppointmentItem = ({ item }) => {
    // Correctly handle date and time strings
    const displayDate = item.date ? format(parseISO(item.date), 'PPP') : 'N/A Date'; // e.g., "June 10, 2025"
    const displayTime = item.time || 'N/A Time'; // e.g., "14:30"

    // If you need to display when the booking was created (assuming createdAt is a Timestamp)
    const bookingCreatedAt = item.createdAt
      ? format(item.createdAt.toDate(), 'MMM dd, yyyy HH:mm')
      : 'N/A';

    return (
      <View style={styles.card}>
        <Image source={{ uri: item.barberProfilePhoto }} style={styles.profilePhoto} />
        <View style={styles.details}>
          <Text style={styles.name}>{item.barberDisplayName}</Text>
          <Text style={styles.serviceSummary}>{item.servicesSummary || 'Services not listed'}</Text>
          <Text style={styles.dateTime}>{`${displayDate} at ${displayTime}`}</Text>
          <Text style={styles.status}>Status: {item.status}</Text>
          <Text style={styles.price}>Total: ${item.totalPrice?.toFixed(2) || '0.00'}</Text>
          {/* Optional: <Text style={styles.createdAt}>Booked: {bookingCreatedAt}</Text> */}
        </View>
        {/* Add a cancel button here if clients can cancel appointments */}
        {/* <TouchableOpacity style={styles.cancelButton} onPress={() => Alert.alert('Cancel', 'Implement cancel logic')}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity> */}
      </View>
    );
  };
  // --- End: Inlined rendering logic ---

  if (loading) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={commonStyles.loadingText}>Loading your appointments...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={commonStyles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={commonStyles.title}>Your Appointments</Text>
      {appointments.length === 0 ? (
        <Text style={styles.emptyText}>You have no upcoming appointments.</Text>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointmentItem} // Use the inlined function
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: colors.gray,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginVertical: 20,
  },
  // --- Styles for the inlined card ---
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  profilePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    backgroundColor: colors.lightGray,
  },
  details: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  serviceSummary: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  dateTime: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  status: {
    fontSize: 14,
    color: colors.gray,
    fontStyle: 'italic',
    marginTop: 5,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
    marginTop: 5,
  },
  createdAt: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cancelButton: {
    backgroundColor: colors.error,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  // --- End: Styles for the inlined card ---
});