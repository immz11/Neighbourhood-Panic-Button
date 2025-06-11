// navigation/ClientTabNavigator.js

import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TouchableOpacity, Platform, Image, StyleSheet } from 'react-native';

import ClientDashboard from '../screens/ClientDashboard';
import ClientListScreen from '../screens/ClientListScreen';
import MessagesScreen from '../screens/MessagesScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import colors from '../constants/colors.js';

import { AuthContext } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

// --- THE KEY FIX IS HERE: Accept 'navigation' as a prop for ClientTabNavigator ---
export default function ClientTabNavigator({ navigation }) { // <--- ADDED 'navigation' prop here
  const insets = useSafeAreaInsets();
  const { userProfileData } = useContext(AuthContext);

  // You mentioned profilePhotoUrl in the Firestore example,
  // but profilePicUrl in your code. Let's stick with profilePhotoUrl
  // for consistency with the Firestore data you showed.
  const profilePicUrl = userProfileData?.profilePhotoUrl; // Changed to profilePhotoUrl for consistency

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingBottom: 5 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Barbers') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={ClientDashboard}
        options={() => ({ // <-- Removed `navigation` from here
          title: 'Home',
          headerTitleAlign: 'center',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                // --- THE KEY FIX IS HERE: Use the 'navigation' from ClientTabNavigator's props ---
                // This 'navigation' prop is from the parent ClientStackNavigator,
                // which *does* know about 'ProfileScreen'.
                navigation.navigate('ProfileScreen');
              }}
              style={styles.profileIconContainer}
            >
              {profilePicUrl ? (
                <Image
                  source={{ uri: profilePicUrl }}
                  style={styles.profileImage}
                />
              ) : (
                <Ionicons name="person-circle-outline" size={30} color={colors.primary} />
              )}
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen
        name="Barbers"
        component={ClientListScreen}
        options={{ title: 'Barbers' }}
      />
      <Tab.Screen
        name="Bookings"
        component={MyBookingsScreen}
        options={{ title: 'Bookings' }}
      />
      <Tab.Screen
         name="Messages"
         component={MessagesScreen}
         options={{ title: 'Messages' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  profileIconContainer: {
    marginRight: Platform.OS === 'ios' ? 15 : 20,
    padding: 2,
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.primary,
  },
});