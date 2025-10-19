// app/(dashboard)/_layout.tsx
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Text, View, ActivityIndicator } from 'react-native';

export default function DashboardLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Role-based access control
  if (user.role === 'child' && !user.hasSetPassword) {
    return <Redirect href="/(auth)/set-password" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ai" />
      <Stack.Screen name="child" />
      <Stack.Screen name="parent" />
    </Stack>
  );
}