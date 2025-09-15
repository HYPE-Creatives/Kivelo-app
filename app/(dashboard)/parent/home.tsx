import { View, Text } from "react-native";

export default function Home() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        👋 Welcome, Parent!
      </Text>
      <Text style={{ marginTop: 10 }}>
        This is your dashboard Home screen.
      </Text>
    </View>
  );
}
