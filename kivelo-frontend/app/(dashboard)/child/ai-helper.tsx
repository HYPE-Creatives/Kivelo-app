// app/(dashboard)/child/ai-helper.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
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
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useMood } from "../../../context/MoodContext";
import { useAI } from "../../../context/AIContext";
import { useAuth } from "../../../context/AuthContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp: number;
}

const quickActions = [
  { label: "😊 Feeling great!", message: "I'm feeling really happy today!", icon: "sunny", gradient: ["#FCD34D", "#F59E0B"] as [string, string] },
  { label: "😢 Feeling sad", message: "I'm feeling a bit sad today", icon: "sad", gradient: ["#60A5FA", "#3B82F6"] as [string, string] },
  { label: "📚 Homework help", message: "Can you help me with my homework?", icon: "school", gradient: ["#A78BFA", "#8B5CF6"] as [string, string] },
  { label: "😄 Tell a joke", message: "Tell me a funny joke!", icon: "happy", gradient: ["#F472B6", "#EC4899"] as [string, string] },
  { label: "🎮 Play a game", message: "I want to play a game with you!", icon: "game-controller", gradient: ["#34D399", "#10B981"] as [string, string] },
  { label: "💭 Just chat", message: "Hi! Can we just chat for a bit?", icon: "chatbubbles", gradient: ["#22D3EE", "#06B6D4"] as [string, string] },
];

const AI_TIPS = [
  "💡 Tip: I can help with math, science, and reading!",
  "💡 Tip: Tell me about your day - I'm a great listener!",
  "💡 Tip: Ask me for jokes when you need a laugh!",
  "💡 Tip: I can play word games and riddles with you!",
];

