// app/(dashboard)/mood/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter, useSegments } from "expo-router";
import { TouchableOpacity } from "react-native";
import { ROUTES } from "../../routes";

export default function MoodLayout() {
  const router = useRouter();
  const segments = useSegments();

  return (
    <Stack
      screenOptions={{
        // ✅ Transparent header
        headerShown: true,
        headerTransparent: true,
        headerStyle: {
          backgroundColor: "transparent",
          shadowOpacity: 0,
          borderBottomWidth: 0,
        } as any,


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
            // restore previous navigation state (pop) when possible, otherwise replace to a safe fallback
            onPress={() => {
              if (segments && segments.length > 1) router.back();
              else router.replace(ROUTES.CHILD_GAMES as any);
            }}
          >
            <Ionicons name="chevron-back-outline" size={20} color="black" />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "" }}
      />
      <Stack.Screen
        name="game"
        options={{ title: "" }}
      />
      <Stack.Screen
        name="congrats"
        options={{ title: "" }}
      />
    </Stack>
  );
}
