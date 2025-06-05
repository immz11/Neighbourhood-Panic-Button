// NotificationHandler.js
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

export const setupNotificationListeners = () => {
  // Called when the app is in the foreground
  messaging().onMessage(async remoteMessage => {
    Alert.alert(remoteMessage.notification.title, remoteMessage.notification.body);
  });

  // Background handler
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background notification:', remoteMessage);
  });

  //  App opened from background via notification
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('App opened from background notification:', remoteMessage.notification);
  });

  //  App launched from quit state via notification
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('App launched from quit state by notification:', remoteMessage.notification);
      }
    });
};
