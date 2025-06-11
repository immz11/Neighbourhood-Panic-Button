// screens/ClientDashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { auth, firestore } from '../services/firebaseConfig.js';
import colors from '../constants/colors';
import commonStyles from '../constants/styles';
import { formatDateForPicker } from '../utils/dateHelpers'; // <--- UPDATED IMPORT PATH

// Helper function to format date for display - REMOVE THIS BLOCK from here!
// const formatDateForPicker = (isoDateString) => {
//   const date = new Date(isoDateString);
//   const options = { weekday: 'short', month: 'short', day: 'numeric' };
//   return date.toLocaleDateString(undefined, options);
// };

export default function ClientDashboard({ navigation }) {
  // ─── State ──────────────────────────────────────────
  const [barbers, setBarbers] = useState([]);
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [selectedBarberName, setSelectedBarberName] = useState('Loading...');
  const [selectedBarberPhoto, setSelectedBarberPhoto] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // ─── Map weekday name to JS Date index (0 = Sunday, 6 = Saturday)
  const weekdayToIndex = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  // ─── Step 1: Fetch all barbers on mount
  useEffect(() => {
    async function fetchAllBarbers() {
      setLoading(true);
      try {
        const barbersColRef = collection(firestore, 'users');
        const q = query(barbersColRef, where('role', '==', 'barber'));
        const barbersSnapshot = await getDocs(q);

        if (barbersSnapshot.empty) {
          Alert.alert('No Barbers Found', 'There are no barbers registered in the system yet.');
          setBarbers([]);
          setSelectedBarberId('');
          setSelectedBarberName('No Barbers');
          setSelectedBarberPhoto(null);
          setLoading(false);
          return;
        }

        const fetchedBarbers = barbersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBarbers(fetchedBarbers);

        if (fetchedBarbers.length > 0) {
          setSelectedBarberId(fetchedBarbers[0].id);
          setSelectedBarberName(fetchedBarbers[0].name || fetchedBarbers[0].firstName || 'Unnamed Barber');
          setSelectedBarberPhoto(fetchedBarbers[0].profilePhotoUrl || null);
        } else {
          setSelectedBarberId('');
          setSelectedBarberName('No Barbers');
          setSelectedBarberPhoto(null);
        }
      } catch (error) {
        console.error('Error fetching barbers:', error);
        Alert.alert('Error', 'Failed to fetch barbers. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchAllBarbers();
  }, [refreshKey]);

  // ─── Step 2: Once a barber is selected (or initially set), fetch their availability
  useEffect(() => {
    if (!selectedBarberId) {
      setAvailableDates([]);
      setLoading(false);
      return;
    }

    async function fetchBarberAvailability() {
      setLoading(true);
      try {
        const barberDocRef = doc(firestore, 'users', selectedBarberId);
        const barberSnapshot = await getDoc(barberDocRef);

        if (!barberSnapshot.exists()) {
          console.warn(`Barber ${selectedBarberId} does not exist in users collection.`);
          Alert.alert('Barber Not Found', `Details for ${selectedBarberName} could not be retrieved.`);
          setAvailableDates([]);
          setLoading(false);
          return;
        }

        const barberData = barberSnapshot.data();
        const availabilityMap = barberData.availability || {};
        const name = barberData.name || barberData.firstName || 'Unnamed Barber';
        const photoUrl = barberData.profilePhotoUrl || null;

        setSelectedBarberName(name);
        setSelectedBarberPhoto(photoUrl);
        computeNextAvailableDates(availabilityMap);
      } catch (error) {
        console.error('Error fetching barber availability:', error);
        Alert.alert('Error', `Failed to load ${selectedBarberName}'s availability.`);
      } finally {
        setLoading(false);
      }
    }

    fetchBarberAvailability();
  }, [selectedBarberId, refreshKey]);

  // ─── Helper: Given a weekly template, compute next 7 bookable dates
  // and their potential time slots.
  const computeNextAvailableDates = useCallback((availabilityMap) => {
    const today = new Date();
    const datesWithTimeSlots = [];
    let cursor = new Date(today);
    cursor.setHours(0, 0, 0, 0);

    const maxDaysToSearch = 30;
    let daysSearched = 0;

    while (datesWithTimeSlots.length < 7 && daysSearched < maxDaysToSearch) {
      const weekdayIndex = cursor.getDay();
      const currentDayName = Object.keys(weekdayToIndex).find(
        (key) => weekdayToIndex[key] === weekdayIndex
      );

      if (currentDayName && availabilityMap[currentDayName] && !availabilityMap[currentDayName].isClosed) {
        const { startTime, endTime } = availabilityMap[currentDayName];

        if (startTime && endTime) {
          const dateString = cursor.toISOString().split('T')[0];
          const startDateTime = new Date(`${dateString}T${startTime}:00`);
          const endDateTime = new Date(`${dateString}T${endTime}:00`);

          if (startDateTime < endDateTime) {
            datesWithTimeSlots.push({
              date: dateString,
              isoDate: `${dateString}T${startTime}:00Z`,
              startTime: startTime,
              endTime: endTime,
            });
          }
        }
      }

      cursor.setDate(cursor.getDate() + 1);
      daysSearched++;
    }

    setAvailableDates(datesWithTimeSlots);
    if (datesWithTimeSlots.length > 0) {
      setSelectedDate(datesWithTimeSlots[0].isoDate);
    } else {
      setSelectedDate('');
    }
  }, [weekdayToIndex]);

  // ─── When “Book Selected Date” is pressed
  const onPressBook = () => {
    if (!selectedDate || !selectedBarberId) {
      Alert.alert('Selection Error', 'Please select a barber and an available date.');
      return;
    }

    const selectedDateObject = availableDates.find(
      (item) => item.isoDate === selectedDate
    );

    if (!selectedDateObject) {
      Alert.alert('Error', 'Selected date not found.');
      return;
    }

    navigation.navigate('BookingScreen', {
      barberId: selectedBarberId,
      barberName: selectedBarberName,
      barberProfilePhoto: selectedBarberPhoto,
      date: selectedDateObject.date,
      availableStartTime: selectedDateObject.startTime,
      availableEndTime: selectedDateObject.endTime,
    });
  };

  // ─── Render ───────────────────────────────────────────
  if (loading) {
    return (
      <View style={[commonStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12 }}>Loading barbers and availability...</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.title}>Book a Haircut</Text>

      {barbers.length > 0 ? (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedBarberId}
            onValueChange={(itemValue) => {
              setSelectedBarberId(itemValue);
              const barber = barbers.find(b => b.id === itemValue);
              setSelectedBarberName(barber ? (barber.name || barber.firstName || 'Unnamed Barber') : 'No Barbers');
              setSelectedBarberPhoto(barber ? (barber.profilePhotoUrl || null) : null);
            }}
            style={styles.picker}
          >
            {barbers.map((barber) => (
              <Picker.Item
                key={barber.id}
                label={barber.name || barber.firstName || 'Unnamed Barber'}
                value={barber.id}
              />
            ))}
          </Picker>
        </View>
      ) : (
        <Text style={styles.noBarbersText}>No barbers available.</Text>
      )}

      {selectedBarberId && (
        <Text style={styles.selectedBarberInfo}>
          Selected Barber: **{selectedBarberName}**
        </Text>
      )}

      {availableDates.length > 0 && selectedBarberId ? (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedDate}
            onValueChange={(itemValue) => setSelectedDate(itemValue)}
            style={styles.picker}
          >
            {availableDates.map((item) => (
              <Picker.Item
                key={item.isoDate}
                label={formatDateForPicker(item.isoDate)}
                value={item.isoDate}
              />
            ))}
          </Picker>
        </View>
      ) : (
        selectedBarberId && <Text style={styles.noDatesText}>No available dates for {selectedBarberName}.</Text>
      )}

      <View style={styles.buttonWrapper}>
        <Button
          title="Book Selected Date & Time"
          onPress={onPressBook}
          color={colors.primary}
          disabled={!selectedDate || !selectedBarberId || availableDates.length === 0}
        />
      </View>

      <View style={styles.bottomButtons}>
        <Button
          title="Refresh Availability"
          onPress={() => setRefreshKey(prev => prev + 1)}
          color={colors.secondary}
        />
        <Button
          title="Go to Barber Dashboard (Dev Only)"
          onPress={() =>
            navigation.navigate('BarberApp', { screen: 'BarberHome' })
          }
          color={colors.tertiary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    marginVertical: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  buttonWrapper: {
    marginBottom: 20,
  },
  bottomButtons: {
    marginTop: 30,
    justifyContent: 'space-between',
    height: 120,
  },
  selectedBarberInfo: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  noBarbersText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    color: colors.error,
  },
  noDatesText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    color: colors.textSecondary,
  },
});