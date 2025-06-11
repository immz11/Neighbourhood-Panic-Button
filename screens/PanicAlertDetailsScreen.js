// screens/PanicAlertDetailsScreen.js (This file is for Web)
import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import MapContainer and Marker from react-leaflet for web
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
// You might also need to import Leaflet itself to handle default marker icons
// if you encounter issues with missing marker images.
// import L from 'leaflet';

// // Fix for default Leaflet marker icons not showing up with Webpack
// // (This is often needed for Webpack based React apps, less so for Expo Web but good to keep in mind)
// if (typeof window !== 'undefined' && L) {
//   delete L.Icon.Default.prototype._getIconUrl;
//   L.Icon.Default.mergeOptions({
//     iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default,
//     iconUrl: require('leaflet/dist/images/marker-icon.png').default,
//     shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
//   });
// }


export default function PanicAlertDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { alert } = route.params;

  // Default region for the map if location is not available or for initial render
  // Using a center point and zoom for Leaflet
  const defaultMapProps = {
    center: [-22.5594, 17.0765], // Default to Windhoek, Namibia [latitude, longitude]
    zoom: 13, // A good default zoom level
    scrollWheelZoom: false, // Disable scroll wheel zoom for static display
    dragging: false, // Disable dragging
    doubleClickZoom: false, // Disable double click zoom
    zoomControl: false, // Hide zoom controls
  };

  if (!alert) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>No alert data found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Format timestamp for display
  const formattedTimestamp = alert.timestamp ?
    new Date(alert.timestamp.toDate ? alert.timestamp.toDate() : alert.timestamp).toLocaleString('en-NA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    : 'N/A';

  // Determine the position for the Leaflet map and marker
  const alertPosition = alert.location
    ? [alert.location.latitude, alert.location.longitude]
    : defaultMapProps.center; // Fallback to default if no alert location

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Panic Alert Details</Text>

        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>Emergency Type:</Text>
          <Text style={styles.detailValue}>{alert.emergencyType || 'Not specified'}</Text>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>Time of Alert:</Text>
          <Text style={styles.detailValue}>{formattedTimestamp}</Text>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>Sender:</Text>
          <Text style={styles.detailValue}>
            {alert.anonymous ? 'Anonymous' : alert.name || 'N/A'}
          </Text>
        </View>

        {!alert.anonymous && alert.cellphone && (
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Contact Number:</Text>
            <Text style={styles.detailValue}>{alert.cellphone}</Text>
          </View>
        )}

        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>Neighborhood:</Text>
          <Text style={styles.detailValue}>{alert.neighborhoodId || 'N/A'}</Text>
        </View>

        {/* Map Integration for Web (Leaflet) */}
        {alert.location && (
          <View style={styles.mapCard}>
            <Text style={styles.detailLabel}>Location:</Text>
            <View style={styles.mapContainer}>
              <MapContainer
                center={alertPosition}
                zoom={defaultMapProps.zoom}
                scrollWheelZoom={defaultMapProps.scrollWheelZoom}
                dragging={defaultMapProps.dragging}
                doubleClickZoom={defaultMapProps.doubleClickZoom}
                zoomControl={defaultMapProps.zoomControl}
                style={styles.map} // Apply height and width here
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={alertPosition}>
                  {/* You can add a Popup here if needed */}
                  {/* <Popup>
                    {alert.emergencyType || "Emergency"} <br /> {alert.name || "Alert Location"}
                  </Popup> */}
                </Marker>
              </MapContainer>
              <Text style={styles.mapCoordsText}>
                Lat: {alert.location.latitude?.toFixed(4)}, Long: {alert.location.longitude?.toFixed(4)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    left: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 18,
    color: '#111827',
  },
  errorText: {
    fontSize: 18,
    color: '#D00000',
    textAlign: 'center',
  },
  // Map specific styles (updated for Leaflet)
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  mapContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
    height: 250, // Fixed height for the map view
    width: '100%',
    borderColor: '#E5E7EB',
    borderWidth: 1,
  },
  map: {
    height: '100%', // Make the map fill its container's height
    width: '100%',  // Make the map fill its container's width
  },
  mapCoordsText: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 10,
    textAlign: 'center',
  },
});