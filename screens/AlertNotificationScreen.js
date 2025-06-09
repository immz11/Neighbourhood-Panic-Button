import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import { firestore } from "../firebase";
import { UserContext } from "../UserContext";

const AlertNotificationScreen = () => {
  const route = useRoute();
  const { alertId } = route.params; 
  const [alertData, setAlertData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Optional: If you want to personalize instructions based on the current user
  const { currentUser } = useContext(UserContext);

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        const docRef = firestore.collection("panic_alerts").doc(alertId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
          Alert.alert("Error", "Alert not found.");
          setLoading(false);
          return;
        }

        setAlertData(docSnap.data());
      } catch (error) {
        console.error("Failed to fetch alert:", error);
        Alert.alert("Error", "Could not load alert details.");
      } finally {
        setLoading(false);
      }
    };

    fetchAlert();
  }, [alertId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!alertData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No data available.</Text>
      </View>
    );
  }

  const {
    name,
    anonymous,
    emergencyType,
    location,
    timestamp,
    cellphone,
    neighborhoodId,
  } = alertData;

  // Format timestamp to a human‐readable string
  const formattedTime = timestamp
    ? new Date(timestamp.toDate()).toLocaleString()
    : "Unknown";

  // Determine display name/phone if anonymous
  const displayName = anonymous ? "Anonymous" : name;
  const displayPhone = anonymous ? "Unavailable" : cellphone;

  // Choose instructions based on emergencyType
  const renderInstructions = () => {
    switch (emergencyType) {
      case "BreakingAndEntering":
        return "Please call the police immediately and avoid approaching the location if it is unsafe.";
      case "Fire":
        return "Call the fire department at 10111 and notify your neighbors to keep a safe distance. If safe, grab a fire extinguisher.";
      case "MedicalEmergency":
        return "Call EMS at 112 or 107. If you have medical training, render first aid while waiting for professionals.";
      case "Burglary":
        return "Do not approach. Dial the police and provide any eyewitness accounts if available.";
      case "DomesticViolence":
        return "Call the police (10111) and consider checking on the person only if you feel it is safe to intervene.";
      default:
        return "Please stay alert, call local authorities, or check on the neighbor if it is safe to do so.";
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Alert Details</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Who:</Text>
        <Text style={styles.value}>{displayName}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Why:</Text>
        <Text style={styles.value}>{emergencyType}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>When:</Text>
        <Text style={styles.value}>{formattedTime}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Cellphone:</Text>
        <Text style={styles.value}>{displayPhone}</Text>
      </View>

      <View style={styles.mapContainer}>
        <Text style={styles.label}>Where:</Text>
        {location && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
          >
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="Alert Location"
            />
          </MapView>
        )}
        {!location && (
          <Text style={[styles.value, { marginTop: 8 }]}>
            Location unavailable.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Further Instructions:</Text>
        <Text style={styles.instructions}>{renderInstructions()}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "red",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  value: {
    fontSize: 16,
    marginTop: 4,
  },
  mapContainer: {
    height: 250,
    marginBottom: 16,
  },
  map: {
    flex: 1,
    borderRadius: 8,
  },
  instructions: {
    fontSize: 16,
    marginTop: 4,
    fontStyle: "italic",
  },
});

export default AlertNotificationScreen;
