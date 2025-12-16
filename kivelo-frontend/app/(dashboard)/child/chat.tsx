// app/(dashboard)/child/chat.tsx
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChatScreen() {
  const [selectedTab, setSelectedTab] = useState<'ai' | 'family'>('ai');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const chatContacts = [
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
      gradient: ['#FF6B9D', '#FF8A65'] as [string, string],
      message: "I'm feeling a bit down today"
    },
    {
      icon: 'book-outline',
      title: 'Homework Help',
      description: 'Get help with school work',
      gradient: ['#667EEA', '#764BA2'] as [string, string],
      message: "Can you help me with my homework?"
    },
    {
      icon: 'chatbubble-ellipses-outline',
      title: 'Just Chat',
      description: 'Have a friendly conversation',
      gradient: ['#10B981', '#34D399'] as [string, string],
      message: "Hi! Can we just chat for a bit?"
    },
    {
      icon: 'bulb-outline',
      title: 'Ask Questions',
      description: 'Learn something new',
      gradient: ['#F59E0B', '#FCD34D'] as [string, string],
      message: "I have a question about something"
    },
  ];

  const handleOpenAIHelper = () => {
    router.push("/(dashboard)/child/ai-helper");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#667EEA", "#764BA2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.title}>Chat & Connect</Text>
        <Text style={styles.subtitle}>Stay in touch safely 💬</Text>
      </LinearGradient>

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
            AI Friend
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

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'ai' && (
          <>
            {/* Main AI Chat Card */}
            <TouchableOpacity 
              style={styles.mainAICard}
              onPress={handleOpenAIHelper}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#667EEA", "#764BA2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mainAIGradient}
              >
                <View style={styles.mainAIContent}>
                  <View style={styles.mainAIAvatar}>
                    <Ionicons name="sparkles" size={32} color="#667EEA" />
                  </View>
                  <View style={styles.mainAIInfo}>
                    <View style={styles.mainAIHeader}>
                      <Text style={styles.mainAIName}>AI Friend</Text>
                      <View style={styles.onlineDot} />
                    </View>
                    <Text style={styles.mainAIDesc}>
                      Your 24/7 friend - always here to chat, help, and listen! 💜
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
                </View>
                <View style={styles.startChatButton}>
                  <Ionicons name="chatbubble" size={16} color="#667EEA" />
                  <Text style={styles.startChatText}>Start Chatting</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* AI Features grid */}
            <Text style={styles.sectionTitle}>✨ What can I help you with?</Text>
            <View style={styles.featuresGrid}>
              {aiFeatures.map((feature, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.featureCard}
                  onPress={handleOpenAIHelper}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={feature.gradient}
                    style={styles.featureIcon}
                  >
                    <Ionicons name={feature.icon as any} size={24} color="white" />
                  </LinearGradient>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* AI Info card */}
            <View style={styles.infoCard}>
              <LinearGradient
                colors={["#E0E7FF", "#EDE9FE"]}
                style={styles.infoGradient}
              >
                <View style={styles.infoIconContainer}>
                  <Ionicons name="shield-checkmark" size={24} color="#667EEA" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Safe & Private</Text>
                  <Text style={styles.infoText}>
                    All your chats are private and secure. I'm here to help, not judge! 💚
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </>
        )}

        {selectedTab === 'family' && (
          <>
            <Text style={styles.sectionTitle}>👨‍👩‍👧‍👦 Your Family</Text>
            {chatContacts.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                </View>
                <Text style={styles.emptyText}>No family members yet</Text>
                <Text style={styles.emptySubtext}>
                  Ask your parent to add family members to the app
                </Text>
              </View>
            ) : (
              chatContacts.map(contact => (
                <TouchableOpacity
                  key={contact.id}
                  style={styles.contactCard}
                  onPress={() => console.log('Open chat with', contact.name)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.contactAvatar, { backgroundColor: contact.color + '15' }]}>
                    <Ionicons name={contact.icon as any} size={26} color={contact.color} />
                    {contact.online && <View style={styles.onlineBadge} />}
                  </View>
                  <View style={styles.contactInfo}>
                    <View style={styles.contactHeader}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      {contact.online && (
                        <View style={[styles.onlineIndicator, { backgroundColor: '#DCFCE7' }]}>
                          <Text style={styles.onlineText}>Online</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.contactMessage} numberOfLines={1}>
                      {contact.lastMessage}
                    </Text>
                  </View>
                  <View style={styles.contactArrow}>
                    <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                  </View>
                </TouchableOpacity>
              ))
            )}

            {/* Coming Soon Banner */}
            <View style={styles.comingSoonCard}>
              <LinearGradient
                colors={["#FEF3C7", "#FDE68A"]}
                style={styles.comingSoonGradient}
              >
                <Ionicons name="construct-outline" size={24} color="#D97706" />
                <View style={styles.comingSoonContent}>
                  <Text style={styles.comingSoonTitle}>Family Chat Coming Soon!</Text>
                  <Text style={styles.comingSoonText}>
                    Soon you'll be able to chat with your family members here
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F3F4F6' 
  },
  header: { 
    paddingTop: 12,
    paddingBottom: 16, 
    paddingHorizontal: 20,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: 'white', 
    marginBottom: 4 
  },
  subtitle: { 
    fontSize: 14, 
    color: 'rgba(255,255,255,0.85)' 
  },
  tabContainer: { 
    flexDirection: 'row', 
    padding: 16, 
    paddingBottom: 8,
    gap: 10 
  },
  tab: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 12, 
    backgroundColor: 'white', 
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabActive: { 
    backgroundColor: '#667EEA' 
  },
  tabText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#666' 
  },
  tabTextActive: { 
    color: 'white' 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 16 
  },
  sectionTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#374151', 
    marginBottom: 14, 
    marginTop: 8 
  },
  
  // Main AI Card
  mainAICard: {
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  mainAIGradient: {
    padding: 16,
  },
  mainAIContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainAIAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mainAIInfo: {
    flex: 1,
  },
  mainAIHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  mainAIName: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginRight: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  mainAIDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  startChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 14,
    gap: 6,
  },
  startChatText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667EEA',
  },

  // Feature Cards
  featuresGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12, 
    marginBottom: 20 
  },
  featureCard: { 
    width: '47%', 
    backgroundColor: 'white', 
    padding: 14, 
    borderRadius: 14, 
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  featureIcon: { 
    width: 50, 
    height: 50, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  featureTitle: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#374151', 
    marginBottom: 4, 
    textAlign: 'center' 
  },
  featureDescription: { 
    fontSize: 11, 
    color: '#6B7280', 
    textAlign: 'center', 
    lineHeight: 15 
  },

  // Info Card
  infoCard: { 
    borderRadius: 14, 
    overflow: 'hidden',
    marginBottom: 20,
  },
  infoGradient: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: { 
    flex: 1 
  },
  infoTitle: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#4338CA', 
    marginBottom: 2 
  },
  infoText: { 
    fontSize: 13, 
    color: '#6366F1', 
    lineHeight: 18 
  },

  // Contact Cards
  contactCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    padding: 14, 
    borderRadius: 14, 
    marginBottom: 10, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 3, 
    elevation: 2 
  },
  contactAvatar: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12, 
    position: 'relative' 
  },
  onlineBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    width: 14, 
    height: 14, 
    borderRadius: 7, 
    backgroundColor: '#22C55E', 
    borderWidth: 2, 
    borderColor: 'white' 
  },
  contactInfo: { 
    flex: 1 
  },
  contactHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 4 
  },
  contactName: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#1F2937', 
    marginRight: 8 
  },
  onlineIndicator: { 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 10 
  },
  onlineText: { 
    fontSize: 10, 
    fontWeight: '600', 
    color: '#16A34A' 
  },
  contactMessage: { 
    fontSize: 13, 
    color: '#6B7280' 
  },
  contactArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 40 
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: { 
    fontSize: 17, 
    fontWeight: '600', 
    color: '#6B7280', 
    marginBottom: 6 
  },
  emptySubtext: { 
    fontSize: 14, 
    color: '#9CA3AF', 
    textAlign: 'center', 
    paddingHorizontal: 32,
    lineHeight: 20,
  },

  // Coming Soon
  comingSoonCard: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
  },
  comingSoonGradient: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  comingSoonContent: {
    flex: 1,
  },
  comingSoonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
    marginBottom: 2,
  },
  comingSoonText: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
  },
});
