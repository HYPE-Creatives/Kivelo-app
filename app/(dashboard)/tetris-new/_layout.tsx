// Layout for the Tetris screens in this folder.
// Keeps a transparent header and a circular back button that navigates back.
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

export default function TetrisLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerStyle: {
          backgroundColor: "transparent",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        presentation: "card",
        headerLeft: () => (
          <TouchableOpacity
            style={{
              marginLeft: 6,
              backgroundColor: "white",
              borderRadius: 50,
              width: 36,
              height: 36,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.08,
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
      {/* Default screen for this folder is `index.tsx` */}
      <Stack.Screen name="index" options={{ title: "" }} />
    </Stack>
  );
}
