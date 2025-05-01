// firebase.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import {
    getReactNativePersistence,
    initializeAuth
} from 'firebase/auth'; // ✅ use /react-native

const firebaseConfig = {
    apiKey: "AIzaSyARMBaUT9Jek3BeENlO2s5YdUDg1eZbV5k",
    authDomain: "neighbourhood-alert-1.firebaseapp.com",
    projectId: "neighbourhood-alert-1",
    storageBucket: "neighbourhood-alert-1.firebasestorage.app",
    messagingSenderId: "386051432398",
    appId: "1:386051432398:web:12c846f3e2d3d2ee8bd59f"
  };
  
const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { auth };

