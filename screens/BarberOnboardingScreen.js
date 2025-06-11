// screens/BarberOnboardingScreen.js
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Platform,
  Switch,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { AuthContext } from '../context/AuthContext';
import colors from '../constants/colors';
import commonStyles from '../constants/styles';
import Button from '../components/Button';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const DEFAULT_BARBER_AVATAR_URL =
  'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Photo';

export default function BarberOnboardingScreen({ navigation, route }) {
  const { uid } = route.params; // UID from SignupScreen
  const { db } = useContext(AuthContext); // firestore instance

  // ---------- STATE ----------
  // loading indicator for final submission
  const [loading, setLoading] = useState(false);

  // step of the multi-step form: 1 → Basic Info, 2 → Services, 3 → Availability
  const [currentStep, setCurrentStep] = useState(1);

  // Basic Info
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
    phoneNumber: '',
    address: '',
    profilePhotoUrl: '', // local URI or base64 (web)
  });
  const [localImageUri, setLocalImageUri] = useState(null);

  // Services (array of objects)
  const [services, setServices] = useState([
    { id: 'initial-1', name: '', price: '', duration: '' },
  ]);

  // Availability
  const initialAvailability = {
    monday: { selected: false, startTime: '09:00', endTime: '17:00' },
    tuesday: { selected: false, startTime: '09:00', endTime: '17:00' },
    wednesday: { selected: false, startTime: '09:00', endTime: '17:00' },
    thursday: { selected: false, startTime: '09:00', endTime: '17:00' },
    friday: { selected: false, startTime: '09:00', endTime: '17:00' },
    saturday: { selected: false, startTime: '09:00', endTime: '17:00' },
    sunday: { selected: false, startTime: '09:00', endTime: '17:00' },
  };
  const [availability, setAvailability] = useState(initialAvailability);

  // DateTimePicker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerDay, setTimePickerDay] = useState(null);
  const [timePickerType, setTimePickerType] = useState(null);
  const [tempTime, setTempTime] = useState(new Date());

  // ---------- EFFECT FOR IMAGE PERMISSIONS ----------
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Sorry, we need camera roll permissions to make this work!'
          );
        }
      }
    })();
  }, []);

  // ---------- IMAGE PICKER HANDLER ----------
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: Platform.OS === 'web',
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const uriToStore =
        Platform.OS === 'web'
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;

      setLocalImageUri(uriToStore);
      setProfileData((prev) => ({ ...prev, profilePhotoUrl: uriToStore }));
    }
  };

  // ---------- SERVICES HANDLERS ----------
  const handleServiceChange = (index, field, value) => {
    const newArr = [...services];
    // Added data cleaning for price and duration inputs
    if (field === 'price') {
      newArr[index][field] = value.replace(/[^0-9.]/g, ''); // Allow numbers and a single decimal point
    } else if (field === 'duration') {
      newArr[index][field] = value.replace(/[^0-9]/g, ''); // Allow only numbers
    } else {
      newArr[index][field] = value;
    }
    setServices(newArr);
  };

  const addService = () => {
    setServices([
      ...services,
      { id: Date.now().toString(), name: '', price: '', duration: '' },
    ]);
  };

  const removeService = (idToRemove) => {
    setServices(services.filter((svc) => svc.id !== idToRemove));
  };

  // ---------- AVAILABILITY HANDLERS ----------
  const toggleDay = (day) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], selected: !prev[day].selected },
    }));
  };

  const showTimepicker = (day, type, initialTime) => {
    const timeToParse =
      initialTime && typeof initialTime === 'string' && initialTime.includes(':')
        ? initialTime
        : '00:00';
    const [hours, minutes] = timeToParse.split(':').map(Number);
    const pickerDate = new Date();
    pickerDate.setHours(hours, minutes, 0, 0);

    setTimePickerDay(day);
    setTimePickerType(type);
    setTempTime(pickerDate);
    setShowTimePicker(true);
  };

  const onTimeChange = (event, selectedDate) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const hh = selectedDate.getHours().toString().padStart(2, '0');
      const mm = selectedDate.getMinutes().toString().padStart(2, '0');
      const newTime = `${hh}:${mm}`;

      setAvailability((prev) => ({
        ...prev,
        [timePickerDay]: { ...prev[timePickerDay], [timePickerType]: newTime },
      }));
    }
    setTimePickerDay(null);
    setTimePickerType(null);
  };

  // ---------- FINAL SUBMISSION ----------
  const handleCompleteSetup = async () => {
    setLoading(true);

    // ---- Validate Basic Info ----
    if (
      !profileData.firstName.trim() ||
      !profileData.phoneNumber.trim() ||
      !profileData.address.trim()
    ) {
      Alert.alert(
        'Missing Information',
        'Please fill in First Name, Phone Number, and Address.'
      );
      console.log('Validation failed: Basic info missing'); // Debug log
      setLoading(false);
      return;
    }

    // ---- Validate Services ----
    const validServices = services.filter(
      (s) => s.name.trim() && s.price.trim() && s.duration.trim()
    );

    if (validServices.length === 0) {
      Alert.alert(
        'Missing Information',
        'Please add at least one service (name, price, duration).'
      );
      console.log('Validation failed: No valid services'); // Debug log
      setLoading(false);
      return;
    }

    for (let svc of validServices) {
      // Ensure price and duration are not empty strings after trim/replace
      if (!svc.price.trim() || !svc.duration.trim()) {
        Alert.alert(
          'Invalid Service Data',
          'Service price and duration cannot be empty.'
        );
        console.log('Validation failed: Service price or duration empty after trim'); // Debug log
        setLoading(false);
        return;
      }
      if (isNaN(parseFloat(svc.price)) || isNaN(parseInt(svc.duration))) {
        Alert.alert(
          'Invalid Service Data',
          'Service price and duration must be valid numbers.'
        );
        console.log('Validation failed: Service price or duration not valid numbers'); // Debug log
        setLoading(false);
        return;
      }
    }

    // ---- Validate Availability ----
    const selectedDays = Object.keys(availability).filter(
      (day) => availability[day].selected
    );
    if (selectedDays.length === 0) {
      Alert.alert(
        'Missing Information',
        'Please select at least one day you are available.'
      );
      console.log('Validation failed: No days selected'); // Debug log
      setLoading(false);
      return;
    }
    for (let day of selectedDays) {
      const { startTime, endTime } = availability[day];
      if (!startTime || !endTime) {
        Alert.alert(
          'Missing Information',
          `Please set both start and end times for ${
            day.charAt(0).toUpperCase() + day.slice(1)
          }.`
        );
        console.log(`Validation failed: Start/end times missing for ${day}`); // Debug log
        setLoading(false);
        return;
      }
    }

    // ---- Prepare Firestore Payload ----
    const barberData = {
      ...profileData,
      services: validServices.map((s) => ({
        name: s.name.trim(),
        price: parseFloat(s.price),
        duration: parseInt(s.duration),
      })),
      availability: Object.fromEntries(
        Object.entries(availability)
          .filter(([, val]) => val.selected)
          .map(([day, { startTime, endTime }]) => [
            day,
            { startTime, endTime },
          ])
      ),
      isSetupComplete: true,
      updatedAt: serverTimestamp(),
    };

    if (!localImageUri && !profileData.profilePhotoUrl) {
      barberData.profilePhotoUrl = DEFAULT_BARBER_AVATAR_URL;
    }

    // ---- Firestore Update ----
    try {
      // Ensure 'users' is the correct collection for barbers
      const userDocRef = doc(db, 'users', uid);
      await updateDoc(userDocRef, barberData);
      Alert.alert('Setup Complete!', 'Your barber profile is now set up.');
      console.log('Profile setup complete. Navigating...'); // Debug log
      navigation.reset({
        index: 0,
        routes: [{ name: 'BarberApp' }], // Assuming 'BarberApp' is the main navigator for barbers
      });
    } catch (err) {
      console.error('Error saving barber data:', err); // Detailed error log
      Alert.alert('Error', 'Failed to save your barber profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // days of week array, for mapping
  const daysOfWeek = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  // ---------- RENDERING INDICATOR ----------
  if (loading) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={commonStyles.loadingText}>Saving your profile...</Text>
      </View>
    );
  }

  // ---------- RENDERING EACH STEP ----------
  const renderStepContent = () => {
    switch (currentStep) {
      // -------------------- STEP 1: Basic Information --------------------
      case 1:
        return (
          <>
            <Text style={styles.stepTitle}>Step 1 of 3: Basic Information</Text>

            <View style={styles.profilePhotoContainer}>
              <TouchableOpacity onPress={pickImage}>
                {localImageUri ? (
                  <Image source={{ uri: localImageUri }} style={styles.profilePhoto} />
                ) : (
                  <Ionicons
                    name="person-circle-outline"
                    size={100}
                    color={colors.textSecondary}
                  />
                )}
                <View style={styles.cameraIcon}>
                  <Ionicons name="camera" size={24} color={colors.white} />
                </View>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input} // Using the new local input style
              placeholder="First Name"
              value={profileData.firstName}
              onChangeText={(text) =>
                setProfileData((prev) => ({ ...prev, firstName: text }))
              }
            />
            <TextInput
              style={styles.input} // Using the new local input style
              placeholder="Last Name"
              value={profileData.lastName}
              onChangeText={(text) =>
                setProfileData((prev) => ({ ...prev, lastName: text }))
              }
            />
            <TextInput
              style={styles.input} // Using the new local input style
              placeholder="Business Name (Optional)"
              value={profileData.businessName}
              onChangeText={(text) =>
                setProfileData((prev) => ({ ...prev, businessName: text }))
              }
            />
            <TextInput
              style={styles.input} // Using the new local input style
              placeholder="Phone Number"
              value={profileData.phoneNumber}
              onChangeText={(text) =>
                setProfileData((prev) => ({ ...prev, phoneNumber: text }))
              }
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input} // Using the new local input style
              placeholder="Shop Address"
              value={profileData.address}
              onChangeText={(text) =>
                setProfileData((prev) => ({ ...prev, address: text }))
              }
            />
          </>
        );

      // -------------------- STEP 2: Services --------------------
      case 2:
        return (
          <>
            <Text style={styles.stepTitle}>Step 2 of 3: Your Services</Text>
            {services.map((service, index) => (
              <View key={service.id} style={styles.serviceItem}>
                <TextInput
                  style={[styles.input, styles.serviceInput]} // Using local input style
                  placeholder="Service Name (e.g., Haircut)"
                  value={service.name}
                  onChangeText={(text) =>
                    handleServiceChange(index, 'name', text)
                  }
                />
                <TextInput
                  style={[styles.input, styles.servicePriceInput]} // Using local input style
                  placeholder="Price"
                  value={service.price}
                  onChangeText={(text) =>
                    handleServiceChange(index, 'price', text)
                  }
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.serviceDurationInput]} // Using local input style
                  placeholder="Duration (mins)"
                  value={service.duration}
                  onChangeText={(text) =>
                    handleServiceChange(index, 'duration', text)
                  }
                  keyboardType="numeric"
                />
                {services.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeService(service.id)}
                    style={styles.removeServiceButton}
                  >
                    <Ionicons name="remove-circle" size={24} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <Button title="Add Another Service" onPress={addService} color={colors.secondary} />
          </>
        );

      // -------------------- STEP 3: Availability --------------------
      case 3:
        return (
          <>
            <Text style={styles.stepTitle}>Step 3 of 3: Your Availability</Text>
            {daysOfWeek.map((day) => (
              <View key={day} style={styles.dayContainer}>
                <View style={styles.dayHeader}>
                  <Switch
                    onValueChange={() => toggleDay(day)}
                    value={availability[day].selected}
                    trackColor={{ false: colors.lightGray, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                  <Text style={styles.dayText}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </Text>
                </View>
                {availability[day].selected && (
                  <View style={styles.timeInputs}>
                    <TouchableOpacity
                      onPress={() =>
                        showTimepicker(day, 'startTime', availability[day].startTime)
                      }
                      style={styles.timeButton} // Styled for smaller selection
                    >
                      <Text style={styles.timeButtonText}>
                        Start: {availability[day].startTime}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        showTimepicker(day, 'endTime', availability[day].endTime)
                      }
                      style={styles.timeButton} // Styled for smaller selection
                    >
                      <Text style={styles.timeButtonText}>
                        End: {availability[day].endTime}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
            {showTimePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={tempTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={onTimeChange}
              />
            )}
          </>
        );

      default:
        return null;
    }
  };

  // ---------- NAVIGATION BUTTONS ----------
  const renderNavigationButtons = () => {
    return (
      <View style={styles.navigationContainer}>
        {currentStep > 1 ? (
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.lightGray }]}
            onPress={() => setCurrentStep((prev) => prev - 1)}
          >
            <Text style={[styles.navButtonText, { color: colors.text }]}>
              Previous
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.navButtonPlaceholder} />
        )}

        {currentStep < 3 ? (
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.primary }]}
            onPress={() => setCurrentStep((prev) => prev + 1)}
          >
            <Text style={[styles.navButtonText, { color: colors.white }]}>
              Next
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.primary }]}
            onPress={handleCompleteSetup}
          >
            <Text style={[styles.navButtonText, { color: colors.white }]}>
              Complete Setup
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ---------- RENDER ----------
  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepContent()}
      </ScrollView>

      {renderNavigationButtons()}
    </View>
  );
}

