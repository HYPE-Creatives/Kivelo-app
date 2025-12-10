import React, { useEffect, useRef, useState } from "react";
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
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMood } from "../../../context/MoodContext";
import { useAI } from "../../../context/AIContext";

const quickActions = [
  { label: "I am feeling sad", message: "I am feeling sad", icon: "sad", color: "#F97316" },
  { label: "Need help with homework", message: "I need help with my homework", icon: "school", color: "#3B82F6" },
  { label: "Tell me a joke", message: "Tell me a joke", icon: "happy", color: "#F59E0B" },
  { label: "Want to play", message: "I want to play a game", icon: "game-controller", color: "#10B981" },
];

export default function AIHelper() {
  const { getTodayMood } = useMood();
  const { sendMessage: sendAIMessage, getChatHistory } = useAI();

  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const mood = await getTodayMood();
        const history = await getChatHistory();
        if (history && history.length) setConversation(history as any);
        else {
          const greeting = getMoodBasedGreeting(mood?.moodScore);
          setConversation([{ role: "ai", text: greeting }]);
        }
      } catch (err) {
          console.error("AIHelper load error", err);
          setConversation([{ role: "ai", text: "Hi! I am your AI friend — how can I help today?" }]);
        }
    };
    load();

    const showSub = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", (e: any) => {
      setKeyboardHeight(e.endCoordinates?.height || 250);
    });
    const hideSub = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [getChatHistory, getTodayMood]);

  const getMoodBasedGreeting = (moodScore?: number) => {
    if (moodScore === undefined || moodScore === null) return "Hi there! I am your AI friend. How are you feeling today?";
    if (moodScore >= 8) return "You seem great today! Want to share what made your day?";
    if (moodScore >= 6) return "Nice — sounds like a good day. Want to chat or need help?";
    if (moodScore >= 4) return "I am here to listen if you'd like to talk about anything.";
    return "I am here for you. Would you like to tell me more about how you feel?";
  };

  const handleSendMessage = async () => {
    const text = message.trim();
    if (!text || isSending) return;
    setMessage("");
    setConversation((c) => [...c, { role: "user", text }]);
    setIsSending(true);
    scrollToEnd();
    try {
      const reply = await sendAIMessage(text);
      setConversation((c) => [...c, { role: "ai", text: reply }]);
      scrollToEnd();
    } catch (err) {
      console.log("AI response using fallback");
      // Friendly fallback - should rarely happen since AIContext handles errors
      const fallbackReplies = [
        "Hmm, let me think about that! 🤔 What else would you like to chat about?",
        "That's interesting! Tell me more! 😊",
        "I'm here to listen! What's on your mind? 💜",
      ];
      const randomReply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
      setConversation((c) => [...c, { role: "ai", text: randomReply }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickAction = (actionMessage: string) => {
    setMessage(actionMessage);
  };

  const scrollToEnd = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <View style={styles.avatar}><Ionicons name="sparkles" size={28} color="white" /></View>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>AI Friend</Text>
              <Text style={styles.subtitle}>I am here to chat, help with homework, or listen.</Text>
            </View>
          </View>

          <ScrollView ref={scrollRef} style={styles.scroller} contentContainerStyle={[styles.content, { paddingBottom: keyboardHeight + 20 }]} keyboardShouldPersistTaps="handled">
            {conversation.map((m, i) => (
              <View key={i} style={[styles.bubble, m.role === "user" ? styles.userBubble : styles.aiBubble]}>
                <Text style={m.role === "user" ? styles.userText : styles.aiText}>{m.text}</Text>
              </View>
            ))}
            {isSending && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.loadingText}>AI is thinking...</Text>
              </View>
            )}

            {conversation.length <= 1 && !isSending && (
              <View style={styles.quickActionsContainer}>
                <Text style={styles.quickActionsTitle}>Quick actions:</Text>
                <View style={styles.quickActionsGrid}>
                  {quickActions.map((action, idx) => (
                    <TouchableOpacity key={idx} style={[styles.quickActionButton, { borderColor: action.color }]} onPress={() => handleQuickAction(action.message)}>
                      <Ionicons name={action.icon as any} size={20} color={action.color} />
                      <Text style={styles.quickActionLabel}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput value={message} onChangeText={setMessage} placeholder="Type your message..." style={styles.input} multiline maxLength={500} />
            <TouchableOpacity style={[styles.send, (!message.trim() || isSending) && styles.sendDisabled]} onPress={handleSendMessage} disabled={!message.trim() || isSending}>
              {isSending ? <ActivityIndicator color="white" /> : <Ionicons name="send" size={20} color="white" />}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f8ff" },
  inner: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#eee" },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#4CAF50", justifyContent: "center", alignItems: "center", marginRight: 12 },
  headerInfo: { flex: 1 },
  title: { fontSize: 16, fontWeight: "700", color: "#1f2937" },
  subtitle: { fontSize: 12, color: "#6b7280" },
  scroller: { flex: 1 },
  content: { padding: 12 },
  bubble: { marginBottom: 10, padding: 12, borderRadius: 12, maxWidth: "85%" },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#4CAF50" },
  aiBubble: { alignSelf: "flex-start", backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee" },
  userText: { color: "#fff" },
  aiText: { color: "#111" },
  loadingRow: { flexDirection: "row", alignItems: "center", padding: 8 },
  loadingText: { marginLeft: 8, color: "#666" },
  quickActionsContainer: { marginTop: 12 },
  quickActionsTitle: { fontSize: 14, fontWeight: "600", color: "#666", marginBottom: 8 },
  quickActionsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  quickActionButton: { width: "48%", flexDirection: "row", alignItems: "center", backgroundColor: "white", padding: 10, borderRadius: 10, borderWidth: 1 },
  quickActionLabel: { fontSize: 13, fontWeight: "600", color: "#333", marginLeft: 8 },
  inputRow: { flexDirection: "row", padding: 10, backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#eee", alignItems: "flex-end" },
  input: { flex: 1, backgroundColor: "#f5f5f5", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, maxHeight: 120 },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#4CAF50", justifyContent: "center", alignItems: "center", marginLeft: 8 },
  sendDisabled: { backgroundColor: "#cbd5e1" },
});