// screens/SignUpNeighborhoodScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { setDoc, doc, collection, getDocs } from 'firebase/firestore';
import styles from '../styles'; // your shared styling

export default function SignUpNeighborhoodScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // Retrieve the values passed from Step 1:
  const {
    fullName,
    idNumber,
    email,
    cellphone,
    password,
    gender,
  } = route.params || {};

  // If any of these are missing, kick the user back to Step 1
  useEffect(() => {
    if (
      fullName === undefined ||
      idNumber === undefined ||
      email === undefined ||
      cellphone === undefined ||
      password === undefined ||
      gender === undefined
    ) {
      Alert.alert(
        'Error',
        'Missing signup details. Please start over.'
      );
      navigation.reset({
        index: 0,
        routes: [{ name: 'SignUpDetails' }],
      });
    }
  }, []);

  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(true);
  const [townsData, setTownsData] = useState({});
  const [selectedTown, setSelectedTown] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchNeighborhoods() {
      try {
        const collRef = collection(db, 'neighborhoods');
        const snapshot = await getDocs(collRef);

        const mapping = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const docId = docSnap.id;
          const { name, town } = data;

          if (!mapping[town]) {
            mapping[town] = [];
          }
          mapping[town].push({ id: docId, name });
        });

        const sortedMapping = {};
        Object.keys(mapping)
          .sort()
          .forEach((t) => {
            sortedMapping[t] = mapping[t].sort((a, b) =>
              a.name.localeCompare(b.name)
            );
          });

        setTownsData(sortedMapping);

        const allTowns = Object.keys(sortedMapping);
        if (allTowns.length > 0) {
          const firstTown = allTowns[0];
          setSelectedTown(firstTown);
          const firstNB = sortedMapping[firstTown][0]?.id || null;
          setSelectedNeighborhood(firstNB);
        }
      } catch (err) {
        console.error('Error loading neighborhoods:', err);
        Alert.alert(
          'Load Error',
          'Could not load neighborhoods. Please check your internet connection.'
        );
      } finally {
        setLoadingNeighborhoods(false);
      }
    }

    fetchNeighborhoods();
  }, []);

  useEffect(() => {
    if (selectedTown && townsData[selectedTown]) {
      const nbs = townsData[selectedTown];
      if (nbs.length > 0) {
        setSelectedNeighborhood(nbs[0].id);
      } else {
        setSelectedNeighborhood(null);
      }
    }
  }, [selectedTown, townsData]);

  const handleSubmit = async () => {
    setError('');
    if (!selectedTown || !selectedNeighborhood) {
      setError('Please select both a Town and a Neighborhood.');
      return;
    }

    setSubmitting(true);
    try {
      // A) Create Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // B) Save user details
      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        idNumber,
        cellphone,
        gender,
        email,
        town: selectedTown,
        neighborhoodId: selectedNeighborhood,
        createdAt: new Date(),
      });

      // C) Redirect to Login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (err) {
      console.error('Signup error:', err);
      let message = 'Sign-up failed. Please try again.';
      if (err.code === 'auth/email-already-in-use')
        message = 'Email already in use.';
      else if (err.code === 'auth/weak-password')
        message = 'Password should be at least 6 characters.';
      else if (err.code === 'auth/invalid-email')
        message = 'Invalid email format.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingNeighborhoods) {
    return (
      <View style={localStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#ED4C5C" />
        <Text style={{ marginTop: 12 }}>Loading neighborhoods…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={localStyles.container}>
      <TouchableOpacity
        style={localStyles.backArrow}
        onPress={() => navigation.goBack()}
      >
        <Text style={localStyles.backArrowText}>{'‹'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Sign Up – Step 2 of 2</Text>
      <Text style={styles.subtitle}>Select your Town & Neighborhood</Text>

      <View style={localStyles.filterCard}>
        <View style={localStyles.filterHeader}>
          <Text style={localStyles.filterTitle}>Filter</Text>
          <Text style={localStyles.filterIcon}>☰</Text>
        </View>

        <Text style={localStyles.label}>Choose City</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={localStyles.chipScroll}
        >
          {Object.keys(townsData).map((townKey) => {
            const isSelected = selectedTown === townKey;
            return (
              <TouchableOpacity
                key={townKey}
                style={[
                  localStyles.chip,
                  isSelected && localStyles.chipSelected,
                ]}
                onPress={() => setSelectedTown(townKey)}
              >
                <Text
                  style={[
                    localStyles.chipText,
                    isSelected && localStyles.chipTextSelected,
                  ]}
                >
                  {townKey}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={[localStyles.label, { marginTop: 16 }]}>
          Choose Neighborhood
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={localStyles.chipScroll}
        >
          {selectedTown &&
            townsData[selectedTown].map((nb) => {
              const isSelNB = selectedNeighborhood === nb.id;
              return (
                <TouchableOpacity
                  key={nb.id}
                  style={[
                    localStyles.chip,
                    isSelNB && localStyles.chipSelected,
                  ]}
                  onPress={() => setSelectedNeighborhood(nb.id)}
                >
                  <Text
                    style={[
                      localStyles.chipText,
                      isSelNB && localStyles.chipTextSelected,
                    ]}
                  >
                    {nb.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, submitting && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Submit</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
    backgroundColor: '#F9FAFB',
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    marginBottom: 20,
    marginLeft: 4,
    padding: 8,
  },
  backArrowText: {
    fontSize: 24,
    color: '#555',
  },
  filterCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  filterIcon: {
    fontSize: 18,
    color: '#6B7280',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  chipScroll: {
    paddingVertical: 4,
  },
  chip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#EF4444',
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
  },
  chipTextSelected: {
    color: '#FFF',
  },
});
