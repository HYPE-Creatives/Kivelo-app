// app/(dashboard)/parent/family-chat.tsx - Family Group Chat Screen
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
  Image,
  Modal,
  Alert,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useConversation } from "../../../context/ConversationContext";
import { useParent } from "../../../context/ParentContext";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";

interface ChatMessage {
  _id: string;
  sender?: string;
  senderName?: string;
  role: string;
  content: string;
  createdAt: string;
  edited?: boolean;
  editedAt?: string;
}

export default function FamilyGroupChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { children, getChildren } = useParent();
  const { colors } = useTheme();
  const {
    createFamilyChat,
    getConversationHistory,
    sendFamilyMessage,
    editMessage,
    deleteMessage,
  } = useConversation();

  // Green theme for family chat
  const familyTheme = {
    primary: '#10B981',
    gradient: ['#10B981', '#059669'] as [string, string],
  };

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Edit/Delete state
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  
  const scrollRef = useRef<ScrollView | null>(null);
  const inputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await getChildren();
      await initializeFamilyChat();
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const initializeFamilyChat = async () => {
    try {
      // Get all child user IDs
      const childUserIds = children
        .map((child: any) => child.user?._id || child.user)
        .filter(Boolean);

      if (childUserIds.length === 0) {
        return;
      }

      // Create or get existing family group conversation
      const conversation = await createFamilyChat(childUserIds, 'family_chat');
      if (conversation) {
        setConversationId(conversation._id);
        // Load messages
        const history = await getConversationHistory(conversation._id);
        setMessages(history);
        scrollToEnd();
      }
    } catch (error) {
      console.error('Error initializing family chat:', error);
    }
  };

  // Re-initialize when children change
  useEffect(() => {
    if (children.length > 0 && !conversationId) {
      initializeFamilyChat();
    }
  }, [children]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (conversationId) {
      const history = await getConversationHistory(conversationId);
      setMessages(history);
    }
    setRefreshing(false);
  }, [conversationId]);

  const handleSendMessage = async () => {
    const text = message.trim();
    if (!text || isSending || !conversationId) return;

    Keyboard.dismiss();
    setMessage("");
    setIsSending(true);

    const newMessage = await sendFamilyMessage(conversationId, text);
    if (newMessage) {
      setMessages(prev => [...prev, newMessage]);
      scrollToEnd();
    }

    setIsSending(false);
  };

  const handleLongPress = (msg: ChatMessage) => {
    // Only allow actions on own messages (parent messages)
    const isMe = msg.role === 'parent' || msg.sender === user?._id;
    if (isMe) {
      setSelectedMessage(msg);
      setShowMessageOptions(true);
    }
  };

  const handleEdit = () => {
    if (selectedMessage) {
      setEditText(selectedMessage.content);
      setIsEditing(true);
      setShowMessageOptions(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedMessage || !conversationId || !editText.trim()) return;

    const updated = await editMessage(conversationId, selectedMessage._id, editText.trim());
    if (updated) {
      setMessages(prev => 
        prev.map(m => m._id === selectedMessage._id ? { ...m, content: editText.trim(), edited: true } : m)
      );
    }
    setIsEditing(false);
    setSelectedMessage(null);
    setEditText("");
  };

  const handleDelete = () => {
    setShowMessageOptions(false);
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (selectedMessage && conversationId) {
              const success = await deleteMessage(conversationId, selectedMessage._id);
              if (success) {
                setMessages(prev => prev.filter(m => m._id !== selectedMessage._id));
              }
            }
            setSelectedMessage(null);
          }
        }
      ]
    );
  };

  const scrollToEnd = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Group messages by date
  const getGroupedMessages = () => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';

    messages.forEach((msg) => {
      const msgDate = formatDate(msg.createdAt);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  const getSenderInfo = (msg: ChatMessage) => {
    if (msg.role === 'parent' || msg.sender === user?._id) {
      return { name: 'You', isMe: true, color: familyTheme.primary };
    }
    
    // Find child in children array
    const child = children.find((c: any) => 
      (c.user?._id || c.user) === msg.sender
    );
    
    return { 
      name: child?.name || msg.senderName || 'Family Member', 
      isMe: false,
      color: '#FF6B9D',
      avatar: child?.avatar?.url || null
    };
  };

  // Get all family members for the header strip
  const getFamilyMembers = () => {
    const members = [
      { id: user?._id, name: 'You', role: 'parent', avatar: user?.avatar?.url }
    ];
    
    children.forEach((child: any) => {
      members.push({
        id: child.user?._id || child.user,
        name: child.name,
        role: 'child',
        avatar: child.avatar?.url
      });
    });
    
    return members;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: familyTheme.primary }]} edges={['top']}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={familyTheme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <View style={styles.headerIconRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="people" size={20} color="white" />
                </View>
                <View>
                  <Text style={styles.headerName}>Family Group Chat</Text>
                  <Text style={styles.headerStatus}>Loading...</Text>
                </View>
              </View>
            </View>
            <View style={{ width: 40 }} />
          </LinearGradient>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={familyTheme.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading family chat...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: familyTheme.primary }]} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <LinearGradient
            colors={familyTheme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerInfo}>
              <View style={styles.headerIconRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="people" size={20} color="white" />
                </View>
                <View>
                  <Text style={styles.headerName}>Family Group Chat</Text>
                  <Text style={styles.headerStatus}>{children.length + 1} members</Text>
                </View>
              </View>
            </View>
            
            <View style={{ width: 40 }} />
          </LinearGradient>

          {/* Family Members Strip */}
          <View style={[styles.membersStrip, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.membersContent}>
              {getFamilyMembers().map((member: any, index: number) => (
                <View key={member.id || index} style={styles.memberItem}>
                  {member.avatar ? (
                    <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                  ) : (
                    <View style={[styles.memberAvatarPlaceholder, { 
                      backgroundColor: member.role === 'parent' ? familyTheme.primary + '20' : '#FF6B9D20' 
                    }]}>
                      <Ionicons 
                        name="person" 
                        size={14} 
                        color={member.role === 'parent' ? familyTheme.primary : '#FF6B9D'} 
                      />
                    </View>
                  )}
                  <Text style={[styles.memberName, { color: colors.textSecondary }]} numberOfLines={1}>
                    {member.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.messagesContainer}
            contentContainerStyle={[styles.messagesContent, { paddingBottom: 100 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {messages.length === 0 ? (
              <View style={styles.emptyChat}>
                <View style={[styles.emptyChatIcon, { backgroundColor: familyTheme.primary + '15' }]}>
                  <Ionicons name="chatbubbles-outline" size={48} color={familyTheme.primary} />
                </View>
                <Text style={[styles.emptyChatTitle, { color: colors.text }]}>
                  Start a family conversation
                </Text>
                <Text style={[styles.emptyChatText, { color: colors.textSecondary }]}>
                  Messages here are shared with the whole family. Keep it fun and supportive!
                </Text>
              </View>
            ) : (
              getGroupedMessages().map((group, groupIndex) => (
                <View key={`group-${groupIndex}`}>
                  {/* Date separator */}
                  <View style={styles.dateSeparator}>
                    <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
                    <Text style={[styles.dateText, { color: colors.textSecondary, backgroundColor: colors.background }]}>
                      {group.date}
                    </Text>
                    <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
                  </View>
                  
                  {/* Messages for this date */}
                  {group.messages.map((msg, msgIndex) => {
                    const senderInfo = getSenderInfo(msg);
                    return (
                      <Pressable
                        key={`msg-${msg._id || groupIndex}-${msgIndex}`}
                        onLongPress={() => handleLongPress(msg)}
                        delayLongPress={500}
                        style={[
                          styles.messageBubbleContainer,
                          senderInfo.isMe ? styles.myMessageContainer : styles.theirMessageContainer,
                        ]}
                      >
                        {!senderInfo.isMe && (
                          <View style={styles.messageAvatarContainer}>
                            {senderInfo.avatar ? (
                              <Image source={{ uri: senderInfo.avatar }} style={styles.messageAvatar} />
                            ) : (
                              <View style={[styles.messageAvatarPlaceholder, { backgroundColor: senderInfo.color + '20' }]}>
                                <Ionicons name="person" size={12} color={senderInfo.color} />
                              </View>
                            )}
                          </View>
                        )}
                        <View style={styles.messageColumn}>
                          {!senderInfo.isMe && (
                            <Text style={[styles.senderName, { color: senderInfo.color }]}>
                              {senderInfo.name}
                            </Text>
                          )}
                          <View
                            style={[
                              styles.messageBubble,
                              senderInfo.isMe
                                ? [styles.myBubble, { backgroundColor: familyTheme.primary }]
                                : [styles.theirBubble, { backgroundColor: colors.card }],
                            ]}
                          >
                            <Text
                              style={[
                                styles.messageText,
                                { color: senderInfo.isMe ? 'white' : colors.text },
                              ]}
                            >
                              {msg.content}
                            </Text>
                            <View style={styles.messageFooter}>
                              {msg.edited && (
                                <Text style={[styles.editedLabel, { color: senderInfo.isMe ? 'rgba(255,255,255,0.6)' : colors.textSecondary }]}>
                                  edited
                                </Text>
                              )}
                              <Text
                                style={[
                                  styles.messageTime,
                                  { color: senderInfo.isMe ? 'rgba(255,255,255,0.7)' : colors.textSecondary },
                                ]}
                              >
                                {formatTime(msg.createdAt)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ))
            )}
          </ScrollView>

          {/* Input */}
          <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
                placeholder="Message your family..."
                placeholderTextColor={colors.textSecondary}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={1000}
                returnKeyType="send"
                onSubmitEditing={handleSendMessage}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!message.trim() || isSending) && styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={!message.trim() || isSending}
              >
                <LinearGradient
                  colors={message.trim() && !isSending ? familyTheme.gradient : ['#D1D5DB', '#D1D5DB']}
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
        </View>
      </KeyboardAvoidingView>

      {/* Message Options Modal */}
      <Modal
        visible={showMessageOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMessageOptions(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowMessageOptions(false)}
        >
          <View style={[styles.optionsModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.optionsTitle, { color: colors.text }]}>Message Options</Text>
            
            <TouchableOpacity 
              style={[styles.optionButton, { borderBottomColor: colors.border }]} 
              onPress={handleEdit}
            >
              <Ionicons name="pencil" size={20} color={familyTheme.primary} />
              <Text style={[styles.optionText, { color: colors.text }]}>Edit Message</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionButton} 
              onPress={handleDelete}
            >
              <Ionicons name="trash" size={20} color="#EF4444" />
              <Text style={[styles.optionText, { color: '#EF4444' }]}>Delete Message</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.cancelButton, { backgroundColor: colors.border }]} 
              onPress={() => setShowMessageOptions(false)}
            >
              <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={isEditing}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditing(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.editModalContainer}
        >
          <View style={[styles.editModal, { backgroundColor: colors.card }]}>
            <View style={styles.editHeader}>
              <Text style={[styles.editTitle, { color: colors.text }]}>Edit Message</Text>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[
                styles.editInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={editText}
              onChangeText={setEditText}
              multiline
              maxLength={1000}
              autoFocus
            />
            
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={[styles.editCancelButton, { borderColor: colors.border }]} 
                onPress={() => setIsEditing(false)}
              >
                <Text style={[styles.editCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.editSaveButton, { backgroundColor: familyTheme.primary }]} 
                onPress={handleSaveEdit}
                disabled={!editText.trim()}
              >
                <Text style={styles.editSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
  headerStatus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
  },
  membersStrip: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  membersContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  memberItem: {
    alignItems: 'center',
    width: 50,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  memberAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyChatIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyChatTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyChatText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 12,
  },
  messageBubbleContainer: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  theirMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatarContainer: {
    marginRight: 8,
    marginBottom: 2,
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  messageAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageColumn: {
    maxWidth: '75%',
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    marginLeft: 4,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myBubble: {
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 4,
  },
  editedLabel: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  messageTime: {
    fontSize: 10,
    textAlign: 'right',
  },
  inputWrapper: {
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 80 : 70,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsModal: {
    width: '80%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Edit Modal Styles
  editModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  editModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  editCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  editCancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  editSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  editSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
