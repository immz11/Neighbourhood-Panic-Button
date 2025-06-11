// screens/BookingScreen.js

import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { format, addMinutes, isAfter, parse } from 'date-fns';

import { AuthContext } from '../context/AuthContext';
import colors from '../constants/colors';
import commonStyles from '../constants/styles';
import Button from '../components/Button';
import { formatDateForPicker } from '../utils/dateHelpers';


export default function BookingScreen({ navigation, route }) {
  const { user, db, loading: authLoading } = useContext(AuthContext);
  const {
    barberId,
    barberName,
    barberProfilePhoto, // Keep this if you need it for display on THIS screen, but it won't be saved to booking
    date,
    availableStartTime,
    availableEndTime,
  } = route.params || {};

  const [barberServices, setBarberServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [error, setError] = useState('');

  // --- Fetch Barber's Services and Daily Available/Booked Slots ---
  useEffect(() => {
    async function fetchBookingDetails() {
      if (!barberId || !date || !db) {
        Alert.alert('Error', 'Barber or date information missing. Please go back.');
        setLoading(false);
        setError('Barber or date information missing.');
        return;
      }

      try {
        // 1. Fetch Barber's Services from their user document
        const barberUserRef = doc(db, 'users', barberId);
        const barberUserSnap = await getDoc(barberUserRef);

        if (barberUserSnap.exists()) {
          const barberData = barberUserSnap.data();

          // Transform services from map to array if necessary
          const fetchedServicesMap = barberData.services || {};
          const formattedServicesArray = Object.keys(fetchedServicesMap).map(serviceId => ({
            serviceId: serviceId, // Use the key as the serviceId
            ...fetchedServicesMap[serviceId]
          }));
          setBarberServices(formattedServicesArray);
        } else {
          Alert.alert('Error', 'Barber not found in users collection.');
          setError('Barber not found.');
          navigation.goBack();
          return;
        }

        // 2. Fetch Daily Availability and Booked Slots from new collection
        const dailyAvailabilityDocId = `${barberId}_${date}`;
        const dailyAvailabilityRef = doc(db, 'barberDailyAvailability', dailyAvailabilityDocId);
        const dailyAvailabilitySnap = await getDoc(dailyAvailabilityRef);

        let specificSlots = [];
        let bookedSlotsForDate = [];

        if (dailyAvailabilitySnap.exists()) {
          const dailyData = dailyAvailabilitySnap.data();
          // NOTE: Changed from specificAvailableSlots to availableSlots as per data model
          specificSlots = dailyData.availableSlots || [];
          bookedSlotsForDate = dailyData.bookedSlots || [];
        }

        generateBookableTimeSlots(specificSlots, bookedSlotsForDate);

      } catch (error) {
        console.error('Error fetching booking details:', error);
        Alert.alert('Error', 'Failed to load booking details. Please try again.');
        setError('Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchBookingDetails();
    }
  }, [barberId, date, db, availableStartTime, availableEndTime, authLoading, navigation]);

  // --- Generate Bookable Time Slots ---
  const generateBookableTimeSlots = useCallback((specificSlots, bookedSlots) => {
    let initialSlots = specificSlots;

    if (initialSlots.length === 0 && availableStartTime && availableEndTime) {
      console.log('Generating slots from general operating hours...');
      const start = parse(availableStartTime, 'HH:mm', new Date());
      const end = parse(availableEndTime, 'HH:mm', new Date());
      const slotDuration = 15;

      let currentTime = start;
      while (isAfter(end, addMinutes(currentTime, slotDuration - 1))) {
        const slot = format(currentTime, 'HH:mm');
        initialSlots.push(slot);
        currentTime = addMinutes(currentTime, slotDuration);
      }
    }

    const filteredSlots = initialSlots.filter(slot => !bookedSlots.includes(slot));

    setAvailableTimeSlots(filteredSlots.sort());
    if (filteredSlots.length > 0) {
      setSelectedTimeSlot(filteredSlots[0]);
    } else {
      setSelectedTimeSlot('');
    }
  }, [availableStartTime, availableEndTime]);


  // --- Update Total Price and Duration when services change ---
  useEffect(() => {
    let price = 0;
    let duration = 0;
    selectedServices.forEach((serviceId) => {
      const service = barberServices.find((s) => s.serviceId === serviceId);
      if (service) {
        price += service.price;
        duration += service.duration;
      }
    });
    setTotalPrice(price);
    setTotalDuration(duration);
  }, [selectedServices, barberServices]);

  // --- Toggle Service Selection ---
  const toggleService = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // --- Handle Booking Confirmation ---
  const handleConfirmBooking = async () => {
    if (selectedServices.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one service.');
      return;
    }
    if (!selectedTimeSlot) {
      Alert.alert('Selection Required', 'Please select a time slot.');
      return;
    }
    if (!user || !user.uid) {
      Alert.alert('Authentication Error', 'You must be logged in to book an appointment.');
      return;
    }

    setLoading(true);
    try {
      // 1. Get client's details (still need for clientName, but not photo URL for booking doc)
      const clientRef = doc(db, 'users', user.uid);
      const clientSnap = await getDoc(clientRef);
      const clientData = clientSnap.exists() ? clientSnap.data() : {};

      // 2. Create the new booking document
      const bookingRef = doc(collection(db, 'bookings'));
      await setDoc(bookingRef, {
        barberId: barberId,
        clientId: user.uid,
        date: date,
        time: selectedTimeSlot,
        serviceIds: selectedServices,
        totalPrice: totalPrice,
        totalDuration: totalDuration,
        status: 'pending',
        createdAt: serverTimestamp(),
        // Denormalized data for display in dashboards (NO PHOTO URLs HERE)
        clientName: clientData.firstName && clientData.lastName ? `${clientData.firstName} ${clientData.lastName}` : clientData.displayName || user.email || 'Client',
        barberName: barberName,
      });

      // 3. Update the barber's daily availability document
      const dailyAvailabilityDocId = `${barberId}_${date}`;
      const dailyAvailabilityRef = doc(db, 'barberDailyAvailability', dailyAvailabilityDocId);

      await setDoc(dailyAvailabilityRef, {
        barberId: barberId,
        date: date,
        bookedSlots: arrayUnion(selectedTimeSlot),
        lastUpdated: serverTimestamp(),
      }, { merge: true });


      Alert.alert('Booking Confirmed!', 'Your appointment has been successfully booked.');
      navigation.navigate('ClientAppointments');
    } catch (error) {
      console.error('Error confirming booking:', error);
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={commonStyles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={commonStyles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} type="secondary" />
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={commonStyles.title}>Book with {barberName}</Text>
        <Text style={styles.subtitle}>On: {formatDateForPicker(date)}</Text>

        {/* Services Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Services</Text>
          {barberServices.length === 0 ? (
            <Text style={styles.emptyText}>No services available for this barber.</Text>
          ) : (
            barberServices.map((service) => (
              <TouchableOpacity
                key={service.serviceId}
                style={[
                  styles.serviceItem,
                  selectedServices.includes(service.serviceId) && styles.serviceItemSelected,
                ]}
                onPress={() => toggleService(service.serviceId)}
              >
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.servicePrice}>${service.price.toFixed(2)}</Text>
                <Text style={styles.serviceDuration}>{service.duration} min</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Time Slot Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time Slot</Text>
          {availableTimeSlots.length > 0 ? (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedTimeSlot}
                onValueChange={(itemValue) => setSelectedTimeSlot(itemValue)}
                style={styles.picker}
              >
                {availableTimeSlots.map((slot) => (
                  <Picker.Item key={slot} label={slot} value={slot} />
                ))}
              </Picker>
            </View>
          ) : (
            <Text style={styles.emptyText}>No available time slots for this date.</Text>
          )}
        </View>

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>Total Price: **${totalPrice.toFixed(2)}**</Text>
          <Text style={styles.summaryText}>Estimated Duration: **{totalDuration} minutes**</Text>
        </View>

        {/* Confirm Button */}
        <Button
          title="Confirm Booking"
          onPress={handleConfirmBooking}
          style={styles.confirmButton}
          disabled={selectedServices.length === 0 || !selectedTimeSlot || loading}
        />
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          type="secondary"
          style={styles.backButton}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  section: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 5,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.lightGray,
  },
  serviceItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    flex: 2,
  },
  servicePrice: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  serviceDuration: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 0.8,
    textAlign: 'right',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 10,
    fontSize: 14,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginVertical: 10,
    overflow: 'hidden',
    backgroundColor: colors.lightGray,
  },
  picker: {
    height: 50,
    width: '100%',
    color: colors.text,
  },
  summaryContainer: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  confirmButton: {
    marginVertical: 10,
    backgroundColor: colors.primary,
  },
  backButton: {
    marginVertical: 5,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginVertical: 20,
  },
});