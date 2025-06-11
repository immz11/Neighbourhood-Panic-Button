// constants/styles.js
import { StyleSheet } from 'react-native';
import colors from './colors'; // Import colors to use in styles

const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 25, // Increased horizontal padding
    paddingVertical: 30, // Added vertical padding
  },
  title: {
    fontSize: 32, // Larger title for more presence
    fontWeight: '800', // Bolder font weight
    marginBottom: 40, // More space below title
    color: colors.primary, // Using primary color for titles
    textAlign: 'center',
    letterSpacing: 0.5, // Slight letter spacing for style
  },
  subTitle: { // New style for secondary headings
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    color: colors.secondary,
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 15, // Slightly more line spacing
    color: colors.text,
    textAlign: 'justify',
    lineHeight: 24,
  },
  textInput: { // Basic style for text input fields (if you add them later)
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: 15,
  },
  // Add other common styles here as needed
});

export default commonStyles;
