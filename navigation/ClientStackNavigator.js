import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ClientTabNavigator from './ClientTabNavigator';
import BookingScreen from '../screens/BookingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import BarberDetailScreen from '../screens/BarberDetailScreen';
import ClientAppointmentsScreen from '../screens/ClientAppointmentsScreen'; // <-- NEW IMPORT

const Stack = createNativeStackNavigator();

export default function ClientStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClientTabs" component={ClientTabNavigator} />
      <Stack.Screen name="BookingScreen" component={BookingScreen} />
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          headerShown: true,
          title: 'My Profile',
          headerTitleAlign: 'center',
          headerBackTitleVisible: false,
          headerTintColor: 'black',
        }}
      />
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="BarberDetailScreen"
        component={BarberDetailScreen}
        options={{
          headerShown: true,
        }}
      />
      {/* --- ADD THIS NEW STACK SCREEN --- */}
      <Stack.Screen
        name="ClientAppointments" // Use the exact name you navigate to
        component={ClientAppointmentsScreen}
        options={{
          headerShown: true, // Show header for this screen
          title: 'My Appointments', // Custom title
        }}
      />
    </Stack.Navigator>
  );
}