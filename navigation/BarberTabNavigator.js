// navigation/BarberTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BarberDashboard from '../screens/BarberDashboard';
import BarberSettings from '../screens/BarberSettings';
import ChatListScreen from '../screens/ChatListScreen'; // Import the new ChatListScreen
import colors from '../constants/colors';

const Tab = createBottomTabNavigator();

export default function BarberTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
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

          if (route.name === 'BarberHome') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'BarberChat') { // Add a case for the new chat tab
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="BarberHome"
        component={BarberDashboard}
        options={{ title: 'Dashboard' }}
      />
      {/* Add the ChatListScreen to the barber's tabs */}
      <Tab.Screen
        name="BarberChat" // A unique name for the barber's chat tab
        component={ChatListScreen}
        options={{ title: 'Chats' }}
      />
      <Tab.Screen
        name="Settings"
        component={BarberSettings}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}