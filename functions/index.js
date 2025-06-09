// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Listen for new panic_alerts documents
exports.sendPanicAlertNotification = functions.firestore
    .document("panic_alerts/{alertId}")
    .onCreate(async (snap, context) => {
      const data = snap.data();
      const {anonymous, neighborhoodId} = data;

      // Only send notifications for non-anonymous alerts
      if (anonymous) {
        return null;
      }

      const alertId = context.params.alertId;
      const payload = {
        notification: {
          title: "Neighborhood Panic Alert",
          body: `${data.name} triggered an alert: ${data.emergencyType}`,
        },
        data: {
          alertId,
        },
      };

      // Publish to the topic named after the neighborhood
      try {
        await admin.messaging().sendToTopic(neighborhoodId, payload);
        console.log(`Notification sent to topic ${neighborhoodId}`);
      } catch (err) {
        console.error("Error sending FCM topic message:", err);
      }
      return null;
    });
