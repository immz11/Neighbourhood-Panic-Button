// screens/MainTabs.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';

// Import Ionicons for tab bar icons
import Ionicons from '@expo/vector-icons/Ionicons';

import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

import { signOut } from 'firebase/auth';

// Import the necessary screens for the tabs
import EmergencyTypesScreen from './EmergencyTypesScreen';
import NeighborhoodAlertsScreen from './NeighborhoodAlertsScreen';

const Tab = createBottomTabNavigator();

// ---
// 1) ContactsTab: lists all users in the same neighborhood
// ---
function ContactsTab() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    async function fetchContacts() {
      if (!currentUser || currentUser.isAnonymous) {
        setContacts([]);
        setLoading(false);
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userSnap.exists()) {
          console.warn('No user data found');
          setContacts([]);
          setLoading(false);
          return;
        }
        const { neighborhoodId } = userSnap.data();

        const q = query(
          collection(db, 'users'),
          where('neighborhoodId', '==', neighborhoodId)
        );
        const querySnapshot = await getDocs(q);

        const results = [];
        querySnapshot.forEach((docSnap) => {
          if (docSnap.id !== currentUser.uid) {
            results.push({
              id: docSnap.id,
              ...docSnap.data(),
            });
          }
        });

        setContacts(results);
      } catch (err) {
        console.error('Error fetching neighbors:', err);
        Alert.alert('Error', 'Failed to load contacts.');
      } finally {
        setLoading(false);
      }
    }

    fetchContacts();
  }, [currentUser]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ED4C5C" />
      </View>
    );
  }

  if (contacts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>
          {currentUser?.isAnonymous
            ? 'No contacts available for anonymous users.'
            : 'No neighbors found in your neighborhood.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.contactCard}>
            <Text style={styles.contactName}>{item.fullName}</Text>
            <Text style={styles.contactInfo}>{item.cellphone}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 }} />
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

// ---
// 2) ProfileTab: For user profile / settings and Sign Out
// ---
function ProfileTab() {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  useEffect(() => {
    let unsubscribe;

    const fetchUserData = async () => {
      if (!currentUser || currentUser.isAnonymous) {
        setUserData(null);
        setLoading(false);
        return;
      }

      unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          console.warn('No user data found for current user in Firestore.');
          setUserData(null);
        }
        setLoading(false);
      }, (error) => {
        console.error('Error listening to user data:', error);
        Alert.alert('Error', 'Failed to load profile data.');
        setLoading(false);
      });
    };

    fetchUserData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      Alert.alert('Error', 'Sign out failed');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ED4C5C" />
      </View>
    );
  }

  if (!currentUser || currentUser.isAnonymous) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.profileTitle}>Profile</Text>
        <Text style={styles.profileText}>
          You are currently signed in anonymously. Sign up to view your profile details.
        </Text>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.profileContainer}>
      <Text style={styles.profileTitle}>My Profile</Text>

      {userData ? (
        <View style={styles.profileInfoCard}>
          <Text style={styles.infoLabel}>Full Name:</Text>
          <Text style={styles.infoValue}>{userData.fullName || 'N/A'}</Text>

          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{currentUser.email || 'N/A'}</Text>

          <Text style={styles.infoLabel}>Cellphone:</Text>
          <Text style={styles.infoValue}>{userData.cellphone || 'N/A'}</Text>

          {userData.neighborhoodId && (
            <>
              <Text style={styles.infoLabel}>Neighborhood ID:</Text>
              <Text style={styles.infoValue}>{userData.neighborhoodId}</Text>
            </>
          )}
        </View>
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No profile data available.</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.editProfileButton}
        onPress={() => navigation.navigate('EditProfile', { initialUserData: userData })}
      >
        <Text style={styles.editProfileText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---
// MainTabs: bottom-tab navigator with 4 tabs
// ---
export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="EmergencyTypes"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#ED4C5C',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#FFCDD2', // Muted pink background
          borderTopWidth: 0, // Remove default top border
          borderTopLeftRadius: 20, // Rounded top-left corner
          borderTopRightRadius: 20, // Rounded top-right corner
          height: 70, // Slightly increased height for better visual balance
          paddingBottom: 5,
          // Add shadow for an elevated effect
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 }, // Shadow going upwards
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 10, // Android elevation
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginTop: -5 },

        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'EmergencyTypes') {
            iconName = focused ? 'alert-circle' : 'alert-circle-outline';
          } else if (route.name === 'NeighborhoodAlerts') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Contacts') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="EmergencyTypes"
        component={EmergencyTypesScreen}
        options={{ tabBarLabel: 'Panic' }}
      />
      <Tab.Screen
        name="NeighborhoodAlerts"
        component={NeighborhoodAlertsScreen}
        options={{ tabBarLabel: 'Alerts' }}
      />
      <Tab.Screen
        name="Contacts"
        component={ContactsTab}
        options={{ tabBarLabel: 'Contacts' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileTab}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// ---
// Shared styles for tabs and components
// ---
const styles = StyleSheet.create({
  // General Containers
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  profileContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
    alignItems: 'center',
  },

  // Empty State Text
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Contact Card Styles
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  contactInfo: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },

  // Profile Specific Styles
  profileTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
    color: '#111827',
    textAlign: 'center',
  },
  profileInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '95%',
    maxWidth: 400,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 10,
  },
  infoValue: {
    fontSize: 17,
    color: '#111827',
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 5,
  },
  profileText: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 24,
    textAlign: 'center',
  },

  // Buttons
  editProfileButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 15,
    width: '90%',
    maxWidth: 300,
    alignItems: 'center',
  },
  editProfileText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#ED4C5C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '90%',
    maxWidth: 300,
    alignItems: 'center',
  },
  signOutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});