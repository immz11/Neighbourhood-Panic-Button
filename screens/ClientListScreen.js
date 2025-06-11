// screens/ClientListScreen.js
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';

import colors from '../constants/colors';
import commonStyles from '../constants/styles';
import { AuthContext } from '../context/AuthContext'; // Import AuthContext to get db instance

export default function ClientListScreen({ navigation }) {
  const { db } = useContext(AuthContext); // Get the Firestore database instance
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBarbers = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'barber'));
        const querySnapshot = await getDocs(q);

        const fetchedBarbers = querySnapshot.docs.map(doc => ({
          id: doc.id,
          // Ensure all expected fields are present, provide fallbacks
          displayName: doc.data().displayName || `${doc.data().firstName || ''} ${doc.data().lastName || ''}`.trim() || 'Unnamed Barber',
          firstName: doc.data().firstName || '',
          lastName: doc.data().lastName || '',
          profilePhotoUrl: doc.data().profilePhotoUrl || null,
          bio: doc.data().bio || null,
          phoneNumber: doc.data().phoneNumber || null,
          // Add any other relevant barber details you want to pass from Firestore
        }));
        setBarbers(fetchedBarbers);
      } catch (error) {
        console.error("Error fetching barbers:", error);
        Alert.alert('Error', 'Failed to load barbers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBarbers();
  }, [db]); // Depend on db to re-fetch if it changes (though usually static)

  const renderBarberItem = ({ item }) => (
    <TouchableOpacity
      style={styles.barberItem}
      onPress={() => navigation.navigate('BarberDetailScreen', {
        barberId: item.id,
        barberDisplayName: item.displayName, // Use the calculated displayName
        barberFirstName: item.firstName,
        barberLastName: item.lastName,
        barberProfilePhoto: item.profilePhotoUrl,
        barberBio: item.bio,
        barberPhoneNumber: item.phoneNumber,
        // Ensure you pass all relevant barber data here
      })}
    >
      {item.profilePhotoUrl ? (
        <Image source={{ uri: item.profilePhotoUrl }} style={styles.barberAvatar} />
      ) : (
        <Ionicons name="person-circle-outline" size={60} color={colors.textSecondary} />
      )}
      <View style={styles.barberInfo}>
        <Text style={styles.barberName}>
          {item.displayName} {/* Use the calculated displayName */}
        </Text>
        <Text style={styles.barberBioPreview} numberOfLines={1}>
          {item.bio || 'No bio available.'}
        </Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={commonStyles.loadingText}>Loading barbers...</Text>
      </View>
    );
  }

  if (barbers.length === 0) {
    return (
      <View style={commonStyles.emptyContainer}>
        <Ionicons name="cut-outline" size={80} color={colors.textSecondary} />
        <Text style={commonStyles.emptyText}>No barbers found.</Text>
        <Text style={commonStyles.emptyTextSmall}>
          Please check back later or add barbers to your database.
        </Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.title}>Our Barbers</Text>
      <FlatList
        data={barbers}
        keyExtractor={(item) => item.id}
        renderItem={renderBarberItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: 10,
  },
  barberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 10,
    marginHorizontal: 10,
    marginVertical: 5,
    // Apply platform-specific shadows
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 3px rgba(0,0,0,0.1)',
      },
    }),
  },
  barberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  barberInfo: {
    flex: 1,
  },
  barberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  barberBioPreview: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
});