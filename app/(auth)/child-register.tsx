// app/(auth)/child-register.tsx
import { View, Text, StyleSheet } from 'react-native';

export default function ChildRegister() {
  return (
    <View style={styles.container}>
      <Text>Child Registration Screen</Text>
      {/* Add your child registration form here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});