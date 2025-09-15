import { View, Text } from "react-native";

export default function Settings() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20 }}>⚙️ Settings</Text>
      <Text style={{ marginTop: 10 }}>Manage your account & preferences.</Text>
    </View>
  );
}
