// app/(dashboard)/child/family-chat.tsx - Child's Direct Chat with Family Members
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useConversation } from "../../../context/ConversationContext";
import { useAuth } from "../../../context/AuthContext";

interface ChatMessage {
  _id: string;
  sender?: string;
  role: string;
  content: string;
  createdAt: string;
  edited?: boolean;
  editedAt?: string;
}

export default function FamilyChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const {
    createFamilyChat,
    getConversationHistory,
    sendFamilyMessage,
    markConversationRead,
  } = useConversation();

  // Get contact info from params
  const existingConversationId = params.conversationId as string;  // Existing conversation ID
  const participantId = params.participantId as string;  // Other user's ID (for creating new)
  const contactName = params.contactName as string || 'Family Member';
  const contactType = params.contactType as string || 'parent';

  const [conversationId, setConversationId] = useState<string | null>(existingConversationId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const scrollRef = useRef<ScrollView | null>(null);
  const inputRef = useRef<TextInput | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Initialize conversation
  useEffect(() => {
    if (existingConversationId || participantId) {
      initializeChat();
    } else {
      router.back();
    }
  }, [existingConversationId, participantId]);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const initializeChat = async () => {
    setLoading(true);
    try {
      let chatConversationId = existingConversationId;
      
      // If we have an existing conversation ID, use it directly
      if (chatConversationId) {
        setConversationId(chatConversationId);
        // Fetch messages for existing conversation
        const history = await getConversationHistory(chatConversationId);
        setMessages(history);
        await markConversationRead(chatConversationId);
      } else if (participantId) {
        // Only create new conversation if we don't have an existing one
        const chatType = contactType === 'parent' ? 'parent_child' : 'sibling';
        const conversation = await createFamilyChat([participantId], chatType);
        
        if (conversation) {
          chatConversationId = conversation._id;
          setConversationId(chatConversationId);
          const history = await getConversationHistory(chatConversationId);
          setMessages(history);
          await markConversationRead(chatConversationId);
        }
      }
      
      scrollToEnd();
      setTimeout(() => inputRef.current?.focus(), 500);
    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert(
        "Oops! 😕",
        "Couldn't load the chat. Please try again!",
        [{ text: "OK", onPress: () => router.back() }]
      );
    }
    setLoading(false);
  };

  const scrollToEnd = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleRefresh = async () => {
    if (!conversationId) return;
    setRefreshing(true);
    try {
      const history = await getConversationHistory(conversationId);
      setMessages(history);
    } catch (error) {
      console.error('Error refreshing:', error);
    }
    setRefreshing(false);
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !conversationId || isSending) return;

    setIsSending(true);
    Keyboard.dismiss();

    try {
      const sentMessage = await sendFamilyMessage(conversationId, trimmedMessage);
      if (sentMessage) {
        setMessages(prev => [...prev, sentMessage]);
        setMessage("");
        scrollToEnd();
      }
    } catch (error: any) {
      Alert.alert("Oops!", "Message didn't send. Try again! 😊");
    }
    setIsSending(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
           ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (msg: ChatMessage) => {
    return msg.sender === user?._id || msg.role === 'child';
  };

  const getContactIcon = () => {
    switch (contactType) {
      case 'parent':
        return contactName.toLowerCase().includes('mom') ? 'heart' : 'shield';
      case 'sibling':
        return 'people';
      default:
        return 'person';
    }
  };

  const getContactColor = () => {
    switch (contactType) {
      case 'parent':
        return contactName.toLowerCase().includes('mom') ? '#FF6B9D' : '#2196F3';
      case 'sibling':
        return '#9C27B0';
      default:
        return '#16A34A';
    }
  };

  // Loading State
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <LinearGradient
          colors={[getContactColor(), adjustColor(getContactColor(), -30)]}
          style={styles.loadingHeader}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.loadingTitle}>Loading chat...</Text>
        </LinearGradient>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={getContactColor()} />
          <Text style={styles.loadingText}>Getting ready to chat with {contactName}! 💬</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <LinearGradient
        colors={[getContactColor(), adjustColor(getContactColor(), -30)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name={getContactIcon() as any} size={24} color="white" />
            </View>
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.contactName}>{contactName}</Text>
            <Text style={styles.contactStatus}>
              {contactType === 'parent' ? '❤️ Family' : '👋 Sibling'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.infoButton}>
          <Ionicons name="information-circle-outline" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <Animated.View style={[styles.messagesContainer, { opacity: fadeAnim }]}>
          <ScrollView
            ref={scrollRef}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[getContactColor()]}
                tintColor={getContactColor()}
              />
            }
          >
            {/* Welcome Message */}
            {messages.length === 0 && (
              <View style={styles.emptyChat}>
                <View style={[styles.emptyIcon, { backgroundColor: getContactColor() + '15' }]}>
                  <Ionicons name="chatbubbles" size={48} color={getContactColor()} />
                </View>
                <Text style={styles.emptyTitle}>Start the conversation! 🎉</Text>
                <Text style={styles.emptyText}>
                  Say hi to {contactName}! They're waiting to hear from you.
                </Text>
              </View>
            )}

            {/* Messages */}
            {messages.map((msg, index) => {
              const isMine = isMyMessage(msg);
              const showAvatar = !isMine && (
                index === 0 || 
                messages[index - 1]?.sender !== msg.sender
              );

              return (
                <View
                  key={msg._id}
                  style={[
                    styles.messageRow,
                    isMine ? styles.messageRowMine : styles.messageRowTheirs,
                  ]}
                >
                  {!isMine && showAvatar && (
                    <View style={[styles.messageAvatar, { backgroundColor: getContactColor() + '20' }]}>
                      <Ionicons name={getContactIcon() as any} size={16} color={getContactColor()} />
                    </View>
                  )}
                  {!isMine && !showAvatar && <View style={styles.avatarPlaceholder} />}
                  
                  <View
                    style={[
                      styles.messageBubble,
                      isMine ? styles.messageBubbleMine : styles.messageBubbleTheirs,
                    ]}
                  >
                    <Text style={[styles.messageText, isMine && styles.messageTextMine]}>
                      {msg.content}
                    </Text>
                    <Text style={[styles.messageTime, isMine && styles.messageTimeMine]}>
                      {formatTime(msg.createdAt)}
                      {msg.edited && " (edited)"}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.emojiButton}>
              <Ionicons name="happy-outline" size={24} color="#9CA3AF" />
            </TouchableOpacity>
            
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={`Message ${contactName}...`}
              placeholderTextColor="#9CA3AF"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />

            {message.trim() ? (
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: getContactColor() }]}
                onPress={handleSend}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Ionicons name="send" size={20} color="white" />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.micButton}>
                <Ionicons name="mic-outline" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Helper to darken/lighten colors
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 12,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: 'white',
  },
  headerText: {
    marginLeft: 12,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  contactStatus: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Messages
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },

  // Empty State
  emptyChat: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Message Bubbles
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowTheirs: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 36,
    height: 28,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageBubbleMine: {
    backgroundColor: '#16A34A',
    borderBottomRightRadius: 6,
  },
  messageBubbleTheirs: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 21,
  },
  messageTextMine: {
    color: 'white',
  },
  messageTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  messageTimeMine: {
    color: 'rgba(255,255,255,0.7)',
  },

  // Input Area
  inputContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  emojiButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
