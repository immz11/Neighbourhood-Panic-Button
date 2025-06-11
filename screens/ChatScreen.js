// screens/ChatScreen.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { GiftedChat, Bubble, Send, InputToolbar } from 'react-native-gifted-chat';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  setDoc,       // ← we need this for creating a chat room
  updateDoc,
} from 'firebase/firestore';
import { useRoute } from '@react-navigation/native';

import { AuthContext } from '../context/AuthContext'; // ← expecting { user, loading, db }
import colors from '../constants/colors';
import { Feather } from '@expo/vector-icons';

// Fallback avatar URL if a participant doesn’t have one
const DEFAULT_PARTICIPANT_AVATAR_URL =
  'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Photo';

export default function ChatScreen() {
  const route = useRoute();
  const {
    recipientId,
    recipientDisplayName,
    recipientProfilePhoto,
  } = route.params;

  // Make sure your AuthContext.Provider is passing exactly these property names.
  const { user, loading, db } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [chatLoading, setChatLoading] = useState(true);
  const [chatError, setChatError] = useState(null);

  // Debug logs (remove or comment out once everything works)
  console.log('ChatScreen: route.params:', route.params);
  console.log('ChatScreen: user from AuthContext:', user);
  console.log('ChatScreen: db from AuthContext:', db);
  console.log('ChatScreen: loading from AuthContext:', loading);

  useEffect(() => {
    // 1) Wait for the AuthContext to finish loading
    if (loading) {
      console.log('ChatScreen: waiting for auth...');
      return;
    }

    // 2) If there's no signed‐in user, show an error
    if (!user) {
      console.error('ChatScreen: user is null/undefined. Not signed in.');
      setChatError('You must be logged in to chat.');
      setChatLoading(false);
      return;
    }

    // 3) If Firestore instance isn’t available, show an error
    if (!db) {
      console.error('ChatScreen: Firestore (db) is not available.');
      setChatError('Chat service is unavailable.');
      setChatLoading(false);
      return;
    }

    const currentUserId = user.uid;
    // Sort the two UIDs so that chatRoomId is deterministic (e.g. “A_B”)
    const usersArray = [currentUserId, recipientId].sort();
    const generatedChatRoomId = usersArray.join('_');

    setChatRoomId(generatedChatRoomId);
    console.log('ChatScreen: chatRoomId:', generatedChatRoomId);

    // 4) Subscribe to the messages subcollection, sorted by createdAt descending
    const messagesRef = collection(db, 'chatRooms', generatedChatRoomId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedMessages = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            _id: docSnap.id,
            text: data.text,
            createdAt: data.createdAt.toDate(), // Firestore → JS Date
            user: {
              _id: data.senderId,
              name: data.senderDisplayName,
              avatar: data.senderProfilePhoto || DEFAULT_PARTICIPANT_AVATAR_URL,
            },
          };
        });
        setMessages(loadedMessages);
        setChatLoading(false);
        setChatError(null);
        console.log('ChatScreen: Loaded messages count:', loadedMessages.length);
      },
      (error) => {
        console.error('ChatScreen: Error fetching messages:', error);
        setChatError('Failed to load messages.');
        setChatLoading(false);
      }
    );

    // 5) Create the chat room document if it doesn’t exist (so we can track lastMessage, participants, etc.)
    const chatRoomDocRef = doc(db, 'chatRooms', generatedChatRoomId);
    getDoc(chatRoomDocRef)
      .then(async (docSnap) => {
        if (!docSnap.exists()) {
          console.log('ChatScreen: Creating new chatRoom document for ID:', generatedChatRoomId);
          await setDoc(chatRoomDocRef, {
            participants: [currentUserId, recipientId],
            lastMessage: null,
            lastMessageTimestamp: null,
            createdAt: Timestamp.now(),
            // Denormalize displayName/photo for each participant
            [`${currentUserId}_displayName`]:
              user.displayName || `User-${currentUserId.substring(0, 6)}`,
            [`${currentUserId}_profilePhoto`]:
              user.photoURL || DEFAULT_PARTICIPANT_AVATAR_URL,
            [`${recipientId}_displayName`]: recipientDisplayName,
            [`${recipientId}_profilePhoto`]:
              recipientProfilePhoto || DEFAULT_PARTICIPANT_AVATAR_URL,
          });
        }
      })
      .catch((error) => {
        console.error('ChatScreen: Error creating/checking chatRoom doc:', error);
      });

    return () => {
      console.log('ChatScreen: Unsubscribing from messages listener');
      unsubscribe();
    };
  }, [user, db, loading, recipientId, recipientDisplayName, recipientProfilePhoto]);

  // --- Handler to send a new message ---
  const onSend = useCallback(
    async (newMessages = []) => {
      if (!db || !user || !chatRoomId) {
        console.error('ChatScreen: Cannot send message—missing db/user/chatRoomId');
        setChatError('Cannot send message. Please try again.');
        return;
      }

      const currentUserId = user.uid;
      const sentMessage = newMessages[0];

      const messageData = {
        text: sentMessage.text,
        createdAt: Timestamp.now(),
        senderId: currentUserId,
        senderDisplayName:
          user.displayName || `User-${currentUserId.substring(0, 6)}`,
        senderProfilePhoto:
          user.photoURL || DEFAULT_PARTICIPANT_AVATAR_URL,
        receiverId: recipientId,
        receiverDisplayName: recipientDisplayName,
        receiverProfilePhoto:
          recipientProfilePhoto || DEFAULT_PARTICIPANT_AVATAR_URL,
      };

      try {
        // 1) Add to Firestore subcollection
        await addDoc(
          collection(db, 'chatRooms', chatRoomId, 'messages'),
          messageData
        );
        console.log('ChatScreen: Message sent to Firestore.');

        // 2) Update “lastMessage” fields on the chatRoom doc
        const chatRoomDocRef = doc(db, 'chatRooms', chatRoomId);
        await updateDoc(chatRoomDocRef, {
          lastMessage: sentMessage.text,
          lastMessageTimestamp: Timestamp.now(),
          lastSenderId: currentUserId,
        });
      } catch (error) {
        console.error('ChatScreen: Error sending message:', error);
        setChatError('Failed to send message.');
      }
    },
    [
      db,
      user,
      chatRoomId,
      recipientId,
      recipientDisplayName,
      recipientProfilePhoto,
    ]
  );

  // --- Custom Bubble styling ---
  const renderBubble = (props) => {
    const isMine = props.currentMessage.user._id === user?.uid;
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: { backgroundColor: colors.primary },
          left: { backgroundColor: colors.lightGray },
        }}
        textStyle={{
          right: { color: '#fff' },
          left: { color: colors.text },
        }}
      />
    );
  };

  // --- Custom Send button (using Expo’s Feather icon) ---
  const renderSend = (props) => (
    <Send {...props}>
      <View style={styles.sendingContainer}>
        <Feather name="send" size={24} color={colors.primary} />
      </View>
    </Send>
  );

  // --- Hide the input toolbar if we’re still loading or hit an error ---
  const renderInputToolbar = (props) => {
    if (chatLoading || chatError) {
      return null;
    }
    return <InputToolbar {...props} containerStyle={styles.inputToolbar} />;
  };

  // --- Show a loading spinner while waiting for auth or messages ---
  const renderLoadingView = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Loading chat...</Text>
    </View>
  );

  // --- Show a simple error view if something breaks critically ---
  const renderErrorView = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Error</Text>
      <Text style={styles.errorText}>{chatError}</Text>
      {/* You can add a “Retry” button here if you want */}
    </View>
  );

  // === MAIN RENDER LOGIC ===
  if (loading || chatLoading) {
    // Still waiting for Firebase Auth or initial messages
    return renderLoadingView();
  }

  if (chatError) {
    return renderErrorView();
  }

  if (!user) {
    // If somehow user is still null (fallback)
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Authentication Required</Text>
        <Text style={styles.errorText}>
          Please log in or restart the app to enable chat.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{
          _id: user.uid,
          name: user.displayName || `You-${user.uid.substring(0, 6)}`,
          avatar: user.photoURL || DEFAULT_PARTICIPANT_AVATAR_URL,
        }}
        renderBubble={renderBubble}
        renderSend={renderSend}
        renderInputToolbar={renderInputToolbar}
        alwaysShowSend={true}
        showAvatarForEveryMessage={true}
        keyboardShouldPersistTaps="never"
        messagesContainerStyle={styles.messagesContainer}
      />
      {Platform.OS === 'android' && <KeyboardAvoidingView behavior="padding" />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    color: colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 10,
  },
  errorText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: 5,
  },
  sendingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    marginRight: 10,
  },
  inputToolbar: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  messagesContainer: {
    paddingBottom: 0,
  },
});