// ---------- STYLES ----------
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100, // Increased padding to ensure content above the navigation buttons is visible
  },
  // New style for multi-step form titles
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  // Styled input boxes
  input: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    color: colors.text,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profilePhotoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.lightGray,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0, // Adjusted to make it more visible relative to the photo
    backgroundColor: colors.primary,
    borderRadius: 15,
    padding: 5,
    borderWidth: 2,
    borderColor: colors.white,
    // Add these lines for more consistent positioning:
    transform: [{ translateX: 10 }, { translateY: 10 }], // Nudge it out slightly
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 25,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 5,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: colors.white,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  serviceInput: {
    flex: 2,
    marginRight: 5,
    marginBottom: 0, // Override commonStyles.input's marginBottom
    paddingVertical: 10, // Adjust padding for smaller inputs in a row
  },
  servicePriceInput: {
    flex: 1,
    marginRight: 5,
    marginBottom: 0, // Override commonStyles.input's marginBottom
    paddingVertical: 10, // Adjust padding for smaller inputs in a row
    maxWidth: 70, // Constrain width
  },
  serviceDurationInput: {
    flex: 1,
    marginRight: 5,
    marginBottom: 0, // Override commonStyles.input's marginBottom
    paddingVertical: 10, // Adjust padding for smaller inputs in a row
    maxWidth: 90, // Constrain width
  },
  removeServiceButton: {
    padding: 5,
  },
  dayContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 10,
    flex: 1,
  },
  timeInputs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  // Styled for smaller time selection buttons
  timeButton: {
    backgroundColor: colors.lightGray,
    paddingVertical: 8, // Smaller vertical padding
    paddingHorizontal: 12, // Smaller horizontal padding
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeButtonText: {
    color: colors.text,
    fontSize: 14, // Smaller font size
    fontWeight: '500',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    // Add position: 'absolute' if you want it fixed at the very bottom
    // without the scroll view affecting its position:
    // position: 'absolute',
    // bottom: 0,
    // left: 0,
    // right: 0,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  navButtonPlaceholder: {
    flex: 1,
    marginHorizontal: 5,
  },
});