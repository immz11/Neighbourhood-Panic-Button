import React, { useEffect, useState } from "react";
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from "@react-navigation/native";

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { initNotifications } from './services/NotificationService';

// Our two stacks:
import AuthStack from './screens/AuthStack';
import MainStack from './screens/MainStack';

export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Subscribe to authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) {
        setInitializing(false);
      }
    });

    // Unsubscribe on unmount
    return unsubscribe;
  }, [initializing]);

  // Initialize local notifications
  useEffect(() => {
    let subscriptions = {};

    (async () => {
      subscriptions = await initNotifications(
        notification => {
          console.log('Notification received:', notification);
        },
        response => {
          console.log('Notification response:', response);
        }
      );
    })();

    // Clean up listeners on unmount
    return () => {
      subscriptions.removeReceivedListener?.();
      subscriptions.removeResponseListener?.();
    };
  }, []);

  // While Firebase checks the auth token, we show a loading spinner
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
          {user ? <MainStack /> : <AuthStack />}
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
