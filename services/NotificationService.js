import * as Notifications from 'expo-notifications';

// Configure how notifications are handled when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Requests notification permissions
export async function registerForNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Notification permissions not granted!');
    return false;
  }

  return true;
}

// Displays an immediate local notification
export async function showNotification({ title, body, data = {} }) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: null, // immediate
  });
}

// Initializes notification listeners
export async function initNotifications(onReceived, onResponse) {
  const granted = await registerForNotifications();
  if (!granted) return {};

  const receivedSub = Notifications.addNotificationReceivedListener(onReceived);
  const responseSub = Notifications.addNotificationResponseReceivedListener(onResponse);

  return {
    removeReceivedListener: () => Notifications.removeNotificationSubscription(receivedSub),
    removeResponseListener: () => Notifications.removeNotificationSubscription(responseSub),
  };
}
