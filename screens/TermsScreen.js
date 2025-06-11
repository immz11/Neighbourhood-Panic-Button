// screens/TermsScreen.js
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Alert, CheckBox } from 'react-native';
import colors from '../constants/colors';
import commonStyles from '../constants/styles';

export default function TermsScreen({ navigation }) {
  const [accepted, setAccepted] = useState(false);

  const handleProceed = () => {
    if (!accepted) {
      Alert.alert('Please Accept', 'You must accept the terms and conditions to proceed.');
      return;
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'ClientDashboard' }],
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={commonStyles.title}>Terms and Conditions</Text>
      <Text style={commonStyles.paragraph}>
        Welcome to our app. By using this application, you agree to be bound by the following terms and conditions. Please read them carefully.
      </Text>
      <Text style={commonStyles.paragraph}>
        Section 1.1: User Responsibilities. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.
      </Text>
      <Text style={commonStyles.paragraph}>
        Section 1.2: Privacy Policy. We collect and use your personal data in accordance with our privacy policy. By using this app, you consent to our data practices.
      </Text>
      <Text style={commonStyles.paragraph}>
        Section 1.3: Service Limitations. We may update, suspend, or terminate the app at any time without prior notice. We are not liable for any resulting consequences.
      </Text>

      <View style={styles.acceptContainer}>
        <CheckBox value={accepted} onValueChange={setAccepted} />
        <Text style={styles.acceptText}>I accept the terms and conditions</Text>
      </View>

      <Button
        title="Proceed to Home"
        onPress={handleProceed}
        color={colors.primary}
        disabled={!accepted}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  acceptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  acceptText: {
    marginLeft: 10,
  },
});