// app/(dashboard)/mood/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { TouchableOpacity, View } from "react-native";

export default function MoodLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        // ✅ Transparent header
        headerShown: true,
        headerTransparent: true,
        headerStyle: {
          backgroundColor: "transparent",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },


        presentation: "card",


        // ✅ Custom circular back button
        headerLeft: () => (
          <TouchableOpacity
            style={{
              marginLeft: 1.5,
              backgroundColor: "white",
              borderRadius: 50,
              width: 36,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowOffset: { width: 0, height: 1 },
              shadowRadius: 2,
              elevation: 2,
            }}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back-outline" size={20} color="black" />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen
        name="select"
        options={{ title: "" }}
      />
      <Stack.Screen
        name="intensity"
        options={{ title: "" }}
      />
      <Stack.Screen
        name="congratulations"
        options={{ title: "" }}
      />
    </Stack>
  );
}
