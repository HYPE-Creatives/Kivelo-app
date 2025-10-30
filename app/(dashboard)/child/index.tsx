import { View, Text } from "react-native";

export default function ChildHome() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20 }}>🎮 Fun Zone</Text>
      <Text style={{ marginTop: 10 }}>
        Play interactive games and learn cool stuff!
      </Text>
    </View>
  );
}