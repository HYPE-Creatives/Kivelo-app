import { View, Text } from "react-native";

export default function Journal() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20 }}>📖 Journal Section</Text>
      <Text style={{ marginTop: 10 }}>Track your child’s entries here.</Text>
    </View>
  );
}
