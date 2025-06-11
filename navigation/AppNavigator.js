// navigation/AppNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// --- Auth / Onboarding ---
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import RegisterInfoScreen from '../screens/RegisterInfoScreen';
import RegisterPhotoScreen from '../screens/RegisterPhotoScreen';
import RegisterPreferencesScreen from '../screens/RegisterPreferencesScreen';
import RegisterPaymentScreen from '../screens/RegisterPaymentScreen';
import RegisterTermsScreen from '../screens/RegisterTermsScreen';
import TermsScreen from '../screens/TermsScreen';
import BarberOnboardingScreen from '../screens/BarberOnboardingScreen';

// --- Chat Screens (NEW) ---
import ChatListScreen from '../screens/ChatListScreen';   // your “Chats” list
import ChatScreen from '../screens/ChatScreen';           // your 1:1 chat UI

// --- Tab Navigators (Main App Flows) ---
import ClientStackNavigator from './ClientStackNavigator';
import BarberTabNavigator from './BarberTabNavigator';
// (You can remove the old MessagesScreen import if you don’t need it anymore)
// import MessagesScreen from '../screens/MessagesScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* --------------------- Auth / Onboarding Screens --------------------- */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="RegisterInfo" component={RegisterInfoScreen} />
      <Stack.Screen name="RegisterPhoto" component={RegisterPhotoScreen} />
      <Stack.Screen name="RegisterPreferences" component={RegisterPreferencesScreen} />
      <Stack.Screen name="RegisterPayment" component={RegisterPaymentScreen} />
      <Stack.Screen name="RegisterTerms" component={RegisterTermsScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="BarberOnboarding" component={BarberOnboardingScreen} />

      {/* --------------------- Chat Flow --------------------- */}
      {/* This is where a user (client or barber) goes to see all rooms */}
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      {/* This opens a single conversation */}
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{
          // We’ll turn the header back on for ChatScreen so you can see the recipient’s name
          headerShown: true,
          // Use the recipient’s displayName as the title (passed in route.params)
          title: '',
          // We’ll set the title dynamically via the `options` callback below
        }}
        // The following line lets us set the header title based on route.params.recipientDisplayName
        initialParams={{ recipientDisplayName: 'Chat' }}
      />

      {/* --------------------- Main App Flows (Tab Navigators) --------------------- */}
      <Stack.Screen name="ClientApp" component={ClientStackNavigator} />
      <Stack.Screen name="BarberApp" component={BarberTabNavigator} />
    </Stack.Navigator>
  );
}
