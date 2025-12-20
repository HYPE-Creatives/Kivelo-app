// app/(dashboard)/child/chat.tsx - Redesigned Chat & Connect Hub
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useConversation } from "../../../context/ConversationContext";
import { useAuth } from "../../../context/AuthContext";
import { useMood } from "../../../context/MoodContext";

interface FamilyContact {
  id: string;  // Conversation ID
  participantId?: string;  // Other user's ID
  name: string;
  type: 'parent' | 'sibling';
  icon: string;
  color: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
}

interface TodayMoodData {
  moodScore?: number;
  emoji?: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getTodayMood } = useMood();
  const { 
    familyConversations, 
    familyLoading, 
    getFamilyChats,
    aiConversation,
    getOrCreateAIChat,
  } = useConversation();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'all' | 'family' | 'ai'>('all');
  const [todayMoodData, setTodayMoodData] = useState<TodayMoodData | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Load data on mount
  useEffect(() => {
    loadData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadData = async () => {
    const [_, __, moodResult] = await Promise.all([
      getFamilyChats(), 
      getOrCreateAIChat(),
      getTodayMood()
    ]);
    if (moodResult?.success && moodResult.data) {
      setTodayMoodData(moodResult.data);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const moodResult = await getTodayMood();
    if (moodResult?.success && moodResult.data) {
      setTodayMoodData(moodResult.data);
    }
    await loadData();
    setRefreshing(false);
  };

  // Transform family conversations into contacts (with deduplication and filter self)
  const seenIds = new Set<string>();
  const familyContacts: FamilyContact[] = familyConversations
    .filter((conv) => {
      // Deduplicate by conversation ID
      if (seenIds.has(conv._id)) return false;
      seenIds.add(conv._id);
      // Filter out conversations where the "other" participant is the current user (self)
      const otherParticipant = conv.participants?.find(
        (p) => p.user._id !== user?._id
      );
      // If no other participant or the other participant is also the current user, skip
      if (!otherParticipant || otherParticipant.user._id === user?._id) return false;
      return true;
    })
    .map((conv) => {
    const otherParticipant = conv.participants?.find(
      (p) => p.user._id !== user?._id
    );
    const isParent = otherParticipant?.role === 'parent';
    const name = otherParticipant?.user?.name || 'Family Member';
    const participantUserId = otherParticipant?.user._id || '';
    
    return {
      id: conv._id,  // This is the conversation ID
      participantId: participantUserId,  // This is the other user's ID
      name,
      type: isParent ? 'parent' : 'sibling',
      icon: isParent 
        ? (name.toLowerCase().includes('mom') ? 'heart' : 'shield')
        : 'people',
      color: isParent
        ? (name.toLowerCase().includes('mom') ? '#FF6B9D' : '#2196F3')
        : '#9C27B0',
      lastMessage: conv.lastMessage?.content || 'Tap to start chatting!',
      lastMessageTime: conv.lastMessage?.createdAt 
        ? formatTimeAgo(conv.lastMessage.createdAt)
        : undefined,
      unreadCount: conv.unreadCount || 0,
      isOnline: false,
    };
  });

  // Add placeholder parents if no conversations exist
  const displayContacts: FamilyContact[] = familyContacts.length > 0 
    ? familyContacts 
    : [
        {
          id: 'placeholder-mom',
          name: 'Mom',
          type: 'parent',
          icon: 'heart',
          color: '#FF6B9D',
          lastMessage: 'Ask your parent to connect! 💕',
        },
        {
          id: 'placeholder-dad',
          name: 'Dad',
          type: 'parent',
          icon: 'shield',
          color: '#2196F3',
          lastMessage: 'Family chat coming soon! 💪',
        },
      ];

  const handleOpenAIChat = () => {
    router.push("/(dashboard)/child/ai-helper");
  };

  const handleOpenFamilyChat = (contact: FamilyContact) => {
    if (contact.id.startsWith('placeholder')) {
      // Show info for placeholder contacts
      return;
    }
    router.push({
      pathname: "/(dashboard)/child/family-chat",
      params: {
        conversationId: contact.id,  // Pass the existing conversation ID
        participantId: contact.participantId || '',  // Pass the other user's ID
        contactName: contact.name,
        contactType: contact.type,
      }
    });
  };

  // Get mood-based greeting
  const getMoodGreeting = () => {
    if (!todayMoodData?.moodScore) {
      return { text: "How are you today? 😊", subtext: "Chat with your AI friend or family!" };
    }
    const score = todayMoodData.moodScore;
    if (score >= 8) {
      return { text: "You're feeling great! 🌟", subtext: "Share your happiness with family!" };
    } else if (score >= 6) {
      return { text: "Having a good day! 😊", subtext: "Stay connected with loved ones!" };
    } else if (score >= 4) {
      return { text: "It's okay to feel meh 💙", subtext: "Talk to someone who cares!" };
    } else {
      return { text: "We're here for you 💜", subtext: "Chat with AI Friend or family anytime!" };
    }
  };

  const greeting = getMoodGreeting();

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#667EEA", "#764BA2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>💬 Chat & Connect</Text>
          <Text style={styles.subtitle}>{greeting.text}</Text>
          <Text style={styles.headerHint}>{greeting.subtext}</Text>
        </View>
      </LinearGradient>

      {/* Filter Pills */}
      <View style={styles.filterContainer}>
        {(['all', 'ai', 'family'] as const).map((section) => (
          <TouchableOpacity
            key={section}
            style={[
              styles.filterPill,
              selectedSection === section && styles.filterPillActive
            ]}
            onPress={() => setSelectedSection(section)}
          >
            <Ionicons
              name={
                section === 'all' ? 'apps' :
                section === 'ai' ? 'sparkles' : 'people'
              }
              size={16}
              color={selectedSection === section ? 'white' : '#6B7280'}
            />
            <Text style={[
              styles.filterText,
              selectedSection === section && styles.filterTextActive
            ]}>
              {section === 'all' ? 'All' : section === 'ai' ? 'AI Friend' : 'Family'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.ScrollView
        style={[styles.content, { opacity: fadeAnim }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#667EEA']}
            tintColor="#667EEA"
          />
        }
      >
        {/* AI Friend Card - Always show unless filtered out */}
        {(selectedSection === 'all' || selectedSection === 'ai') && (
          <>
            <Text style={styles.sectionTitle}>🤖 Your AI Friend</Text>
            <TouchableOpacity
              style={styles.aiCard}
              onPress={handleOpenAIChat}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#667EEA", "#764BA2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.aiCardGradient}
              >
                <View style={styles.aiCardContent}>
                  <View style={styles.aiAvatar}>
                    <Ionicons name="sparkles" size={28} color="#667EEA" />
                  </View>
                  <View style={styles.aiInfo}>
                    <View style={styles.aiHeader}>
                      <Text style={styles.aiName}>AI Friend</Text>
                      <View style={styles.onlineBadge}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlineText}>Always Online</Text>
                      </View>
                    </View>
                    <Text style={styles.aiDescription}>
                      Your 24/7 buddy for chatting, homework help, or when you need someone to listen! 💜
                    </Text>
                  </View>
                </View>

                {/* Quick Action Buttons */}
                <View style={styles.quickActions}>
                  <TouchableOpacity style={styles.quickAction} onPress={handleOpenAIChat}>
                    <Ionicons name="happy-outline" size={18} color="white" />
                    <Text style={styles.quickActionText}>Mood</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAction} onPress={handleOpenAIChat}>
                    <Ionicons name="book-outline" size={18} color="white" />
                    <Text style={styles.quickActionText}>Help</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAction} onPress={handleOpenAIChat}>
                    <Ionicons name="chatbubble-outline" size={18} color="white" />
                    <Text style={styles.quickActionText}>Chat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickAction} onPress={handleOpenAIChat}>
                    <Ionicons name="bulb-outline" size={18} color="white" />
                    <Text style={styles.quickActionText}>Ideas</Text>
                  </TouchableOpacity>
                </View>

                {/* Start Chat Button */}
                <TouchableOpacity style={styles.startChatBtn} onPress={handleOpenAIChat}>
                  <Ionicons name="chatbubble" size={18} color="#667EEA" />
                  <Text style={styles.startChatText}>Start Chatting</Text>
                  <Ionicons name="arrow-forward" size={18} color="#667EEA" />
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* Family Section */}
        {(selectedSection === 'all' || selectedSection === 'family') && (
          <>
            <Text style={styles.sectionTitle}>👨‍👩‍👧‍👦 Family Members</Text>
            
            {familyLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667EEA" />
                <Text style={styles.loadingText}>Finding your family...</Text>
              </View>
            ) : (
              <View style={styles.contactsList}>
                {displayContacts.map((contact) => (
                  <TouchableOpacity
                    key={contact.id}
                    style={styles.contactCard}
                    onPress={() => handleOpenFamilyChat(contact)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.contactAvatar, { backgroundColor: contact.color + '15' }]}>
                      <Ionicons name={contact.icon as any} size={24} color={contact.color} />
                      {contact.isOnline && <View style={styles.contactOnline} />}
                    </View>
                    
                    <View style={styles.contactInfo}>
                      <View style={styles.contactHeader}>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        {contact.lastMessageTime && (
                          <Text style={styles.contactTime}>{contact.lastMessageTime}</Text>
                        )}
                      </View>
                      <Text style={styles.contactMessage} numberOfLines={1}>
                        {contact.lastMessage}
                      </Text>
                    </View>

                    {contact.unreadCount ? (
                      <View style={[styles.unreadBadge, { backgroundColor: contact.color }]}>
                        <Text style={styles.unreadText}>{contact.unreadCount}</Text>
                      </View>
                    ) : (
                      <View style={styles.arrowContainer}>
                        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Add Family Info Card */}
            {familyContacts.length === 0 && (
              <View style={styles.infoCard}>
                <LinearGradient
                  colors={["#FEF3C7", "#FDE68A"]}
                  style={styles.infoGradient}
                >
                  <Ionicons name="information-circle" size={24} color="#D97706" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>Connect with Family!</Text>
                    <Text style={styles.infoText}>
                      Ask your parent to set up family chat so you can message each other safely! 💕
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            )}
          </>
        )}

        {/* Safety Card */}
        <View style={styles.safetyCard}>
          <LinearGradient
            colors={["#DCFCE7", "#BBF7D0"]}
            style={styles.safetyGradient}
          >
            <Ionicons name="shield-checkmark" size={24} color="#16A34A" />
            <View style={styles.safetyContent}>
              <Text style={styles.safetyTitle}>Safe & Secure 🔒</Text>
              <Text style={styles.safetyText}>
                All your chats are private and monitored by your parents to keep you safe!
              </Text>
            </View>
          </LinearGradient>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Header
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {},
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
  },
  headerHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Filter Pills
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterPillActive: {
    backgroundColor: '#667EEA',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: 'white',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
    marginBottom: 12,
  },

  // AI Card
  aiCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  aiCardGradient: {
    padding: 18,
  },
  aiCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  aiAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  aiInfo: {
    flex: 1,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  aiName: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  aiDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 19,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 10,
    borderRadius: 12,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
    marginTop: 4,
  },

  // Start Chat Button
  startChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  startChatText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#667EEA',
  },

  // Contact Cards
  contactsList: {
    gap: 10,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
  },
  contactOnline: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: 'white',
  },
  contactInfo: {
    flex: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  contactTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  contactMessage: {
    fontSize: 14,
    color: '#6B7280',
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },

  // Info Card
  infoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 16,
  },
  infoGradient: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D97706',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#B45309',
    lineHeight: 18,
  },

  // Safety Card
  safetyCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
  },
  safetyGradient: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  safetyContent: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 4,
  },
  safetyText: {
    fontSize: 13,
    color: '#15803d',
    lineHeight: 18,
  },
});
