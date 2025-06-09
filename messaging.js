// messaging.js
import { Platform, Alert } from "react-native";
import messaging from "@react-native-firebase/messaging";

// Call this once on app load (e.g. in App.js)
export async function initFCM() {
  // Request permission (iOS only will prompt; Android granted by default)
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    Alert.alert(
      "Permission required",
      "Push notifications won’t work until you enable permissions."
    );
    return;
  }

  // Get the device token (optional if using topics exclusively)
  const token = await messaging().getToken();
  console.log("FCM Token:", token);

  // Handle messages in the foreground
  messaging().onMessage(async remoteMessage => {
    console.log("FCM Message Received (foreground):", remoteMessage);
    // You can show an in-app banner or local notification here if you like
  });

  // Handle notification when the app is opened from background/killed
  messaging().onNotificationOpenedApp(remoteMessage => {
    const { alertId } = remoteMessage.data || {};
    if (alertId) {
      // navigate to the AlertNotificationScreen
      // NOTE: you’ll need to wire this up in your root navigator
      navigationRef.current?.navigate("AlertNotification", { alertId });
    }
  });

  // Handle the case where the app was opened from a quit state
  const initialMsg = await messaging().getInitialNotification();
  if (initialMsg) {
    const { alertId } = initialMsg.data || {};
    if (alertId) {
      navigationRef.current?.navigate("AlertNotification", { alertId });
    }
  }
}

// Call this when the user signs in:
export function subscribeToNeighborhood(neighborhoodId) {
  if (!neighborhoodId) return;
  messaging()
    .subscribeToTopic(neighborhoodId)
    .then(() =>
      console.log(`Subscribed to topic: ${neighborhoodId}`)
    )
    .catch(err => console.error("Topic subscribe error:", err));
}

// Call this when the user signs out:
export function unsubscribeFromNeighborhood(neighborhoodId) {
  if (!neighborhoodId) return;
  messaging()
    .unsubscribeFromTopic(neighborhoodId)
    .then(() =>
      console.log(`Unsubscribed from topic: ${neighborhoodId}`)
    )
    .catch(err => console.error("Topic unsubscribe error:", err));
}
