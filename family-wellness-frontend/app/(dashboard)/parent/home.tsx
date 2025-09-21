// app/(dashboard)/parent/home.tsx
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useAuth } from "../../../context/AuthContext";

export default function ParentHome() {
  const { user } = useAuth();

  const dashboardCards = [
    {
      title: "👨‍👩‍👧‍👦 My Children",
      description: "View and manage your children's accounts",
      action: "View Children",
      onPress: () => console.log("Navigate to children management")
    },
    {
      title: "🎯 Progress Tracking",
      description: "Monitor your children's progress and activities",
      action: "View Progress",
      onPress: () => console.log("Navigate to progress tracking")
    },
    {
      title: "⚙️ Account Settings",
      description: "Update your profile and preferences",
      action: "Settings",
      onPress: () => console.log("Navigate to settings")
    },
    {
      title: "📊 Reports",
      description: "View detailed reports and analytics",
      action: "View Reports",
      onPress: () => console.log("Navigate to reports")
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeTitle}>
        Welcome back, {user?.name || "Parent"}! 👋
      </Text>
      <Text style={styles.subtitle}>
        Here's what's happening with your family
      </Text>

      <ScrollView style={styles.cardsContainer}>
        {dashboardCards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={card.onPress}
          >
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
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#16A34A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  cardsContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  cardAction: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '600',
  },
});