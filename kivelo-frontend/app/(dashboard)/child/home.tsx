// app/(dashboard)/child/home.tsx
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "expo-router";

export default function ChildHome() {
  const { user } = useAuth();
  const router = useRouter();

  const handleChangePassword = () => {
    Alert.alert(
      "Change Password",
      "Would you like to set a new password?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Continue", onPress: () => router.push("/(auth)/set-password") }
      ]
    );
  };

  const dashboardCards = [
    { title: "🎮 My Activities", description: "Explore fun activities and games", action: "Play Now", onPress: () => console.log("Navigate to activities") },
    { title: "📚 Learning Hub", description: "Discover new things to learn", action: "Start Learning", onPress: () => console.log("Navigate to learning hub") },
    { title: "🔐 Account Security", description: "Update your password and security settings", action: "Change Password", onPress: handleChangePassword },
    { title: "🌟 Achievements", description: "View your progress and badges", action: "View Achievements", onPress: () => console.log("Navigate to achievements") },
    { title: "💬 Chat & Connect", description: "Message friends and family", action: "Start Chatting", onPress: () => console.log("Navigate to chat") },
    { title: "📅 My Schedule", description: "View your daily activities and events", action: "View Schedule", onPress: () => console.log("Navigate to schedule") }
  ];

  // Use the child's actual name from the user object
  const displayName = user?.name || "there";

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeTitle}>
        Welcome, {displayName}! 🎉  
      </Text>
      <Text style={styles.subtitle}>
        Ready for some fun today? Let's explore! 🚀
      </Text>

      {!user?.hasSetPassword && (
        <TouchableOpacity style={styles.passwordBanner} onPress={handleChangePassword}>
          <Text style={styles.passwordBannerText}>
            🔒 Please set your password to secure your account
          </Text>
          <Text style={styles.passwordBannerAction}>Set Password →</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.cardsContainer}>
        {dashboardCards.map((card, index) => (
          <TouchableOpacity key={index} style={styles.card} onPress={card.onPress}>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDescription}>{card.description}</Text>
            <Text style={styles.cardAction}>{card.action} →</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f8ff', padding: 20 },
  welcomeTitle: { fontSize: 26, fontWeight: 'bold', color: '#4CAF50', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20, textAlign: 'center' },
  passwordBanner: { backgroundColor: '#fff3cd', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#ffeaa7' },
  passwordBannerText: { fontSize: 14, color: '#856404', marginBottom: 5 },
  passwordBannerAction: { fontSize: 14, color: '#16A34A', fontWeight: '600', textAlign: 'right' },
  cardsContainer: { flex: 1 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  cardDescription: { fontSize: 14, color: '#666', marginBottom: 12 },
  cardAction: { fontSize: 14, color: '#4CAF50', fontWeight: '600' },
});