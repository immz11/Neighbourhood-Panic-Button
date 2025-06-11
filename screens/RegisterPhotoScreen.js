// screens/RegisterPhotoScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, Button, Image, ActivityIndicator, Alert, StyleSheet, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import colors from '../constants/colors';
import commonStyles from '../constants/styles';
import { auth, firestore } from '../services/firebaseConfig';
import { getStorage, ref, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function RegisterPhotoScreen({ navigation }) {
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    (async () => {
      console.log('Requesting media library permissions');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission status:', status);
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Permission to access your photos is required!');
      }
    })();
  }, []);

  const pickImage = async () => {
    console.log('pickImage called');
    if (!hasPermission) {
      console.warn('No permission to access media library');
      return;
    }
    console.log('Launching image picker');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: Platform.OS === 'web', // only include base64 for web
    });
    console.log('Picker result:', result);
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const uri = asset.uri;
      setImageUri(uri);
      console.log('Image URI set:', uri);
    } else if (result.canceled) {
      console.log('Image picker was cancelled');
    } else {
      console.warn('Unexpected picker result format');
    }
  };

  const uploadImage = async () => {
    console.log('uploadImage called');
    if (!imageUri) {
      console.warn('No image URI to upload');
      return;
    }
    setUploading(true);
    try {
      let downloadUrl = imageUri;

      if (!Platform.OS === 'web') {
        // If native or if you have Storage enabled, upload to Firebase Storage
        const storage = getStorage();
        const timestamp = Date.now();
        const storagePath = `users/${uid}/profile_${timestamp}.jpg`;
        const storageRef = ref(storage, storagePath);
        console.log('Uploading to storage path:', storagePath);

        console.log('Fetching image blob from URI:', imageUri);
        const response = await fetch(imageUri);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob);

        console.log('Upload successful, retrieving download URL');
        downloadUrl = await getDownloadURL(storageRef);
        console.log('Download URL:', downloadUrl);
      } else {
        console.log('Skipping storage upload: storing image URI directly in Firestore');
      }

      // Update Firestore user document
      const userDoc = doc(firestore, 'users', uid);
      console.log('Updating Firestore document at users/' + uid);
      await updateDoc(userDoc, {
        profilePhotoUrl: downloadUrl,
        updatedAt: serverTimestamp(),
      });
      console.log('Firestore document updated');

      // Navigate to next registration step
      navigation.navigate('RegisterPreferences');
      console.log('Navigated to RegisterPreferences');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Error', 'Could not upload image. Please try again.');
    } finally {
      setUploading(false);
      console.log('Upload process finished');
    }
  };

  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.title}>Register: Add Photo</Text>
      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}
      <Button title="Choose Photo" onPress={pickImage} color={colors.primary} />
      {uploading ? (
        <ActivityIndicator style={styles.spinner} />
      ) : (
        <Button
          title="Next: Preferences"
          onPress={uploadImage}
          color={colors.primary}
          disabled={!imageUri}
        />
      )}
      <Button title="Back to Info" onPress={() => navigation.goBack()} color={colors.secondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  spinner: {
    marginVertical: 10,
  },
});
