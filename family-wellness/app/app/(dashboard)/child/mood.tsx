import { View, Text } from "react-native";

export default function MoodCheck() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20 }}>🌈 Mood Check</Text>
      <Text style={{ marginTop: 10 }}>
        How are you feeling today? Pick a mood!
      </Text>
    </View>
  );
}
