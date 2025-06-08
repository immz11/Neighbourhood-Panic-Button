// screens/MainStack.js

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './HomeScreen';
import PanicScreen from './PanicScreen';

const Stack = createNativeStackNavigator();
import ContactsScreen from './ContactsScreen';
import PanicButtonScreen from './PanicButtonScreen';

<Stack.Screen name="Contacts" component={ContactsScreen} />
<Stack.Screen name="PanicButton" component={PanicButtonScreen} />
export default function MainStack() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
      />
      <Stack.Screen
        name="Panic"
        component={PanicScreen}
      />
      {/* If you have other “authenticated” screens, add them here */}
    </Stack.Navigator>
  );
}
