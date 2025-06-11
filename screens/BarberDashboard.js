// screens/BarberDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  orderBy,
  arrayRemove,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore, auth } from '../services/firebaseConfig';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

// Import components
import BookingCard from '../components/BookingCard';
import Button from '../components/Button';

// Import styles
import colors from '../constants/colors';
import commonStyles from '../constants/styles';

const screenHeight = Dimensions.get('window').height;

const BarberDashboard = () => {
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [loadingBookings, setLoadingBookings] = useState(true);
  const navigation = useNavigation();

  // Fetch upcoming bookings for this barber
  const fetchBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      if (!auth.currentUser) {
        console.warn('No user logged in for BarberDashboard. Skipping booking fetch.');
        setUpcomingBookings([]);
        setLoadingBookings(false);
        return;
      }
      const barberId = auth.currentUser.uid;
      const q = query(
        collection(firestore, 'bookings'),
        where('barberId', '==', barberId),
        where('status', 'in', ['confirmed', 'pending']), // Fetch both confirmed and pending
        orderBy('date', 'asc'),
        orderBy('time', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const bookings = [];
      for (const docSnap of querySnapshot.docs) {
        const bookingData = docSnap.data();
        // Fetch client details for display
        const clientRef = doc(firestore, 'users', bookingData.clientId);
        const clientSnap = await getDoc(clientRef);
        
        let clientDisplayName = 'Unknown Client';
        let clientPhotoUrl = 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Photo'; // Default photo
        
        if (clientSnap.exists()) {
          const clientDetails = clientSnap.data();
          clientDisplayName = `${clientDetails.firstName || ''} ${clientDetails.lastName || ''}`.trim() || clientDetails.displayName || 'Unknown Client';
          clientPhotoUrl = clientDetails.profilePhotoUrl || clientPhotoUrl; // Assuming client profiles have a photo URL
        }

        // Fetch service names for display
        let servicesSummary = 'No Services';
        if (bookingData.serviceIds && bookingData.serviceIds.length > 0) {
          const barberServicesRef = doc(firestore, 'users', barberId);
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

        bookings.push({
          id: docSnap.id,
          ...bookingData,
          clientDisplayName: clientDisplayName,
          clientPhotoUrl: clientPhotoUrl, // Pass client's photo URL
          servicesSummary: servicesSummary,
        });
      }
      setUpcomingBookings(bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Could not load bookings');
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings])
  );

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId) => {
    // --- DEBUG LOG: Function called ---
    console.log('handleCancelBooking called for ID:', bookingId);
    if (!bookingId) {
      console.error('bookingId is undefined in handleCancelBooking!');
      Alert.alert('Error', 'Invalid booking ID for cancellation.');
      return;
    }
    try {
      Alert.alert(
        "Confirm Cancellation",
        "Are you sure you want to cancel this booking?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes",
            onPress: async () => {
              // --- CRITICAL DEBUG LOG: Alert confirmed ---
              console.log('--- ALERT CONFIRMED: Proceeding with CANCELLATION for booking ID:', bookingId);
              try { // Nested try-catch for inner async operation
                // 1. Update booking status to 'cancelled'
                await updateDoc(doc(firestore, 'bookings', bookingId), {
                  status: 'cancelled',
                  updatedAt: serverTimestamp()
                });
                console.log('Firestore: Booking status updated to cancelled.'); // DEBUG

                // 2. Remove the slot from barber's bookedSlots in barberDailyAvailability
                const bookingToCancel = upcomingBookings.find(b => b.id === bookingId);
                if (bookingToCancel) {
                  const barberId = auth.currentUser.uid;
                  const dateStr = bookingToCancel.date; // e.g., 'YYYY-MM-DD'
                  const timeStr = bookingToCancel.time; // e.g., 'HH:mm'

                  const dailyAvailabilityRef = doc(firestore, 'barberDailyAvailability', `${barberId}_${dateStr}`);
                  const dailyAvailabilitySnap = await getDoc(dailyAvailabilityRef);

                  if (dailyAvailabilitySnap.exists()) {
                    await updateDoc(dailyAvailabilityRef, {
                      bookedSlots: arrayRemove(timeStr),
                      updatedAt: serverTimestamp(),
                    });
                    console.log('Firestore: Slot removed from barberDailyAvailability.'); // DEBUG
                  } else {
                    console.warn(`Daily availability document for ${dateStr} not found, cannot remove booked slot.`);
                  }
                }

                // Update local state
                setUpcomingBookings(prevBookings => prevBookings.filter(booking => booking.id !== bookingId));
                Alert.alert('Success', 'Booking cancelled successfully!');
              } catch (innerError) {
                console.error('Error during cancellation Firestore operations:', innerError); // Specific error log
                Alert.alert('Error', 'Failed to update booking status or availability. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error setting up cancellation alert:', error);
      Alert.alert('Error', 'An unexpected error occurred during cancellation.');
    }
  };

  // Handle booking acceptance
  const handleAcceptBooking = async (bookingId) => {
    // --- DEBUG LOG: Function called ---
    console.log('handleAcceptBooking called for ID:', bookingId);
    if (!bookingId) {
      console.error('bookingId is undefined in handleAcceptBooking!');
      Alert.alert('Error', 'Invalid booking ID for acceptance.');
      return;
    }
    try {
      Alert.alert(
        "Confirm Acceptance",
        "Are you sure you want to confirm this booking?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes",
            onPress: async () => {
              // --- CRITICAL DEBUG LOG: Alert confirmed ---
              console.log('--- ALERT CONFIRMED: Proceeding with ACCEPTANCE for booking ID:', bookingId);
              try { // Nested try-catch for inner async operation
                // Update booking status to 'confirmed'
                await updateDoc(doc(firestore, 'bookings', bookingId), {
                  status: 'confirmed',
                  updatedAt: serverTimestamp()
                });
                console.log('Firestore: Booking status updated to confirmed.'); // DEBUG

                // Update local state
                setUpcomingBookings(prevBookings =>
                  prevBookings.map(booking =>
                    booking.id === bookingId ? { ...booking, status: 'confirmed' } : booking
                  )
                );
                Alert.alert('Success', 'Booking confirmed successfully!');
              } catch (innerError) {
                console.error('Error during acceptance Firestore operation:', innerError); // Specific error log
                Alert.alert('Error', 'Failed to update booking status. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error setting up acceptance alert:', error);
      Alert.alert('Error', 'An unexpected error occurred during acceptance.');
    }
  };

  // Handle date selection for availability
  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      setShowTimePicker(true);
    }
  };

  // Handle time selection for availability
  const handleTimeChange = (event, time) => {
    setShowTimePicker(false);
    if (time) {
      setSelectedTime(time);
      saveAvailability(selectedDate, time);
    }
  };

  // Save specific date/time availability to Firebase (barberDailyAvailability collection)
  const saveAvailability = async (date, time) => {
    try {
      if (!auth.currentUser) {
        Alert.alert('Error', 'You must be logged in to set availability.');
        return;
      }
      const barberId = auth.currentUser.uid;
      const dateStr = format(date, 'yyyy-MM-dd');
      const timeStr = format(time, 'HH:mm');

      const dailyAvailabilityDocId = `${barberId}_${dateStr}`;
      const dailyAvailabilityRef = doc(firestore, 'barberDailyAvailability', dailyAvailabilityDocId);

      const dailyAvailabilitySnap = await getDoc(dailyAvailabilityRef);

      if (dailyAvailabilitySnap.exists()) {
        await updateDoc(dailyAvailabilityRef, {
          availableSlots: arrayUnion(timeStr),
          updatedAt: serverTimestamp(),
        });
        Alert.alert('Success', `Slot ${timeStr} added for ${dateStr}.`);
      } else {
        await setDoc(dailyAvailabilityRef, {
          barberId: barberId,
          date: dateStr,
          availableSlots: [timeStr],
          bookedSlots: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        Alert.alert('Success', `New availability day created for ${dateStr} with slot ${timeStr}.`);
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      Alert.alert('Error', 'Could not update availability. Please try again.');
    }
  };

  const renderBookingItem = ({ item }) => (
    <BookingCard
      booking={item}
      onCancel={() => handleCancelBooking(item.id)}
      onAccept={() => handleAcceptBooking(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={commonStyles.title}>Barber Dashboard</Text>

        {/* Availability Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Set Daily Availability Overrides</Text>
          <Button
            title="Add Specific Available Slot"
            onPress={() => {
              setSelectedDate(new Date());
              setSelectedTime(new Date());
              setShowDatePicker(true);
            }}
            style={styles.button}
          />

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
        </View>

        {/* Upcoming Bookings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
          {loadingBookings ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : upcomingBookings.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming bookings</Text>
          ) : (
            <FlatList
              data={upcomingBookings}
              keyExtractor={(item) => item.id}
              renderItem={renderBookingItem}
              style={styles.bookingsContainer}
            />
          )}
        </View>
      </ScrollView>

      {/* Navigation Buttons (fixed at the bottom) */}
      <View style={styles.navButtons}>
        <Button
          title="Messages"
          onPress={() => navigation.navigate('BarberChat')}
          style={styles.navButton}
        />
        <Button
          title="Settings"
          onPress={() => navigation.navigate('Settings')}
          style={styles.navButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 20,
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  button: {
    marginVertical: 8,
  },
  bookingsContainer: {
    maxHeight: screenHeight * 0.4,
    minHeight: 50,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.gray,
    marginVertical: 20,
    fontSize: 16,
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default BarberDashboard;