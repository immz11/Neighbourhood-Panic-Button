// styles.js
import { StyleSheet } from 'react-native';

const globalStyles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ED4C5C',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#ED4C5C',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: '#000000',
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '500',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  genderButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ED4C5C',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  genderButtonSelected: {
    backgroundColor: '#ED4C5C',
  },
  genderText: {
    color: '#000000',
    fontWeight: '500',
  },
  loginText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#ED4C5C',
    fontSize: 15,
    fontWeight: '500',
  },
  
});

export default globalStyles;
