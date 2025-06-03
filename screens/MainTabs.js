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

import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

import { signOut } from 'firebase/auth';

const Tab = createBottomTabNavigator();

// —————————————————————————————————————————
// 1) ContactsTab: lists all users in the same neighborhood
// —————————————————————————————————————————
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
        // 1) Get the current user's Firestore doc to read neighborhoodId
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userSnap.exists()) {
          console.warn('No user data found');
          setContacts([]);
          setLoading(false);
          return;
        }
        const { neighborhoodId } = userSnap.data();

        // 2) Query /users where neighborhoodId == currentUser's neighborhood
        const q = query(
          collection(db, 'users'),
          where('neighborhoodId', '==', neighborhoodId)
        );
        const querySnapshot = await getDocs(q);

        const results = [];
        querySnapshot.forEach((docSnap) => {
          // exclude the current user from their own contact list:
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
  }, []);

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
            {/* You can add more fields here, e.g. gender or email */}
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

// —————————————————————————————————————————
// 2) PanicTab: large, centered button to navigate into PanicScreen
// —————————————————————————————————————————
function PanicTab() {
  const navigation = useNavigation();

  return (
    <View style={styles.centerContainer}>
      <TouchableOpacity
        style={styles.panicBigButton}
        onPress={() => navigation.navigate('Panic')}
      >
        <Text style={styles.panicBigText}>PANIC</Text>
      </TouchableOpacity>
    </View>
  );
}

// —————————————————————————————————————————
// 3) ProfileTab: Placeholder for user profile / settings
// —————————————————————————————————————————
function ProfileTab() {
  const navigation = useNavigation();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // After signOut, App.js's onAuthStateChanged listener will show AuthStack
    } catch (err) {
      Alert.alert('Error', 'Sign out failed');
    }
  };

  return (
    <View style={styles.centerContainer}>
      <Text style={styles.profileTitle}>Profile</Text>
      {/* Placeholder content: */}
      <Text style={styles.profileText}>(Coming soon…)</Text>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

// —————————————————————————————————————————
// MainTabs: bottom‐tab navigator with 3 tabs
// —————————————————————————————————————————
export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="PanicTab"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#ED4C5C',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: { backgroundColor: '#FFF', borderTopColor: '#E5E7EB' },
      }}
    >
      <Tab.Screen
        name="Contacts"
        component={ContactsTab}
        options={{ tabBarLabel: 'Contacts' }}
      />
      <Tab.Screen
        name="PanicTab"
        component={PanicTab}
        options={{
          tabBarLabel: 'Panic',
          tabBarLabelStyle: { fontWeight: 'bold' },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileTab}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// —————————————————————————————————————————
// Shared styles for tabs
// —————————————————————————————————————————
const styles = StyleSheet.create({
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
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
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
  panicBigButton: {
    backgroundColor: '#D00000',
    paddingVertical: 24,
    paddingHorizontal: 48,
    borderRadius: 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  panicBigText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    color: '#111827',
  },
  profileText: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 24,
  },
  signOutButton: {
    backgroundColor: '#ED4C5C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  signOutText: {
    color: '#FFF',
    fontSize: 16,
  },
});
