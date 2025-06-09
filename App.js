import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaView,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AuthStack from "./screens/AuthStack";
import MainStack from "./screens/MainStack";
import PanicScreen from "./screens/PanicScreen";
import AlertNotificationScreen from "./screens/AlertNotificationScreen";

import { initFCM, subscribeToNeighborhood, unsubscribeFromNeighborhood } from "./messaging";
import { useUser } from "./UserContext";

const RootStack = createNativeStackNavigator();
export const navigationRef = createNavigationContainerRef();

export default function App() {
  const { user, userData, loading } = useUser();

  // Initialize FCM once
  useEffect(() => {
    initFCM();
  }, []);

  // Subscribe to topic when we know the neighborhood, and unsubscribe on cleanup or change
  useEffect(() => {
    if (userData?.neighborhoodId) {
      subscribeToNeighborhood(userData.neighborhoodId);
      return () => {
        unsubscribeFromNeighborhood(userData.neighborhoodId);
      };
    }
  }, [userData]);

  // Wait for UserContext to finish loading
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ED4C5C" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <NavigationContainer ref={navigationRef}>
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {/* If no user, go to Auth; otherwise Main. Panic always available. */}
            {!user ? (
              <RootStack.Screen name="Auth" component={AuthStack} />
            ) : (
              <RootStack.Screen name="Main" component={MainStack} />
            )}
            <RootStack.Screen
              name="PanicAnonymous"
              component={PanicScreen}
            />
            <RootStack.Screen
              name="AlertNotification"
              component={AlertNotificationScreen}
            />
          </RootStack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});


//https://chatgpt.com/share/684369d7-5268-8011-9b22-6c5244f43295