// screens/MessagesScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext'; // Expecting { user, loading, db }
import colors from '../constants/colors';

export default function MessagesScreen() {
  const { user, loading, db } = useContext(AuthContext);
  const navigation = useNavigation();

  const [chatRooms, setChatRooms] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  useEffect(() => {
    // 1) Wait for AuthContext to finish
    if (loading) return;

    // 2) If no logged-in user, show error
    if (!user) {
      console.error('MessagesScreen: No current user. Cannot fetch chats.');
      setListError('You must be logged in to see your chats.');
      setListLoading(false);
      return;
    }

    // 3) If Firestore (db) not available
    if (!db) {
      console.error('MessagesScreen: Firestore (db) unavailable.');
      setListError('Chat service unavailable.');
      setListLoading(false);
      return;
    }

    // 4) Query chatRooms where participants array contains this user
    const roomsRef = collection(db, 'chatRooms');
    const q = query(
      roomsRef,
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTimestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          // Find the “other” participant’s UID
          const otherId = data.participants.find((pid) => pid !== user.uid);
          return {
            id: docSnap.id,
            otherUserId: otherId,
            lastMessage: data.lastMessage || '',
            lastMessageTimestamp: data.lastMessageTimestamp
              ? data.lastMessageTimestamp.toDate()
              : null,
            // We’ll fetch displayName + photo below
          };
        });

        // For each room, grab the denormalized displayName/photo of the other user
        const withDetailsPromises = loaded.map(async (room) => {
          const roomDocRef = doc(db, 'chatRooms', room.id);
          const snap = await getDoc(roomDocRef);
          if (!snap.exists()) return room;

          const rd = snap.data();
          const displayNameKey = `${room.otherUserId}_displayName`;
          const profilePhotoKey = `${room.otherUserId}_profilePhoto`;

          return {
            ...room,
            otherUserDisplayName: rd[displayNameKey] || 'Unknown',
            otherUserProfilePhoto:
              rd[profilePhotoKey] ||
              'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Photo',
          };
        });

        Promise.all(withDetailsPromises)
          .then((finalRooms) => {
            setChatRooms(finalRooms);
            setListLoading(false);
            setListError(null);
          })
          .catch((err) => {
            console.error('MessagesScreen: Error fetching room details:', err);
            setListError('Failed to load chats.');
            setListLoading(false);
          });
      },
      (err) => {
        console.error('MessagesScreen: onSnapshot error:', err);
        setListError('Failed to load chats.');
        setListLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, loading, db]);

  if (loading || listLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  if (listError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{listError}</Text>
      </View>
    );
  }

  // If there are no chatRooms, show “No chats yet” message
  if (chatRooms.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.header}>Chats</Text>
        <Text style={styles.emptyTitle}>No chats yet.</Text>
        <Text style={styles.emptySubtitle}>
          Start a conversation from a barber’s profile!
        </Text>
      </View>
    );
  }

  // Render each chat room as a row
  const renderRoom = ({ item }) => (
    <TouchableOpacity
      style={styles.roomRow}
      onPress={() =>
        navigation.navigate('ChatScreen', {
          recipientId: item.otherUserId,
          recipientDisplayName: item.otherUserDisplayName,
          recipientProfilePhoto: item.otherUserProfilePhoto,
        })
      }
    >
      <Image
        source={{ uri: item.otherUserProfilePhoto }}
        style={styles.avatar}
      />
      <View style={styles.textContainer}>
        <Text style={styles.nameText}>{item.otherUserDisplayName}</Text>
        <Text numberOfLines={1} style={styles.lastMessageText}>
          {item.lastMessage || 'No messages yet'}
        </Text>
      </View>
      {item.lastMessageTimestamp && (
        <Text style={styles.timestampText}>
          {item.lastMessageTimestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chats</Text>
      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRoom}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: colors.background,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  loadingText: {
    marginTop: 8,
    color: colors.textSecondary,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: colors.border,
    borderBottomWidth: 0.5,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: colors.lightGray,
  },
  textContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  lastMessageText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timestampText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
  },
});
