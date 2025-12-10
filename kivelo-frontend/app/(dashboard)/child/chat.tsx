// app/(dashboard)/child/chat.tsx
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function ChatScreen() {
  const [selectedTab, setSelectedTab] = useState<'ai' | 'family'>('ai');

  const chatContacts = [
    {
      id: '1',
      name: 'AI Friend',
      type: 'ai',
      icon: 'sparkles',
      lastMessage: "Hi! I am here to help you anytime 💚",
      online: true,
      color: '#4CAF50'
    },
    {
      id: '2',
      name: 'Mom',
      type: 'parent',
      icon: 'heart',
      lastMessage: "How was school today?",
      online: true,
      color: '#FF6B9D'
    },
    {
      id: '3',
      name: 'Dad',
      type: 'parent',
      icon: 'shield',
      lastMessage: "Great job on your homework!",
      online: false,
      color: '#2196F3'
    },
    {
      id: '4',
      name: 'Sister Emma',
      type: 'sibling',
      icon: 'people',
      lastMessage: "Want to play a game?",
      online: true,
      color: '#9C27B0'
    },
  ];

  const aiFeatures = [
    {
      icon: 'happy-outline',
      title: 'Mood Support',
      description: 'Talk about your feelings',
      color: '#FF6B9D',
      onPress: () => console.log('Mood support')
    },
    {
      icon: 'book-outline',
      title: 'Homework Help',
      description: 'Get help with school work',
      color: '#2196F3',
      onPress: () => console.log('Homework help')
    },
    {
      icon: 'chatbubble-ellipses-outline',
      title: 'Just Chat',
      description: 'Have a friendly conversation',
      color: '#4CAF50',
      onPress: () => console.log('Just chat')
    },
    {
      icon: 'bulb-outline',
      title: 'Ask Questions',
      description: 'Learn something new',
      color: '#FF9800',
      onPress: () => console.log('Ask questions')
    },
  ];

  const filteredContacts = selectedTab === 'ai' 
    ? chatContacts.filter(c => c.type === 'ai')
    : chatContacts.filter(c => c.type !== 'ai');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chat & Connect</Text>
        <Text style={styles.subtitle}>Stay in touch safely</Text>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'ai' && styles.tabActive]}
          onPress={() => setSelectedTab('ai')}
        >
          <Ionicons 
            name="sparkles" 
            size={20} 
            color={selectedTab === 'ai' ? 'white' : '#666'} 
          />
          <Text style={[styles.tabText, selectedTab === 'ai' && styles.tabTextActive]}>
            AI Helper
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'family' && styles.tabActive]}
          onPress={() => setSelectedTab('family')}
        >
          <Ionicons 
            name="people" 
            size={20} 
            color={selectedTab === 'family' ? 'white' : '#666'} 
          />
          <Text style={[styles.tabText, selectedTab === 'family' && styles.tabTextActive]}>
            Family
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {selectedTab === 'ai' && (
          <>
            {/* AI Features grid */}
            <Text style={styles.sectionTitle}>What can I help you with?</Text>
            <View style={styles.featuresGrid}>
              {aiFeatures.map((feature, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.featureCard, { borderColor: feature.color }]}
                  onPress={feature.onPress}
                >
                  <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                    <Ionicons name={feature.icon as any} size={28} color={feature.color} />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* AI Info card */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color="#4CAF50" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Your AI Friend</Text>
                <Text style={styles.infoText}>
                  I am here 24/7 to listen, help with homework, answer questions, and give you advice when you need it. All our chats are safe and private! 💚
                </Text>
              </View>
            </View>
          </>
        )}

        {selectedTab === 'family' && (
          <>
            <Text style={styles.sectionTitle}>Your Family</Text>
            {filteredContacts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No family members yet</Text>
                <Text style={styles.emptySubtext}>
                  Ask your parent to add family members to the app
                </Text>
              </View>
            ) : (
              filteredContacts.map(contact => (
                <TouchableOpacity
                  key={contact.id}
                  style={styles.contactCard}
                  onPress={() => console.log('Open chat with', contact.name)}
                >
                  <View style={[styles.contactAvatar, { backgroundColor: contact.color + '20' }]}>
                    <Ionicons name={contact.icon as any} size={28} color={contact.color} />
                    {contact.online && <View style={styles.onlineBadge} />}
                  </View>
                  <View style={styles.contactInfo}>
                    <View style={styles.contactHeader}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      {contact.online && (
                        <View style={styles.onlineIndicator}>
                          <Text style={styles.onlineText}>Online</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.contactMessage} numberOfLines={1}>
                      {contact.lastMessage}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f8ff' },
  header: { backgroundColor: 'white', padding: 20, paddingBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666' },
  tabContainer: { flexDirection: 'row', padding: 16, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#e0e0e0', gap: 8 },
  tabActive: { backgroundColor: '#4CAF50' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  tabTextActive: { color: 'white' },
  content: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16, marginTop: 8 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  featureCard: { width: '48%', backgroundColor: 'white', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  featureIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  featureTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4, textAlign: 'center' },
  featureDescription: { fontSize: 11, color: '#666', textAlign: 'center', lineHeight: 16 },
  infoCard: { flexDirection: 'row', backgroundColor: '#E8F5E9', padding: 16, borderRadius: 12, marginBottom: 20, gap: 12 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 16, fontWeight: '600', color: '#2E7D32', marginBottom: 4 },
  infoText: { fontSize: 13, color: '#1B5E20', lineHeight: 18 },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  contactAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 12, position: 'relative' },
  onlineBadge: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: 'white' },
  contactInfo: { flex: 1 },
  contactHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  contactName: { fontSize: 16, fontWeight: '600', color: '#333', marginRight: 8 },
  onlineIndicator: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  onlineText: { fontSize: 10, fontWeight: '600', color: '#4CAF50' },
  contactMessage: { fontSize: 13, color: '#666' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#999', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#ccc', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});

