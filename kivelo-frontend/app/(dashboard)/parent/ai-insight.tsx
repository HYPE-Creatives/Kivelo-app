import { View, Text } from "react-native";

export default function AIInsights() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", color: "#3F51B5" }}>
        📊 AI Insights
      </Text>
      <Text style={{ marginTop: 10, textAlign: "center", padding: 10 }}>
        Here you’ll see reports about your child’s moods, emotional patterns,
        and alerts if AI detects signs of distress, sadness, or risk of abuse.
      </Text>
    </View>
  );
}
