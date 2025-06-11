// services/firebaseConfig.js

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// services/firebaseConfig.js

// ─── 1. Define your config object EXACTLY ─────────────────────────────────────
export const firebaseConfig = {
  apiKey: 'AIzaSyDA-oRt6E9qzxX5EDbjhTdL2cU8-xvXHVs',
  authDomain: 'reserveme-8b6a6.firebaseapp.com',
  databaseURL: 'https://reserveme-8b6a6-default-rtdb.firebaseio.com',
  projectId: 'reserveme-8b6a6',
  storageBucket: 'reserveme-8b6a6.firebasestorage.app',
  messagingSenderId: '799896568782',
  appId: '1:799896568782:web:1300c18633676a9886219f',
  measurementId: 'G-B0SJRTX5WD',
};
// ────────────────────────────────────────────────────────────────────────────────

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth instances
const firestore = getFirestore(app); // Changed 'db' to 'firestore' here
const auth = getAuth(app);

// Export Firestore and Auth so other parts of your app can import them
export { firestore, auth }; // Changed 'db' to 'firestore' here in the export statement