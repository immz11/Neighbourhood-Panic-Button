import { useRouter } from 'expo-router';
import { Button, Text, View } from 'react-native';

export default function Home() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to the Panic Button App</Text>
      <Button title="Go to Login" onPress={() => router.push('/login')} />
      <Button title="Go to Sign Up" onPress={() => router.push('/signup')} />
    </View>
  );
}
