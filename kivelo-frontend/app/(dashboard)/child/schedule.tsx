// app/(dashboard)/child/schedule.tsx
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ScheduleScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="calendar-outline" size={80} color="#4CAF50" />
        <Text style={styles.title}>My Schedule</Text>
        <Text style={styles.subtitle}>
          Coming Soon!
        </Text>
        <Text style={styles.description}>
          Soon you will be able to view your daily activities, events, and reminders all in one place.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f8ff', justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { alignItems: 'center', maxWidth: 300 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginTop: 24, marginBottom: 12 },
  subtitle: { fontSize: 20, fontWeight: '600', color: '#4CAF50', marginBottom: 16 },
  description: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 },
});
