import { View, Text } from "react-native";

export default function ChildHome() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", color: "#4CAF50" }}>
        🎉 Hey Friend! Welcome!
      </Text>
      <Text style={{ marginTop: 10 }}>
        Let’s have fun, share thoughts, and explore together 🚀
      </Text>
    </View>
  );
}
