// screens/MainStack.js

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainTabs from './MainTabs';
import PanicScreen from './PanicScreen';
import PanicButtonScreen from './PanicButtonScreen';
import ContactsScreen from './ContactsScreen';
import PanicAlertDetailsScreen from './PanicAlertDetailsScreen';
import EditProfileScreen from './EditProfileScreen'; // <--- NEW IMPORT

const Stack = createNativeStackNavigator();

export default function MainStack() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
      />
      {/* These screens are reachable from the tabs or other screens within MainStack */}
      <Stack.Screen
        name="Panic" // The main PanicScreen, accessible from EmergencyTypesScreen
        component={PanicScreen}
      />
      <Stack.Screen
        name="PanicButton" // Accessible from a tab if you add a button for it
        component={PanicButtonScreen}
      />
      <Stack.Screen
        name="Contacts" // Accessible from a tab if you add a button for it (distinct from ContactsTab itself)
        component={ContactsScreen}
      />
      <Stack.Screen
        name="PanicAlertDetails" // NEW SCREEN for displaying alert details
        component={PanicAlertDetailsScreen}
      />
      <Stack.Screen
        name="EditProfile" // <--- NEW STACK SCREEN DEFINITION
        component={EditProfileScreen}
        options={{ headerShown: true, title: 'Edit Profile' }} // Show header for better navigation
      />
    </Stack.Navigator>
  );
}