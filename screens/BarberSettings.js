// screens/BarberSettings.js
import React, { useState, useEffect, useContext } from 'react'; // Added useEffect, useContext
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput, // Added for input fields
  FlatList, // For displaying services
  TouchableOpacity, // For service items
  Platform,
  Alert,
} from 'react-native';
import Button from '../components/Button';
import colors from '../constants/colors';
import commonStyles from '../constants/styles';
import DateTimePicker from '@react-native-community/datetimepicker'; // For operating hours
import { format, parseISO, setHours, setMinutes } from 'date-fns'; // For date/time formatting
import { auth, firestore } from '../services/firebaseConfig'; // Import Firebase
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext'; // To get current user details

export default function BarberSettings({ navigation }) {
  const { user, db } = useContext(AuthContext); // Get user from AuthContext
  const [activeSetting, setActiveSetting] = useState(null); // 'profile', 'services', 'hours'
  const [profileData, setProfileData] = useState({ // For Edit Profile (basic fields)
    firstName: '',
    lastName: '',
    phoneNumber: '',
    shopName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bio: '',
  });

  const [services, setServices] = useState([]); // For Manage Services
  const [newService, setNewService] = useState({ name: '', price: '', duration: '' });
  const [editingServiceId, setEditingServiceId] = useState(null);

  const [operatingHours, setOperatingHours] = useState({}); // For Operating Hours
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('start'); // 'start' or 'end'
  const [selectedDay, setSelectedDay] = useState(null);
  const [pickerTime, setPickerTime] = useState(new Date());

  useEffect(() => {
    if (user && db) {
      fetchBarberData();
    }
  }, [user, db]);

  const fetchBarberData = async () => {
    try {
      const barberRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(barberRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phoneNumber: data.phoneNumber || '',
          shopName: data.shopName || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zipCode: data.zipCode || '',
          bio: data.bio || '',
        });
        setServices(data.services || []);
        // Convert Firestore operatingHours map to a more usable format if needed
        // Assuming Firestore stores times as "HH:mm" strings
        setOperatingHours(data.operatingHours || {});
      }
    } catch (error) {
      console.error('Error fetching barber data:', error);
      Alert.alert('Error', 'Failed to load your profile data.');
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !db) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    try {
      const barberRef = doc(db, 'users', user.uid);
      await updateDoc(barberRef, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phoneNumber,
        shopName: profileData.shopName,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        zipCode: profileData.zipCode,
        bio: profileData.bio,
        updatedAt: new Date(),
      });
      Alert.alert('Success', 'Profile updated successfully!');
      setActiveSetting(null); // Go back to main settings menu
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleAddService = async () => {
    if (!newService.name || !newService.price || !newService.duration) {
      Alert.alert('Error', 'Please fill all service fields.');
      return;
    }
    const servicePrice = parseFloat(newService.price);
    const serviceDuration = parseInt(newService.duration, 10);

    if (isNaN(servicePrice) || servicePrice <= 0) {
      Alert.alert('Error', 'Price must be a valid positive number.');
      return;
    }
    if (isNaN(serviceDuration) || serviceDuration <= 0) {
      Alert.alert('Error', 'Duration must be a valid positive number (minutes).');
      return;
    }

    const updatedServices = [...services];
    if (editingServiceId) {
      // Editing existing service
      const index = updatedServices.findIndex(s => s.serviceId === editingServiceId);
      if (index !== -1) {
        updatedServices[index] = {
          ...updatedServices[index],
          name: newService.name,
          price: servicePrice,
          duration: serviceDuration,
        };
      }
      setEditingServiceId(null);
    } else {
      // Adding new service
      updatedServices.push({
        serviceId: Math.random().toString(36).substring(2, 15), // Simple unique ID
        name: newService.name,
        price: servicePrice,
        duration: serviceDuration,
      });
    }

    await updateBarberServices(updatedServices);
    setServices(updatedServices);
    setNewService({ name: '', price: '', duration: '' }); // Clear input
  };

  const handleEditService = (service) => {
    setNewService({
      name: service.name,
      price: service.price.toString(),
      duration: service.duration.toString(),
    });
    setEditingServiceId(service.serviceId);
  };

  const handleDeleteService = async (serviceId) => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            const updatedServices = services.filter(s => s.serviceId !== serviceId);
            await updateBarberServices(updatedServices);
            setServices(updatedServices);
            setEditingServiceId(null); // Clear editing state if deleted
            setNewService({ name: '', price: '', duration: '' }); // Clear input
          },
          style: 'destructive',
        },
      ]
    );
  };

  const updateBarberServices = async (updatedServices) => {
    if (!user || !db) return;
    try {
      const barberRef = doc(db, 'users', user.uid);
      await updateDoc(barberRef, {
        services: updatedServices,
        updatedAt: new Date(),
      });
      Alert.alert('Success', 'Services updated!');
    } catch (error) {
      console.error('Error updating services:', error);
      Alert.alert('Error', 'Failed to update services.');
    }
  };

  const handleSetOperatingHours = async (day, type, time) => {
    const updatedHours = { ...operatingHours };
    if (!updatedHours[day]) {
      updatedHours[day] = { start: null, end: null, isClosed: false };
    }

    if (type === 'isClosed') {
      updatedHours[day].isClosed = time; // `time` here is a boolean true/false
      if (time) {
        updatedHours[day].start = null;
        updatedHours[day].end = null;
      }
    } else {
      updatedHours[day][type] = format(time, 'HH:mm');
      updatedHours[day].isClosed = false; // If setting times, it's not closed
    }

    setOperatingHours(updatedHours);
    // Persist to Firestore immediately or add a "Save" button
    await updateBarberOperatingHours(updatedHours);
  };

  const updateBarberOperatingHours = async (hoursData) => {
    if (!user || !db) return;
    try {
      const barberRef = doc(db, 'users', user.uid);
      await updateDoc(barberRef, {
        operatingHours: hoursData,
        updatedAt: new Date(),
      });
      Alert.alert('Success', 'Operating hours updated!');
    } catch (error) {
      console.error('Error updating operating hours:', error);
      Alert.alert('Error', 'Failed to update operating hours.');
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios'); // Keep picker open on iOS
    if (selectedTime) {
      if (pickerMode === 'start') {
        handleSetOperatingHours(selectedDay, 'start', selectedTime);
      } else {
        handleSetOperatingHours(selectedDay, 'end', selectedTime);
      }
    }
  };

  const getPickerValueForTime = (day, type) => {
    const timeString = operatingHours[day]?.[type];
    if (timeString) {
      // Create a date object with today's date and the stored time
      const [hours, minutes] = timeString.split(':').map(Number);
      return setMinutes(setHours(new Date(), hours), minutes);
    }
    return new Date(); // Default to current time if no value
  };

  const renderEditProfile = () => (
    <View style={styles.subsection}>
      <Text style={styles.subsectionTitle}>Edit Profile</Text>
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={profileData.firstName}
        onChangeText={(text) => setProfileData({ ...profileData, firstName: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={profileData.lastName}
        onChangeText={(text) => setProfileData({ ...profileData, lastName: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        keyboardType="phone-pad"
        value={profileData.phoneNumber}
        onChangeText={(text) => setProfileData({ ...profileData, phoneNumber: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Shop Name"
        value={profileData.shopName}
        onChangeText={(text) => setProfileData({ ...profileData, shopName: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Address"
        value={profileData.address}
        onChangeText={(text) => setProfileData({ ...profileData, address: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="City"
        value={profileData.city}
        onChangeText={(text) => setProfileData({ ...profileData, city: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="State"
        value={profileData.state}
        onChangeText={(text) => setProfileData({ ...profileData, state: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Zip Code"
        keyboardType="numeric"
        value={profileData.zipCode}
        onChangeText={(text) => setProfileData({ ...profileData, zipCode: text })}
      />
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Bio"
        multiline
        value={profileData.bio}
        onChangeText={(text) => setProfileData({ ...profileData, bio: text })}
      />
      <Button title="Save Profile" onPress={handleUpdateProfile} style={styles.saveButton} />
      <Button title="Back to Settings" onPress={() => setActiveSetting(null)} type="secondary" />
    </View>
  );

  const renderManageServices = () => (
    <View style={styles.subsection}>
      <Text style={styles.subsectionTitle}>Manage Services</Text>

      <TextInput
        style={styles.input}
        placeholder="Service Name"
        value={newService.name}
        onChangeText={(text) => setNewService({ ...newService, name: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Price (e.g., 25.00)"
        keyboardType="numeric"
        value={newService.price}
        onChangeText={(text) => setNewService({ ...newService, price: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Duration (minutes)"
        keyboardType="numeric"
        value={newService.duration}
        onChangeText={(text) => setNewService({ ...newService, duration: text })}
      />
      <Button
        title={editingServiceId ? 'Save Changes' : 'Add Service'}
        onPress={handleAddService}
        style={styles.addButton}
      />
      {editingServiceId && (
        <Button
          title="Cancel Edit"
          onPress={() => {
            setEditingServiceId(null);
            setNewService({ name: '', price: '', duration: '' });
          }}
          type="secondary"
          style={styles.cancelButton}
        />
      )}

      <Text style={styles.listHeader}>Your Services:</Text>
      {services.length === 0 ? (
        <Text style={styles.emptyText}>No services added yet.</Text>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.serviceId}
          renderItem={({ item }) => (
            <View style={styles.serviceItem}>
              <View style={styles.serviceTextContainer}>
                <Text style={styles.serviceName}>{item.name}</Text>
                <Text style={styles.serviceDetails}>
                  ${item.price.toFixed(2)} • {item.duration} min
                </Text>
              </View>
              <View style={styles.serviceActions}>
                <TouchableOpacity onPress={() => handleEditService(item)} style={styles.iconButton}>
                  <Text style={styles.iconButtonText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteService(item.serviceId)} style={styles.iconButton}>
                  <Text style={styles.iconButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
      <Button title="Back to Settings" onPress={() => setActiveSetting(null)} type="secondary" />
    </View>
  );

  const renderOperatingHours = () => (
    <View style={styles.subsection}>
      <Text style={styles.subsectionTitle}>Operating Hours</Text>
      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(
        (day) => (
          <View key={day} style={styles.hourRow}>
            <Text style={styles.dayText}>{day.charAt(0).toUpperCase() + day.slice(1)}:</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => {
                setSelectedDay(day);
                setPickerMode('start');
                setPickerTime(getPickerValueForTime(day, 'start'));
                setShowTimePicker(true);
              }}
              disabled={operatingHours[day]?.isClosed}
            >
              <Text style={styles.timeButtonText}>
                {operatingHours[day]?.isClosed
                  ? 'Closed'
                  : operatingHours[day]?.start || 'Set Start'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.timeSeparator}>-</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => {
                setSelectedDay(day);
                setPickerMode('end');
                setPickerTime(getPickerValueForTime(day, 'end'));
                setShowTimePicker(true);
              }}
              disabled={operatingHours[day]?.isClosed}
            >
              <Text style={styles.timeButtonText}>
                {operatingHours[day]?.isClosed
                  ? ''
                  : operatingHours[day]?.end || 'Set End'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.closeButton,
                operatingHours[day]?.isClosed && styles.closeButtonActive,
              ]}
              onPress={() => handleSetOperatingHours(day, 'isClosed', !operatingHours[day]?.isClosed)}
            >
              <Text style={styles.closeButtonText}>
                {operatingHours[day]?.isClosed ? 'Open' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        )
      )}

      {showTimePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={pickerTime}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}
      <Button title="Back to Settings" onPress={() => setActiveSetting(null)} type="secondary" />
    </View>
  );

  const renderMainSettings = () => (
    <>
      {/* Edit Profile Option */}
      <Button
        title="Edit Profile"
        onPress={() => setActiveSetting('profile')}
        style={styles.settingButton}
      />

      {/* Manage Services Option */}
      <Button
        title="Manage Services"
        onPress={() => setActiveSetting('services')}
        style={styles.settingButton}
      />

      {/* Operating Hours Option */}
      <Button
        title="Operating Hours"
        onPress={() => setActiveSetting('hours')}
        style={styles.settingButton}
      />

      {/* Back to Dashboard Button */}
      <Button
        title="Back to Dashboard"
        onPress={() => navigation.navigate('BarberHome')}
        style={styles.settingButton}
      />
    </>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={commonStyles.title}>Barber Settings</Text>

        {activeSetting === 'profile' && renderEditProfile()}
        {activeSetting === 'services' && renderManageServices()}
        {activeSetting === 'hours' && renderOperatingHours()}
        {activeSetting === null && renderMainSettings()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
  },
  settingButton: {
    marginVertical: 10,
    width: '80%',
    backgroundColor: colors.primary,
  },
  subsection: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    width: '100%',
    color: colors.text,
    backgroundColor: colors.lightGray,
  },
  saveButton: {
    marginTop: 15,
    backgroundColor: colors.primary,
  },
  addButton: {
    marginTop: 10,
    backgroundColor: colors.secondary,
  },
  cancelButton: {
    marginTop: 5,
    backgroundColor: colors.gray,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: colors.text,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 10,
    fontSize: 14,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    width: '100%',
  },
  serviceTextContainer: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  serviceDetails: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  serviceActions: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  iconButton: {
    padding: 8,
    borderRadius: 5,
    marginLeft: 5,
    backgroundColor: colors.lightGray,
  },
  iconButtonText: {
    fontSize: 16,
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  dayText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    width: 90, // Fixed width for day names
  },
  timeButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1, // Take available space
    marginHorizontal: 5,
  },
  timeButtonText: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 14,
  },
  timeSeparator: {
    fontSize: 16,
    color: colors.textSecondary,
    marginHorizontal: 5,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: colors.secondary, // Default color for "Close"
    marginLeft: 10,
  },
  closeButtonActive: {
    backgroundColor: colors.primary, // Color when "Open" (currently closed)
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 14,
  },
});