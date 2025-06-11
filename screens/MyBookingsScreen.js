// screens/MyBookingsScreen.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Alert, Platform } from 'react-native';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext'; // Import AuthContext
import colors from '../constants/colors';
import commonStyles from '../constants/styles';
import BookingCard from '../components/BookingCard'; // Ensure this component exists and is correct

export default function MyBookingsScreen() {
  const { user, db, loading: authLoading } = useContext(AuthContext); // Get user and db from AuthContext
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Use user.uid from AuthContext, which handles authentication state
  const clientUid = user?.uid;

  // Fetch client's bookings from Firestore
  const fetchMyBookings = useCallback(async () => {
    setLoading(true);
    setError(''); // Reset error state

    if (!clientUid || !db) {
      console.warn('Client not logged in or DB not initialized. Skipping booking fetch.');
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      const bookingsRef = collection(db, 'bookings'); // Use db from AuthContext
      const q = query(
        bookingsRef,
        where('clientId', '==', clientUid), // Correct field name: 'clientId'
        orderBy('date', 'asc'),
        orderBy('time', 'asc') // Correct field name: 'time'
      );
      const querySnapshot = await getDocs(q);
      const fetchedBookings = [];

      for (const docSnap of querySnapshot.docs) {
        const bookingData = docSnap.data();

        // 1. Fetch Barber details (name, photo, services)
        let barberName = bookingData.barberName || 'Unknown Barber'; // Use denormalized name first
        let barberProfilePhoto = 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Photo';
        let barberServicesMap = {}; // To store the barber's services for lookup

        try {
          const barberRef = doc(db, 'users', bookingData.barberId);
          const barberSnap = await getDoc(barberRef);
          if (barberSnap.exists()) {
            const barberDetails = barberSnap.data();
            barberName = barberDetails.businessName || `${barberDetails.firstName || ''} ${barberDetails.lastName || ''}`.trim() || barberName;
            barberProfilePhoto = barberDetails.profilePhotoUrl || barberProfilePhoto;
            barberServicesMap = barberDetails.services || {}; // Get the services map
          }
        } catch (barberFetchError) {
          console.error("Error fetching barber details for booking:", bookingData.id, barberFetchError);
        }

        // 2. Derive service names from serviceIds using the fetched barberServicesMap
        let servicesSummary = 'No Services';
        if (bookingData.serviceIds && bookingData.serviceIds.length > 0) {
          const serviceNames = bookingData.serviceIds.map(serviceId => {
            const service = barberServicesMap[serviceId]; // Access service by its ID/key
            return service ? service.name : `Unknown Service (${serviceId.substring(0, 4)}...)`;
          }).join(', ');
          servicesSummary = serviceNames;
        }

        fetchedBookings.push({
          id: docSnap.id,
          // Map Firestore data to BookingCard's expected props
          clientName: bookingData.clientName, // clientName is denormalized in booking doc
          serviceName: servicesSummary, // Mapped from fetched services
          bookingDate: bookingData.date, // This is the 'date' string (YYYY-MM-DD)
          bookingTime: bookingData.time, // This is the 'time' string (HH:MM)
          price: bookingData.totalPrice, // Mapped from totalPrice
          status: bookingData.status,
          notes: bookingData.notes || '', // Assuming a 'notes' field might exist
          // Include other data needed by BookingCard or for internal use
          barberId: bookingData.barberId,
          barberDisplayName: barberName, // For display
          barberProfilePhoto: barberProfilePhoto, // For display
          totalDuration: bookingData.totalDuration,
          createdAt: bookingData.createdAt, // This is a Firestore Timestamp
        });
      }
      setBookings(fetchedBookings);
    } catch (error) {
      console.error("Error fetching my bookings:", error);
      setError('Failed to load your bookings. Please try again.');
      Alert.alert('Error', 'Could not load your bookings.');
    } finally {
      setLoading(false);
    }
  }, [clientUid, db]); // Re-fetch if clientUid or db changes

  useEffect(() => {
    // Only fetch bookings once AuthContext is ready
    if (!authLoading) {
      fetchMyBookings();
    }
  }, [authLoading, fetchMyBookings]); // Depend on authLoading and fetchMyBookings

  if (loading) {
    return (
      <View style={[commonStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12 }}>Loading your bookings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[commonStyles.container, styles.center]}>
        <Text style={styles.errorText}>{error}</Text>
        {/* You could add a retry button here */}
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={[commonStyles.container, styles.center]}>
        <Text style={styles.noBookingsText}>You don't have any upcoming bookings yet.</Text>
        <Text style={styles.noBookingsTextSub}>Book a haircut from the Home tab!</Text>
      </View>
    );
  }

  // --- Render each booking item using BookingCard ---
  const renderBookingItem = ({ item }) => (
    <BookingCard
      booking={{
        id: item.id,
        clientName: item.clientName,
        serviceName: item.serviceName,
        // For BookingCard's expected 'bookingDate' prop, we'll pass the 'date' string
        // The BookingCard itself will parse/format it from string.
        bookingDate: item.bookingDate,
        time: item.bookingTime, // Pass the time string to BookingCard
        totalPrice: item.price, // Pass totalPrice as 'price' for BookingCard
        notes: item.notes,
        status: item.status,
        clientPhotoUrl: item.clientPhotoUrl, // Pass if BookingCard uses it
        barberDisplayName: item.barberDisplayName, // Pass if BookingCard uses it
        barberProfilePhoto: item.barberProfilePhoto, // Pass if BookingCard uses it
        // Pass createdAt if BookingCard needs to display it using .toDate()
        createdAt: item.createdAt
      }}
      // If clients can cancel, implement handleCancelBooking and pass it here:
      // onCancel={() => handleCancelBooking(item.id)}
    />
  );

  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.title}>My Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={item => item.id}
        renderItem={renderBookingItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  bookingItem: { // This style is for an inlined item, but we are using BookingCard
    backgroundColor: colors.cardBackground,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookingDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 5,
  },
  bookingTime: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 5,
  },
  bookingBarber: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  noBookingsText: {
    fontSize: 18,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  noBookingsTextSub: {
    fontSize: 16,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginVertical: 20,
  },
});