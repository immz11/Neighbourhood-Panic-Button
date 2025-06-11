// screens/WelcomeScreen.js
import React from 'react';
import { View, Text, Button, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import commonStyles from '../constants/styles';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={commonStyles.container}>
      {navigation.canGoBack() && (
        <TouchableOpacity style={welcomeStyles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
      )}
      <Text style={commonStyles.title}>Welcome to ReserveMe</Text>
      <Text style={commonStyles.paragraph}>Yours in booking</Text>
      <Button title="Log In" onPress={() => navigation.navigate('Login')} color={colors.primary} />
      <Button title="Sign Up" onPress={() => navigation.navigate('Signup')} color={colors.secondary} />
    </View>
  );
}

const welcomeStyles = StyleSheet.create({
  back: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
});