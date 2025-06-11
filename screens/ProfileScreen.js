import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc } from 'firebase/firestore';

import commonStyles from '../constants/styles';
import colors from '../constants/colors';
import { AuthContext } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, userProfileData, auth, db, userRole } = useContext(AuthContext);

  // --- State for all profile fields ---
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(userProfileData?.profilePhotoUrl || null);
  const [displayName, setDisplayName] = useState(userProfileData?.displayName || '');
  const [firstName, setFirstName] = useState(userProfileData?.firstName || '');
  const [lastName, setLastName] = useState(userProfileData?.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState(userProfileData?.phoneNumber || '');
  const [gender, setGender] = useState(userProfileData?.gender || ''); // Consider using a Picker for predefined genders

  const [email, setEmail] = useState(user?.email || ''); // Email is non-editable
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Request media library permissions on component mount
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);

  // Update local state when userProfileData from context changes (e.g., after login/refresh)
  useEffect(() => {
    if (userProfileData) {
      setProfilePhotoUrl(userProfileData.profilePhotoUrl || null);
      setDisplayName(userProfileData.displayName || '');
      setFirstName(userProfileData.firstName || '');
      setLastName(userProfileData.lastName || '');
      setPhoneNumber(userProfileData.phoneNumber || '');
      setGender(userProfileData.gender || '');
    }
    if (user) {
      setEmail(user.email || 'N/A');
    }
  }, [userProfileData, user]);

  const handlePickImage = async () => {
    if (!user || !user.uid) {
      Alert.alert('Error', 'No user logged in to upload image.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7, // Reduce quality slightly to try and keep base64 size down
      base64: true, // Request base64 data directly
    });

    if (!result.canceled) {
      setLoading(true);
      const base64Image = `data:${result.assets[0].type};base64,${result.assets[0].base64}`;

      // WARNING: This image data will be stored directly in Firestore and is subject to the 1MB document limit.
      if (base64Image.length > 900 * 1024) { // Roughly check if it's nearing 1MB limit (base64 is ~33% larger)
        Alert.alert(
          'Image Too Large',
          'The selected image is very large and may exceed Firestore\'s 1MB document limit. Please try a smaller one.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          profilePhotoUrl: base64Image,
          updatedAt: new Date(),
        });

        setProfilePhotoUrl(base64Image);
        Alert.alert('Success', 'Profile picture updated!');
      } catch (error) {
        console.error('Error updating profile picture:', error);
        Alert.alert(
          'Error',
          'Failed to update profile picture. This might be due to the image being too large or a network issue. Please try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !user.uid) {
      Alert.alert('Error', 'No user logged in to update profile.');
      return;
    }

    // --- Basic Validation ---
    if (!displayName.trim()) {
      Alert.alert('Validation Error', 'Display Name cannot be empty.');
      return;
    }
    if (phoneNumber.trim() && !/^[0-9]{7,15}$/.test(phoneNumber.trim())) { // Simple phone number regex
      Alert.alert('Validation Error', 'Please enter a valid phone number (7-15 digits).');
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: displayName,
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber,
        gender: gender,
        updatedAt: new Date(),
      });
      Alert.alert('Success', 'Profile details updated!');
      setIsEditing(false); // Exit editing mode after saving
    } catch (error) {
      console.error('Error updating profile details:', error);
      Alert.alert('Error', 'Failed to update profile details: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) {
      console.error("Auth instance not available for logout.");
      return;
    }
    setLoading(true);
    try {
      await auth.signOut();
      Alert.alert('Logged Out', 'You have been successfully logged out.');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !userProfileData) { // Added userProfileData check for initial load
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={commonStyles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  // Helper function for rendering editable/display fields
  const renderProfileField = (label, value, setter, keyboardType = 'default', editable = true) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}:</Text>
      <TextInput
        style={[styles.textInput, !editable && styles.textInputDisabled]}
        value={value}
        onChangeText={setter}
        editable={isEditing && editable}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={commonStyles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0} // Adjust as needed
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={commonStyles.title}>My Profile</Text>

        <TouchableOpacity onPress={handlePickImage} disabled={loading} style={styles.profilePicWrapper}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : profilePhotoUrl ? (
            <Image source={{ uri: profilePhotoUrl }} style={styles.profileImage} />
          ) : (
            <Ionicons name="person-circle-outline" size={120} color={colors.textSecondary} />
          )}
          <View style={styles.cameraIconContainer}>
            <Ionicons name="camera-outline" size={24} color={colors.white} />
          </View>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          {renderProfileField('Email', email, setEmail, 'email-address', false)} {/* Email is not editable */}
          {renderProfileField('Role', userRole || 'Client', null, 'default', false)} {/* Role is not editable */}

          {renderProfileField('Display Name', displayName, setDisplayName)}
          {renderProfileField('First Name', firstName, setFirstName)}
          {renderProfileField('Last Name', lastName, setLastName)}
          {renderProfileField('Phone Number', phoneNumber, setPhoneNumber, 'phone-pad')}
          {renderProfileField('Gender', gender, setGender)} {/* Simple text input for gender */}

          {isEditing ? (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
              disabled={loading}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.logoutButtonText}>Logout</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15, // Added horizontal padding
  },
  profilePicWrapper: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30, // Increased margin
    overflow: 'hidden',
    borderWidth: 3, // Slightly thicker border
    borderColor: colors.primary,
    shadowColor: '#000', // Added shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 18, // Larger icon background
    padding: 7, // Larger padding
    borderWidth: 2,
    borderColor: colors.white,
  },
  infoContainer: {
    width: '100%', // Take full width
    maxWidth: 500, // Max width for larger screens
    backgroundColor: colors.white,
    borderRadius: 15, // More rounded corners
    padding: 25, // Increased padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  fieldContainer: {
    marginBottom: 15, // Spacing between fields
  },
  label: {
    fontSize: 15, // Slightly smaller label font
    color: colors.textSecondary,
    marginBottom: 8, // Spacing between label and input
    fontWeight: '600', // Semibold
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10, // More rounded input fields
    padding: 14, // Increased padding
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  textInputDisabled: {
    backgroundColor: colors.lightGray,
    color: colors.textSecondary,
    opacity: 0.8, // Make disabled inputs slightly faded
  },
  editButton: {
    backgroundColor: colors.secondary,
    padding: 16, // Larger button
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25, // Increased margin
  },
  editButtonText: {
    color: colors.white,
    fontSize: 17, // Larger font
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16, // Larger button
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: colors.danger,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  logoutButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: 'bold',
  },
});