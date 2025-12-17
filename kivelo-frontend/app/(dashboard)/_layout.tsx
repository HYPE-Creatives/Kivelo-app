// app/(dashboard)/_layout.tsx
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Text, View, ActivityIndicator, BackHandler } from 'react-native';
import { useEffect } from 'react';

export default function DashboardLayout() {
  const { user, isLoading } = useAuth();

  // Prevent hardware back button from going to auth screens
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      // Return true to prevent default back behavior when on dashboard
      // This prevents going back to login/auth screens
      return true;
    });

    return () => backHandler.remove();
  }, []);

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

  console.log("🏠 [DashboardLayout] User state:", JSON.stringify(user, null, 2));
  console.log("🏠 [DashboardLayout] user.hasSetPassword:", user.hasSetPassword);

  // Role-based access control
  if (user.role === 'child' && !user.hasSetPassword) {
    console.log("🏠 [DashboardLayout] Child needs to set password, redirecting...");
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