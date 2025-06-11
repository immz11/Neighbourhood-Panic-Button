// App.js
import React, { useEffect, useState } from "react";
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

// Our two stacks:
import AuthStack from './screens/AuthStack';
import MainStack from './screens/MainStack'; // MainStack now contains MainTabs

// We MUST import PanicScreen directly here if it's used as a RootStack.Screen
import PanicScreen from './screens/PanicScreen'; // UNCOMMENTED THIS IMPORT

const RootStack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) {
        setInitializing(false);
      }
    });

    return unsubscribe;
  }, [initializing]);

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ED4C5C" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <NavigationContainer>
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {/*
              This conditional rendering logic is crucial for switching between Auth and Main flows.
              PanicScreen is accessible anonymously via 'PanicAnonymous' route.
            */}
            {user ? (
              <RootStack.Screen
                name="Main"
                component={MainStack} // MainStack now holds MainTabs
              />
            ) : (
              <RootStack.Screen
                name="Auth"
                component={AuthStack}
              />
            )}
            {/* PanicScreen is always accessible, even if not logged in, but with an anonymous tag */}
            <RootStack.Screen
              name="PanicAnonymous"
              component={PanicScreen}
            />
          </RootStack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});