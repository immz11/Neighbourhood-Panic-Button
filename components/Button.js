// components/Button.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import colors from '../constants/colors';

const CustomButton = ({ title, onPress, color = colors.primary, textColor = colors.lightText }) => {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: color, borderColor: color === colors.background ? colors.border : 'transparent' }]} // Add border for background buttons
      onPress={onPress}
      activeOpacity={0.7} // Reduce opacity slightly on press
    >
      <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16, // Increased vertical padding
    paddingHorizontal: 30, // Increased horizontal padding
    borderRadius: 10, // More rounded corners
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200, // Slightly wider buttons
    borderWidth: 1, // Added border for definition
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8, // Android shadow
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700', // Bolder text
    textTransform: 'uppercase', // Uppercase text for buttons
  },
});

export default CustomButton;
