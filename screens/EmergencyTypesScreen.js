// screens/EmergencyTypesScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Ionicons from '@expo/vector-icons/Ionicons'; // Import Ionicons for icons

export default function EmergencyTypesScreen() {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser || currentUser.isAnonymous) {
        setUserData(null);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          console.warn('No user data found in Firestore');
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ED4C5C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Need Help?</Text>
      <Text style={styles.emergencyPrompt}>
        Select Emergency Type:
      </Text>

      {/* Fire Button */}
      <TouchableOpacity
        style={[styles.emergencyButton, styles.fireButton]}
        onPress={() =>
          navigation.navigate('Panic', {
            emergencyType: 'Fire',
            userData: userData,
            isAnonymous: currentUser?.isAnonymous ?? true,
          })
        }
      >
        <Ionicons name="flame-outline" size={30} color="#FFF" style={styles.buttonIcon} />
        <Text style={styles.emergencyText}>Fire</Text>
      </TouchableOpacity>

      {/* Breaking & Entering Button */}
      <TouchableOpacity
        style={[styles.emergencyButton, styles.breakingEnteringButton]}
        onPress={() =>
          navigation.navigate('Panic', {
            emergencyType: 'BreakingAndEntering',
            userData: userData,
            isAnonymous: currentUser?.isAnonymous ?? true,
          })
        }
      >
        <Ionicons name="person-outline" size={30} color="#111827" style={styles.buttonIcon} />
        <Text style={[styles.emergencyText, styles.breakingEnteringText]}>Breaking & Entering</Text>
      </TouchableOpacity>

      {/* Other Button */}
      <TouchableOpacity
        style={[styles.emergencyButton, styles.otherButton]}
        onPress={() =>
          navigation.navigate('Panic', {
            emergencyType: 'Other',
            userData: userData,
            isAnonymous: currentUser?.isAnonymous ?? true,
          })
        }
      >
        <Ionicons name="help-circle-outline" size={30} color="#FFF" style={styles.buttonIcon} />
        <Text style={styles.emergencyText}>Other</Text>
      </TouchableOpacity>

      {/* Note regarding login status */}
      <View style={styles.noteContainer}>
        <Ionicons
          name={currentUser && !currentUser.isAnonymous ? 'checkmark-circle-outline' : 'warning-outline'}
          size={20}
          color={currentUser && !currentUser.isAnonymous ? '#2ECC71' : '#F39C12'}
        />
        <Text style={styles.noteText}>
          {currentUser && !currentUser.isAnonymous
            ? 'Logged in: Full details will be sent with your alert.'
            : 'Anonymous: Your alert will be sent without personal details.'}
        </Text>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Lighter background for a fresh feel
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800', // Extra bold
    color: '#111827', // Darker text for prominence
    marginBottom: 10,
  },
  emergencyPrompt: {
    fontSize: 18,
    color: '#4B5563', // Slightly muted for secondary text
    marginBottom: 30, // More space below prompt
    fontWeight: '600',
    textAlign: 'center',
  },
  emergencyButton: {
    width: '90%', // Wider buttons
    flexDirection: 'row', // Arrange icon and text horizontally
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18, // Taller buttons
    borderRadius: 15, // More rounded corners
    marginVertical: 10,
    shadowColor: '#000', // Subtle shadow for depth
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8, // Android shadow
  },
  buttonIcon: {
    marginRight: 10, // Space between icon and text
  },
  emergencyText: {
    fontSize: 20, // Larger text for readability
    color: '#fff', // White text by default for dark buttons
    fontWeight: '700', // Bolder text
    textTransform: 'uppercase', // Capitalize button text
  },
  // Specific button colors
  fireButton: {
    backgroundColor: '#E74C3C', // Deep red
  },
  breakingEnteringButton: {
    backgroundColor: '#F1C40F', // Vibrant yellow
    borderWidth: 2, // Add a border for contrast
    borderColor: '#E6B300', // Darker yellow border
  },
  breakingEnteringText: {
    color: '#111827', // Dark text on yellow background for readability
  },
  otherButton: {
    backgroundColor: '#3498DB', // Bright blue
  },
  noteContainer: {
    flexDirection: 'row', // Arrange icon and text horizontally
    alignItems: 'center',
    marginTop: 30, // Space above the note
    padding: 15,
    backgroundColor: '#EBF1F5', // Light grey background for the note
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
  },
  noteText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'left',
    flexShrink: 1, // Allows text to wrap
  },
});