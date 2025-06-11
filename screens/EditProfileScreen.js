// screens/EditProfileScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth, db } from '../firebase';
import { doc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore'; // Added collection, getDocs

// Import the Picker component
import { Picker } from '@react-native-picker/picker';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { initialUserData } = route.params || {};

  const [fullName, setFullName] = useState(initialUserData?.fullName || '');
  const [cellphone, setCellphone] = useState(initialUserData?.cellphone || '');
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState(initialUserData?.neighborhoodId || ''); // State for selected neighborhood ID
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState([]); // NEW: State to store fetched neighborhoods
  const [loading, setLoading] = useState(true); // Set to true initially to fetch all data

  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || currentUser.isAnonymous) {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch current user data (if not passed via route params)
        let currentNeighborhoodId = initialUserData?.neighborhoodId || '';
        if (!initialUserData) {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setFullName(data.fullName || '');
            setCellphone(data.cellphone || '');
            currentNeighborhoodId = data.neighborhoodId || '';
          } else {
            console.warn('No user data found for current user in Firestore.');
          }
        }
        setSelectedNeighborhoodId(currentNeighborhoodId);


        // 2. Fetch all available neighborhoods from the database
        const neighborhoodsCollectionRef = collection(db, 'neighborhoods');
        const neighborhoodsSnapshot = await getDocs(neighborhoodsCollectionRef);
        const neighborhoodsList = [];
        neighborhoodsSnapshot.forEach(doc => {
          neighborhoodsList.push({
            id: doc.id, // The document ID is the neighborhood ID
            name: doc.data().name // The 'name' field is the display name
          });
        });
        setAvailableNeighborhoods(neighborhoodsList);

        // If the user's current neighborhood ID is not in the fetched list,
        // you might want to set a default or handle this case.
        // For simplicity, we'll just ensure it's selected if it exists.
        if (currentNeighborhoodId && !neighborhoodsList.some(n => n.id === currentNeighborhoodId)) {
          // If the user's current neighborhood doesn't exist in the list,
          // you could optionally set the default to the first available, or keep it blank.
          // For now, we'll keep it as the user's value, but the picker might show blank if it's invalid.
          // Or, you could set setSelectedNeighborhoodId(neighborhoodsList[0]?.id || '')
        }

      } catch (error) {
        console.error("Error fetching data in EditProfileScreen:", error);
        Alert.alert("Error", "Failed to load data for profile editing.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialUserData, currentUser]);


  const handleSaveProfile = async () => {
    if (!currentUser || currentUser.isAnonymous) {
      Alert.alert('Error', 'Cannot save profile for anonymous users.');
      return;
    }

    if (!fullName.trim() || !cellphone.trim() || !selectedNeighborhoodId.trim()) {
      Alert.alert('Validation Error', 'Full Name, Cellphone, and Neighborhood must be selected.');
      return;
    }

    setLoading(true); // Start loading for save operation
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        fullName: fullName.trim(),
        cellphone: cellphone.trim(),
        neighborhoodId: selectedNeighborhoodId, // Save the selected ID
      });
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false); // End loading for save operation
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ED4C5C" />
        <Text style={{ marginTop: 10, color: '#6B7280' }}>Loading profile data...</Text>
      </View>
    );
  }

  if (!currentUser || currentUser.isAnonymous) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Edit Profile</Text>
        <Text style={styles.emptyText}>
          You are currently signed in anonymously. Please sign up to manage your profile.
        </Text>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Edit Profile</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name:</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter full name"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cellphone:</Text>
          <TextInput
            style={styles.input}
            value={cellphone}
            onChangeText={setCellphone}
            placeholder="Enter cellphone number"
            keyboardType="phone-pad"
          />
        </View>

        {/* NEW: Picker for Neighborhood */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Neighborhood:</Text>
          <View style={styles.pickerContainer}> {/* Apply styling to the container */}
            <Picker
              selectedValue={selectedNeighborhoodId}
              onValueChange={(itemValue) => setSelectedNeighborhoodId(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem} // iOS specific styling for items
            >
              {/* Optional: Add a "Select a neighborhood" option */}
              <Picker.Item label="-- Select your Neighborhood --" value="" enabled={false} style={{ color: '#6B7280' }} />
              {availableNeighborhoods.map((n) => (
                <Picker.Item key={n.id} label={n.name} value={n.id} />
              ))}
            </Picker>
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 30,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
    maxWidth: 400,
  },
  label: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#111827',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickerContainer: { // New style for Picker's wrapper
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden', // Ensures inner picker respects borderRadius
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  picker: {
    height: 50, // Standard height for input fields
    width: '100%',
    color: '#111827', // Text color for selected item
  },
  pickerItem: {
    fontSize: 16, // Font size for picker items
  },
  saveButton: {
    backgroundColor: '#ED4C5C',
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginTop: 15,
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: { // Added for the loading state of the screen
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  // Re-added centerContainer and emptyText for consistent anonymous user display
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});