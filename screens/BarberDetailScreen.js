// screens/BarberDetailScreen.js
import React, { useLayoutEffect, useEffect, useContext } from 'react'; // Added useContext
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  serverTimestamp, // For accurate timestamps
} from 'firebase/firestore'; // Firebase Firestore imports

import colors from '../constants/colors';
import commonStyles from '../constants/styles';
import { AuthContext } from '../context/AuthContext'; // Import AuthContext

export default function BarberDetailScreen({ navigation, route }) {
  const { user, db, loading: authLoading } = useContext(AuthContext); // Get user and db from AuthContext

  // Destructure route.params (fallback to empty object if undefined)
  const {
    barberId,
    barberDisplayName = 'Barber',
    barberFirstName,
    barberLastName,
    barberProfilePhoto,
    barberBio,
    barberPhoneNumber,
    // ...any other details passed in
  } = route.params || {};

  // Debugging & validation
  useEffect(() => {
    console.log('BarberDetailScreen: route.params:', route.params);
    if (!barberId) {
      console.warn('BarberDetailScreen: barberId is missing!');
      Alert.alert('Error', 'Could not load barber details. Please try again.');
      navigation.goBack();
    }
  }, [route.params, barberId, navigation]);

  // Dynamically set header title to the barber’s display name
  useLayoutEffect(() => {
    navigation.setOptions({
      title: barberDisplayName,
      headerTitleAlign: 'center',
      headerShown: true,
      headerBackTitleVisible: false,
      headerTintColor: colors.text,
      headerStyle: {
        backgroundColor: colors.background,
      },
    });
  }, [navigation, barberDisplayName]);

  const handleMessageBarber = async () => {
    if (authLoading) {
      Alert.alert('Please wait', 'Authenticating user. Try again in a moment.');
      return;
    }
    if (!user || !user.uid) {
      Alert.alert('Authentication Required', 'You must be logged in to message a barber.');
      navigation.navigate('Login'); // Or appropriate auth screen
      return;
    }
    if (!db) {
      Alert.alert('Error', 'Chat service is unavailable. Please try again later.');
      return;
    }
    if (!barberId) {
      Alert.alert('Error', 'Barber ID is missing. Cannot start chat.');
      return;
    }

    const clientUid = user.uid;
    const clientDisplayName = user.displayName || user.email || 'Client'; // Fallback for client name
    const clientProfilePhoto = user.profilePhotoUrl || 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Photo'; // Fallback for client photo

    // 1. Check if a chat room already exists between these two users
    const chatRoomsRef = collection(db, 'chatRooms');
    const q = query(
      chatRoomsRef,
      where('participants', 'array-contains', clientUid),
      where('participants', 'array-contains', barberId)
    );

    try {
      const querySnapshot = await getDocs(q);
      let chatRoomId;

      if (!querySnapshot.empty) {
        // Chat room already exists, get its ID
        chatRoomId = querySnapshot.docs[0].id;
        console.log('Existing chat room found:', chatRoomId);
      } else {
        // No existing chat room, create a new one
        console.log('No existing chat room. Creating a new one...');

        // Fetch barber's full name if not already passed in params
        // Assuming barberProfilePhoto and barberDisplayName are reliable from route.params
        // If not, you might need to fetch the barber's user document here too
        // const barberDocRef = doc(db, 'users', barberId);
        // const barberDocSnap = await getDoc(barberDocRef);
        // const barberData = barberDocSnap.exists() ? barberDocSnap.data() : {};
        // const barberActualDisplayName = barberData.displayName || `${barberData.firstName || ''} ${barberData.lastName || ''}`.trim() || 'Barber';
        // const barberActualProfilePhoto = barberData.profilePhotoUrl || 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Photo';

        const newChatRoomRef = doc(chatRoomsRef); // Let Firestore generate the ID
        chatRoomId = newChatRoomRef.id;

        await setDoc(newChatRoomRef, {
          participants: [clientUid, barberId],
          lastMessage: '',
          lastMessageTimestamp: serverTimestamp(),
          createdAt: serverTimestamp(),
          // Denormalized data for Client
          [`${clientUid}_displayName`]: clientDisplayName,
          [`${clientUid}_profilePhoto`]: clientProfilePhoto,
          // Denormalized data for Barber (using data from route.params for now)
          [`${barberId}_displayName`]: barberDisplayName,
          [`${barberId}_profilePhoto`]: barberProfilePhoto || 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Photo',
          // You might add an unreadBy array here for notifications
          unreadBy: [],
        });
        console.log('New chat room created with ID:', chatRoomId);
      }

      // Navigate to the ChatScreen, passing the chatRoomId and recipient details
      navigation.navigate('ChatScreen', {
        chatRoomId: chatRoomId, // Pass the ID of the chat room
        recipientId: barberId,
        recipientDisplayName: barberDisplayName,
        recipientProfilePhoto: barberProfilePhoto,
      });

    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Could not start chat. Please try again.');
    }
  };

  const handleBookAppointment = () => {
    if (!barberId) {
      Alert.alert('Error', 'Barber ID is missing. Cannot book appointment.');
      return;
    }
    // Navigate to BookingScreen, passing along the barber’s info
    navigation.navigate('BookingScreen', {
      barberId,
      barberDisplayName,
      barberProfilePhoto,
    });
  };

  // If barberId is missing or auth is loading, show a loading/placeholder
  if (!barberId || authLoading) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={commonStyles.loadingText}>Loading barber details...</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profileHeader}>
          {barberProfilePhoto ? (
            <Image
              source={{ uri: barberProfilePhoto }}
              style={styles.barberImage}
            />
          ) : (
            <Ionicons
              name="person-circle-outline"
              size={150}
              color={colors.textSecondary}
            />
          )}
          <Text style={styles.barberDisplayName}>{barberDisplayName}</Text>
          {(barberFirstName || barberLastName) && (
            <Text style={styles.barberRealName}>
              {`${barberFirstName || ''} ${barberLastName || ''}`.trim()}
            </Text>
          )}
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.bioText}>
            {barberBio || 'This barber has not provided a biography yet.'}
          </Text>

          {barberPhoneNumber && (
            <>
              <Text style={styles.sectionTitle}>Contact</Text>
              <Text style={styles.contactText}>
                Phone: {barberPhoneNumber}
              </Text>
            </>
          )}

          <TouchableOpacity
            style={styles.messageButton}
            onPress={handleMessageBarber}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={24}
              color={colors.white}
              style={styles.buttonIcon}
            />
            <Text style={styles.messageButtonText}>
              Message {barberDisplayName}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBookAppointment}
          >
            <Ionicons
              name="calendar-outline"
              size={24}
              color={colors.white}
              style={styles.buttonIcon}
            />
            <Text style={styles.bookButtonText}>Book Appointment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    width: '100%',
    backgroundColor: colors.white,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      },
    }),
  },
  barberImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: colors.primary,
    marginBottom: 15,
  },
  barberDisplayName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  barberRealName: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  detailsContainer: {
    width: '90%',
    backgroundColor: colors.white,
    borderRadius: 15,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    marginTop: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 5,
  },
  bioText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 10,
  },
  contactText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 10,
  },
  messageButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  messageButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookButton: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  bookButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 10,
  },
});