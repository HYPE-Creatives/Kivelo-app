// app/(dashboard)/_layout.tsx
import { Stack } from "expo-router";

export default function DashboardLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
