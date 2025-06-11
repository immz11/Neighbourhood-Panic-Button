// screens/AuthStack.js

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SignUpDetailsScreen from './SignUpDetailsScreen';
import SignUpNeighborhoodScreen from './SignUpNeighborhoodScreen';
import LoginScreen from './LoginScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="SignUpDetails"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name="SignUpDetails"
        component={SignUpDetailsScreen}
      />
      <Stack.Screen
        name="SignUpNeighborhood"
        component={SignUpNeighborhoodScreen}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
      />
    </Stack.Navigator>
  );
}