export default function AIHelper() {
  const { getTodayMood } = useMood();
  const { sendMessage: sendAIMessage, getChatHistory } = useAI();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [currentTip, setCurrentTip] = useState(AI_TIPS[0]);
  const [showQuickActions, setShowQuickActions] = useState(true);
  
  const scrollRef = useRef<ScrollView | null>(null);
  const inputRef = useRef<TextInput | null>(null);

  // User-specific storage key
  const CHAT_STORAGE_KEY = `kivelo_ai_chat_history_${user?._id || 'guest'}`;

  // Load chat history from local storage on mount
  useEffect(() => {
    loadChatHistory();
    // Rotate tips every 10 seconds
    const tipInterval = setInterval(() => {
      setCurrentTip(AI_TIPS[Math.floor(Math.random() * AI_TIPS.length)]);
    }, 10000);
    return () => clearInterval(tipInterval);
  }, []);

  // Hide quick actions once conversation starts
  useEffect(() => {
    if (conversation.length > 2) {
      setShowQuickActions(false);
    }
  }, [conversation]);

  const loadChatHistory = async () => {
    try {
      // First try to load from local storage
      const localHistory = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      if (localHistory) {
        const parsed = JSON.parse(localHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversation(parsed);
          setShowQuickActions(parsed.length <= 2);
          return;
        }
      }

      // If no local history, try to get from server
      try {
        const serverHistory = await getChatHistory();
        if (serverHistory && serverHistory.length > 0) {
          const formatted: ChatMessage[] = serverHistory.map((msg, idx) => ({
            id: `server-${idx}-${Date.now()}`,
            role: msg.role as "user" | "ai",
            text: msg.text,
            timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
          }));
          setConversation(formatted);
          await saveChatHistory(formatted);
          return;
        }
      } catch (error) {
        console.log("Server history unavailable, starting fresh");
        setIsOnline(false);
      }

      // If no history anywhere, create welcome message
      const mood = await getTodayMood().catch(() => null);
      const greeting = getMoodBasedGreeting(mood?.moodScore, user?.name);
      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        role: "ai",
        text: greeting,
        timestamp: Date.now(),
      };
      setConversation([welcomeMessage]);
      await saveChatHistory([welcomeMessage]);
    } catch (err) {
      console.error("Error loading chat history:", err);
      const fallbackMessage: ChatMessage = {
        id: `fallback-${Date.now()}`,
        role: "ai",
        text: `Hi${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! 👋 I'm your AI friend. How can I help you today?`,
        timestamp: Date.now(),
      };
      setConversation([fallbackMessage]);
    }
  };

  const saveChatHistory = async (messages: ChatMessage[]) => {
    try {
      // Keep only last 100 messages to prevent storage bloat
      const toSave = messages.slice(-100);
      await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  };

  const getMoodBasedGreeting = (moodScore?: number, name?: string) => {
    const firstName = name ? ` ${name.split(' ')[0]}` : '';
    if (moodScore === undefined || moodScore === null) {
      return `Hi${firstName}! 👋 I'm your AI friend. How are you feeling today?`;
    }
    if (moodScore >= 8) return `Hey${firstName}! 🌟 You seem to be having a great day! What made it so awesome?`;
    if (moodScore >= 6) return `Hi${firstName}! 😊 Looks like a good day! Want to chat or need help with something?`;
    if (moodScore >= 4) return `Hey${firstName} 💙 I'm here to listen if you'd like to talk about anything.`;
    return `Hi${firstName} 💜 I'm here for you. Would you like to tell me how you're feeling?`;
  };

  const handleSendMessage = async () => {
    const text = message.trim();
    if (!text || isSending) return;

    Keyboard.dismiss();
    setMessage("");
    setShowQuickActions(false);

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
      timestamp: Date.now(),
    };
    const updatedConversation = [...conversation, userMessage];
    setConversation(updatedConversation);
    await saveChatHistory(updatedConversation);
    
    setIsSending(true);
    scrollToEnd();

    try {
      const reply = await sendAIMessage(text);
      setIsOnline(true);
      
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "ai",
        text: reply,
        timestamp: Date.now(),
      };
      const finalConversation = [...updatedConversation, aiMessage];
      setConversation(finalConversation);
      await saveChatHistory(finalConversation);
      scrollToEnd();
    } catch (err) {
      console.log("AI response error, using fallback");
      setIsOnline(false);
      
      // Friendly fallback
      const fallbackReplies = [
        "Hmm, let me think about that! 🤔 What else would you like to chat about?",
        "That's interesting! Tell me more! 😊",
        "I'm here to listen! What's on your mind? 💜",
        "Thanks for sharing! How does that make you feel? 🌟",
      ];
      const randomReply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
      
      const aiMessage: ChatMessage = {
        id: `ai-fallback-${Date.now()}`,
        role: "ai",
        text: randomReply,
        timestamp: Date.now(),
      };
      const finalConversation = [...updatedConversation, aiMessage];
      setConversation(finalConversation);
      await saveChatHistory(finalConversation);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickAction = (actionMessage: string) => {
    setMessage(actionMessage);
    inputRef.current?.focus();
  };

  const scrollToEnd = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  };

  const clearChat = async () => {
    const welcomeMessage: ChatMessage = {
      id: `welcome-${Date.now()}`,
      role: "ai",
      text: `Hi${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! 👋 Let's start fresh! What would you like to talk about?`,
      timestamp: Date.now(),
    };
    setConversation([welcomeMessage]);
    setShowQuickActions(true);
    await saveChatHistory([welcomeMessage]);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <LinearGradient
        colors={["#667EEA", "#764BA2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={["#A78BFA", "#8B5CF6"]}
              style={styles.avatar}
            >
              <Ionicons name="sparkles" size={24} color="white" />
            </LinearGradient>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? "#22C55E" : "#F59E0B" }]} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>AI Friend</Text>
            <Text style={styles.headerSubtitle}>
              {isOnline ? "Online • Ready to chat!" : "Offline mode • Still here for you!"}
            </Text>
          </View>
          <TouchableOpacity style={styles.menuButton} onPress={clearChat}>
            <Ionicons name="refresh" size={22} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Tip Banner */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.tipBanner}>
          <Text style={styles.tipText}>{currentTip}</Text>
        </Animated.View>
      </LinearGradient>

      {/* Chat Area */}
      <ScrollView 
        ref={scrollRef} 
        style={styles.chatArea} 
        contentContainerStyle={[styles.chatContent, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {conversation.map((msg, index) => (
          <Animated.View 
            key={msg.id} 
            entering={FadeInUp.delay(index * 50).duration(300)}
            style={[
              styles.messageContainer,
              msg.role === "user" ? styles.userMessageContainer : styles.aiMessageContainer
            ]}
          >
            {msg.role === "ai" && (
              <View style={styles.aiAvatarSmall}>
                <Ionicons name="sparkles" size={14} color="#8B5CF6" />
              </View>
            )}
            <View style={[
              styles.messageBubble,
              msg.role === "user" ? styles.userBubble : styles.aiBubble
            ]}>
              <Text style={[
                styles.messageText,
                msg.role === "user" ? styles.userText : styles.aiText
              ]}>
                {msg.text}
              </Text>
              <Text style={[
                styles.messageTime,
                msg.role === "user" ? styles.userTime : styles.aiTime
              ]}>
                {formatTime(msg.timestamp)}
              </Text>
            </View>
          </Animated.View>
        ))}

        {/* Typing Indicator */}
        {isSending && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.typingContainer}>
            <View style={styles.aiAvatarSmall}>
              <Ionicons name="sparkles" size={14} color="#8B5CF6" />
            </View>
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
            </View>
          </Animated.View>
        )}

        {/* Quick Actions */}
        {showQuickActions && conversation.length <= 2 && !isSending && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.quickActionsSection}>
            <Text style={styles.quickActionsTitle}>✨ Quick Start</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.quickActionCard}
                  onPress={() => handleQuickAction(action.message)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={action.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quickActionGradient}
                  >
                    <Ionicons name={action.icon as any} size={20} color="white" />
                  </LinearGradient>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message..."
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            multiline
            maxLength={500}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!message.trim() || isSending) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!message.trim() || isSending}
          >
            <LinearGradient
              colors={message.trim() && !isSending ? ["#667EEA", "#764BA2"] : ["#D1D5DB", "#D1D5DB"]}
              style={styles.sendButtonGradient}
            >
              {isSending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Ionicons name="send" size={18} color="white" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#667EEA",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  tipBanner: {
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tipText: {
    fontSize: 12,
    color: "white",
    textAlign: "center",
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  aiMessageContainer: {
    justifyContent: "flex-start",
  },
  aiAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: "#667EEA",
    borderBottomRightRadius: 4,
    marginLeft: "auto",
  },
  aiBubble: {
    backgroundColor: "white",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: "white",
  },
  aiText: {
    color: "#1F2937",
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  userTime: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "right",
  },
  aiTime: {
    color: "#9CA3AF",
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  typingBubble: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  typingDots: {
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#9CA3AF",
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.8,
  },
  quickActionsSection: {
    marginTop: 16,
  },
  quickActionsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 12,
    textAlign: "center",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  quickActionCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionGradient: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  quickActionLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  inputContainer: {
    backgroundColor: "white",
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 16,
    fontSize: 15,
    maxHeight: 100,
    color: "#1F2937",
  },
  sendButton: {
    marginBottom: 2,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});