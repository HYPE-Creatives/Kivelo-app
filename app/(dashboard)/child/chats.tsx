import { View, Text } from "react-native";

export default function Chats() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20 }}>💬 Chats</Text>
      <Text style={{ marginTop: 10, textAlign: "center" }}>
        Connect and chat with your friends here.
      </Text>
    </View>
  );
}
