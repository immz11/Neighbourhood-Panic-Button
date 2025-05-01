import { Button, Text, View } from 'react-native';

export default function AlertScreen() {
  const triggerAlert = () => {
    // You can implement logic here later (e.g., push notification, SMS)
    alert('🚨 Panic button triggered!');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Panic Alert Screen</Text>
      <Button title="Send Alert" onPress={triggerAlert} />
    </View>
  );
}
