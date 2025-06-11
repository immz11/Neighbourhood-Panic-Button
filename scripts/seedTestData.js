// scripts/seedTestData.js

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

// 1. Copy the same firebaseConfig object from services/firebaseConfig.js:
const firebaseConfig = {
  apiKey: 'AIzaSyDA-oRt6E9qzxX5EDbjhTdL2cU8-xvXHVs',
  authDomain: 'reserveme-8b6a6.firebaseapp.com',
  databaseURL: 'https://reserveme-8b6a6-default-rtdb.firebaseio.com',
  projectId: 'reserveme-8b6a6',
  storageBucket: 'reserveme-8b6a6.firebasestorage.app',
  messagingSenderId: '799896568782',
  appId: '1:799896568782:web:1300c18633676a9886219f',
  measurementId: 'G-B0SJRTX5WD',
};

// 2. Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  try {
    // ─── a) Create two users ─────────────────────────────────────────────────────
    await setDoc(doc(db, 'users', 'client_test_001'), {
      userId: 'client_test_001',
      email: 'client@example.com',
      role: 'client',
      firstName: 'Alex',
      lastName: 'Johnson',
      phoneNumber: '555-1234',
      profilePhotoUrl: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('Created users/client_test_001');

    await setDoc(doc(db, 'users', 'barber_test_001'), {
      userId: 'barber_test_001',
      email: 'barber@example.com',
      role: 'barber',
      firstName: 'Sam',
      lastName: 'Reed',
      phoneNumber: '555-5678',
      profilePhotoUrl: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('Created users/barber_test_001');

    // ─── b) Create barber profile ─────────────────────────────────────────────────
    await setDoc(doc(db, 'barbers', 'barber_test_001'), {
      userId: 'barber_test_001',
      bio: 'Experienced barber specializing in fades and beard trims.',
      location: '123 Main St, Springfield',
      averageRating: 4.5,
      totalReviews: 10,
      servicesOffered: [
        { serviceId: 'mens_cut', price: 25 },
        { serviceId: 'beard_trim', price: 15 },
      ],
      availability: {
        monday: { startTime: '09:00', endTime: '17:00' },
        wednesday: { startTime: '10:00', endTime: '16:00' },
        friday: { startTime: '08:00', endTime: '13:00' },
      },
      portfolioImages: [
        'https://firebasestorage.googleapis.com/v0/b/reserveme-8b6a6.appspot.com/o/sample1.jpg?alt=media',
        'https://firebasestorage.googleapis.com/v0/b/reserveme-8b6a6.appspot.com/o/sample2.jpg?alt=media',
      ],
      isAvailable: true,
      updatedAt: serverTimestamp(),
    });
    console.log('Created barbers/barber_test_001');

    // ─── c) Create services ─────────────────────────────────────────────────────────
    await setDoc(doc(db, 'services', 'mens_cut'), {
      name: "Men's Haircut",
      description: 'Standard men’s haircut (30 minutes).',
      defaultPrice: 25,
      durationMinutes: 30,
      iconName: 'scissors',
    });
    console.log('Created services/mens_cut');

    await setDoc(doc(db, 'services', 'beard_trim'), {
      name: 'Beard Trim',
      description: 'Professional beard trim (15 minutes).',
      defaultPrice: 15,
      durationMinutes: 15,
      iconName: 'beard',
    });
    console.log('Created services/beard_trim');

    // ─── d) Create a sample booking ─────────────────────────────────────────────────
    await setDoc(doc(db, 'bookings', 'booking_test_001'), {
      clientId: 'client_test_001',
      barberId: 'barber_test_001',
      serviceId: 'mens_cut',
      bookingDate: new Date('2025-07-20T10:00:00Z'),
      status: 'pending',
      price: 25,
      notes: 'Please give a fade on the sides.',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('Created bookings/booking_test_001');

    // ─── e) Create a sample review ──────────────────────────────────────────────────
    await setDoc(doc(db, 'reviews', 'review_test_001'), {
      barberId: 'barber_test_001',
      clientId: 'client_test_001',
      bookingId: 'booking_test_001',
      rating: 5,
      comment: 'Great haircut—very precise!',
      createdAt: serverTimestamp(),
    });
    console.log('Created reviews/review_test_001');

    console.log('✅ Seed data successfully written to Firestore.');
  } catch (error) {
    console.error('Failed to seed Firestore with test data:', error);
  }
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
