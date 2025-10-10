import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function RoleSelection() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Who are you?</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(auth)/login")}
      >
        <Text style={styles.buttonText}>I’m a Parent</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#16A34A" }]}
        onPress={() => router.push("/(auth)/code-entry")}
      >
        <Text style={styles.buttonText}>I’m a Child</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F3F4F6", padding: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: "#111", marginBottom: 32 },
  button: { backgroundColor: "#1D4ED8", padding: 16, borderRadius: 10, width: "100%", marginBottom: 16 },
  buttonText: { color: "#fff", fontSize: 16, textAlign: "center" },
});
