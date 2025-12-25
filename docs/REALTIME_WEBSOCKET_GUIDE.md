# Kivelo Real-Time WebSocket Integration Guide

## Overview

The Kivelo backend uses **Socket.io** for real-time bidirectional communication between the server and clients. This enables features like live notifications, real-time analytics updates, and instant data synchronization across devices.

> **Note**: This app uses WebSocket-based real-time communication via Socket.io, not traditional HTTP webhooks. Webhooks are typically server-to-server callbacks, while Socket.io provides client-server real-time communication.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Socket.io Server Configuration](#socketio-server-configuration)
3. [Frontend Integration](#frontend-integration)
4. [Available Events](#available-events)
5. [Authentication with Sockets](#authentication-with-sockets)
6. [React Native / Expo Implementation](#react-native--expo-implementation)
7. [Event Reference](#event-reference)
8. [API Testing with Swagger](#api-testing-with-swagger)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## API Testing with Swagger

### Swagger Documentation URLs

| Environment | Swagger URL |
|-------------|-------------|
| **Local Development** | http://localhost:5000/api-docs |
| **Production** | https://family-wellness.onrender.com/api-docs |

### Testing Chat & Notifications Flow

The conversation/chat endpoints that trigger socket events are fully documented in Swagger. Here's how to test:

#### Step 1: Authenticate
1. Open Swagger at `/api-docs`
2. Use `POST /api/v1/auth/parent-login` or `POST /api/v1/auth/child-login-password`
3. Copy the `accessToken` from response
4. Click "Authorize" button (🔒) at top of Swagger
5. Enter: `Bearer <your_token>`

#### Step 2: Create/Get Conversation
- **For AI Chat (Child only)**: `GET /api/v1/conversations/ai`
- **For Family Chat**: `POST /api/v1/conversations/family` with:
  ```json
  {
    "participantIds": ["userId1", "userId2"],
    "type": "parent_child"
  }
  ```

#### Step 3: Send Message (Triggers Socket Events)
Use `POST /api/v1/conversations/message`:
```json
{
  "conversationId": "your_conversation_id",
  "content": "Hello! This is a test message",
  "type": "text"
}
```

**This will trigger:**
- `new_message` socket event to conversation room
- `notification` socket event to recipient's user room
- Database notification created

#### Available Conversation Endpoints in Swagger

| Method | Endpoint | Description | Socket Events |
|--------|----------|-------------|---------------|
| GET | `/api/v1/conversations/ai` | Get/create AI chat | None |
| POST | `/api/v1/conversations/ai/{id}/end` | End AI conversation | None |
| POST | `/api/v1/conversations/ai/response` | Add AI response | `ai_response` |
| GET | `/api/v1/conversations/family` | List family chats | None |
| POST | `/api/v1/conversations/family` | Create family chat | None |
| GET | `/api/v1/conversations/{id}` | Get chat history | None |
| POST | `/api/v1/conversations/message` | **Send message** | `new_message`, `notification` |
| POST | `/api/v1/conversations/{id}/read` | Mark as read | `message_read_receipt` (client-side) |
| PUT | `/api/v1/conversations/{id}/messages/{msgId}` | Edit message | None |
| DELETE | `/api/v1/conversations/{id}/messages/{msgId}` | Delete message | None |
| GET | `/api/v1/conversations/parent/flagged` | Get flagged chats | None |
| POST | `/api/v1/conversations/parent/review/{id}` | Review flagged | None |

### Testing Socket Events (Without Frontend)

To test socket events without a frontend, use a Socket.io testing tool:

#### Option 1: Socket.io Client (Browser Console)
```javascript
// Open browser console on your app or use https://piehost.com/socketio-tester

const socket = io('https://family-wellness.onrender.com', {
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  
  // Join user room for notifications
  socket.emit('join_user', 'your_user_id');
  
  // Join conversation room
  socket.emit('join_conversation', 'your_conversation_id');
});

// Listen for events
socket.on('new_message', (data) => console.log('New message:', data));
socket.on('notification', (data) => console.log('Notification:', data));
socket.on('ai_response', (data) => console.log('AI response:', data));
```

#### Option 2: Postman WebSocket
1. Create new WebSocket Request
2. URL: `wss://family-wellness.onrender.com/socket.io/?EIO=4&transport=websocket`
3. Connect and send events

#### Option 3: CLI Tool (wscat)
```bash
npm install -g wscat
wscat -c "wss://family-wellness.onrender.com/socket.io/?EIO=4&transport=websocket"
```

### Complete Test Flow

```
1. Login (Swagger) → Get token
                  ↓
2. Connect Socket → socket.emit('join_user', userId)
                  ↓
3. Get/Create Conversation (Swagger) → Get conversationId
                  ↓
4. Join Conversation → socket.emit('join_conversation', conversationId)
                  ↓
5. Send Message (Swagger POST /conversations/message)
                  ↓
6. Receive Events → socket.on('new_message') + socket.on('notification')
```

---

## Architecture Overview

```
┌─────────────────┐         WebSocket         ┌─────────────────┐
│                 │◄──────────────────────────►│                 │
│  React Native   │     Real-time Events      │  Node.js/Express│
│  Frontend       │                           │  Backend        │
│                 │     Socket.io Protocol    │                 │
└─────────────────┘                           └─────────────────┘
         ▲                                            │
         │                                            ▼
         │                                    ┌─────────────────┐
         │                                    │  MongoDB        │
         │                                    │  Database       │
         └────────────────────────────────────┴─────────────────┘
                        Data Changes Trigger Events
```

---

## Socket.io Server Configuration

### Backend Setup (Reference)

The Socket.io server is configured in `kivelo-backend/server.js`:

```javascript
// server.js - Backend configuration
import { createServer } from "http";
import { Server as IOServer } from "socket.io";
import { setIO } from "./utils/socket.js";

const httpServer = createServer(app);

const io = new IOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

// Store io instance globally for use in controllers
setIO(io);

// Handle connections
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});
```

### Socket Utility (Backend)

```javascript
// utils/socket.js
let ioInstance = null;

export const setIO = (io) => {
  ioInstance = io;
};

export const getIO = () => ioInstance;
```

---

## Frontend Integration

### Installation

For React Native/Expo projects:

```bash
npm install socket.io-client
# or
yarn add socket.io-client
```

### Basic Connection Setup

```typescript
// utils/socket.ts
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = __DEV__ 
  ? 'http://localhost:5000' 
  : 'https://family-wellness.onrender.com';

let socket: Socket | null = null;

export const initializeSocket = async (): Promise<Socket> => {
  if (socket?.connected) {
    return socket;
  }

  // Get auth token for authenticated connections
  const token = await AsyncStorage.getItem('kivelo_access_token');

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: {
      token: token || undefined
    }
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
```

---

## Available Events

### Server → Client Events (Emitted by Backend)

| Event Name | Description | Payload |
|------------|-------------|---------|
| `new_message` | New chat message in conversation | `{ conversationId, message, senderId, senderRole }` |
| `ai_response` | AI assistant response in AI chat | `{ conversationId, message }` |
| `notification` | New notification (chat, alerts, etc.) | `{ type, notification: { _id, title, message, data, createdAt } }` |
| `user_typing` | User typing indicator | `{ conversationId, userId, userName, isTyping }` |
| `message_read_receipt` | Message was read by user | `{ conversationId, userId, messageId, readAt }` |
| `analytics:update` | Real-time analytics data update | `{ route, method, clientType, statusCode, timestamp }` |

### Client → Server Events (Emitted by Frontend)

| Event Name | Description | Payload |
|------------|-------------|---------|
| `join_user` | Join user's personal room for notifications | `userId` (string) |
| `join_conversation` | Join a conversation room for messages | `conversationId` (string) |
| `leave_conversation` | Leave a conversation room | `conversationId` (string) |
| `typing_start` | User started typing | `{ conversationId, userId, userName }` |
| `typing_stop` | User stopped typing | `{ conversationId, userId }` |
| `message_read` | Mark message as read | `{ conversationId, userId, messageId }` |

### Connection Events

| Event Name | Direction | Description |
|------------|-----------|-------------|
| `connect` | Bidirectional | Socket connection established |
| `disconnect` | Bidirectional | Socket disconnected |

---

## Authentication with Sockets

### Sending Authentication

```typescript
// When connecting, pass the token
socket = io(SOCKET_URL, {
  auth: {
    token: accessToken
  }
});
```

### Joining Rooms After Connection

After connecting, the frontend must join the appropriate rooms to receive events:

```typescript
// Join user's personal room (do this immediately after connection)
socket.emit('join_user', userId);

// Join a specific conversation room when opening a chat
socket.emit('join_conversation', conversationId);

// Leave conversation room when closing chat
socket.emit('leave_conversation', conversationId);
```

### Backend Authentication Middleware (Suggested)

```javascript
// middleware/socketAuth.js
import jwt from 'jsonwebtoken';

export const socketAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
};

// Usage in server.js
io.use(socketAuthMiddleware);
```

---

## React Native / Expo Implementation

### Socket Context Provider

```typescript
// context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { initializeSocket, disconnectSocket, getSocket } from '../utils/socket';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, accessToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user && accessToken) {
      initializeSocket().then((newSocket) => {
        setSocket(newSocket);
        
        newSocket.on('connect', () => setIsConnected(true));
        newSocket.on('disconnect', () => setIsConnected(false));
      });
    }

    return () => {
      disconnectSocket();
      setIsConnected(false);
    };
  }, [user, accessToken]);

  const emit = (event: string, data?: any) => {
    socket?.emit(event, data);
  };

  const on = (event: string, callback: (data: any) => void) => {
    socket?.on(event, callback);
  };

  const off = (event: string, callback?: (data: any) => void) => {
    socket?.off(event, callback);
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, emit, on, off }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
```

### Using in Components

```typescript
// components/RealTimeNotifications.tsx
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useSocket } from '../context/SocketContext';

export const RealTimeNotifications: React.FC = () => {
  const { socket, isConnected, on, off } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data: any) => {
      console.log('New notification:', data);
      setNotifications(prev => [data, ...prev]);
    };

    on('notification:new', handleNewNotification);

    return () => {
      off('notification:new', handleNewNotification);
    };
  }, [socket, on, off]);

  return (
    <View>
      <Text>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</Text>
      {notifications.map((notif, index) => (
        <Text key={index}>{notif.message}</Text>
      ))}
    </View>
  );
};
```

### Analytics Dashboard Example

The current implementation uses sockets for real-time analytics updates:

```typescript
// Example: Listening to analytics updates
import { useSocket } from '../context/SocketContext';

const AnalyticsComponent: React.FC = () => {
  const { on, off } = useSocket();
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    const handleAnalyticsUpdate = (data: any) => {
      // data contains: { route, method, clientType, statusCode, timestamp }
      setAnalyticsData(data);
    };

    on('analytics:update', handleAnalyticsUpdate);

    return () => {
      off('analytics:update', handleAnalyticsUpdate);
    };
  }, [on, off]);

  return (
    <View>
      {analyticsData && (
        <Text>
          Last API Call: {analyticsData.method} {analyticsData.route} 
          - Status: {analyticsData.statusCode}
        </Text>
      )}
    </View>
  );
};
```

### Chat Implementation Example

Complete example for real-time chat with typing indicators:

```typescript
// ChatScreen.tsx - Real-time chat with Socket.io
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

interface Message {
  _id: string;
  content: string;
  sender: string;
  role: string;
  createdAt: string;
}

export const ChatScreen: React.FC<{ conversationId: string }> = ({ conversationId }) => {
  const { socket, emit, on, off } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!socket || !conversationId) return;

    // Join conversation room
    emit('join_conversation', conversationId);

    // Listen for new messages
    const handleNewMessage = (data: { conversationId: string; message: Message }) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    // Listen for AI responses
    const handleAIResponse = (data: { conversationId: string; message: Message }) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    // Listen for typing indicators
    const handleTyping = (data: { conversationId: string; userId: string; userName: string; isTyping: boolean }) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setTypingUsers(prev => {
          if (data.isTyping) {
            return prev.includes(data.userName) ? prev : [...prev, data.userName];
          } else {
            return prev.filter(name => name !== data.userName);
          }
        });
      }
    };

    // Listen for read receipts
    const handleReadReceipt = (data: { conversationId: string; userId: string; messageId: string }) => {
      if (data.conversationId === conversationId) {
        // Update message read status in UI
        console.log(`Message ${data.messageId} read by ${data.userId}`);
      }
    };

    on('new_message', handleNewMessage);
    on('ai_response', handleAIResponse);
    on('user_typing', handleTyping);
    on('message_read_receipt', handleReadReceipt);

    return () => {
      // Leave conversation room and cleanup
      emit('leave_conversation', conversationId);
      off('new_message', handleNewMessage);
      off('ai_response', handleAIResponse);
      off('user_typing', handleTyping);
      off('message_read_receipt', handleReadReceipt);
    };
  }, [socket, conversationId, user?.id]);

  // Handle typing indicator
  const handleTextChange = (text: string) => {
    setInputText(text);

    // Emit typing start
    emit('typing_start', {
      conversationId,
      userId: user?.id,
      userName: user?.name
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      emit('typing_stop', {
        conversationId,
        userId: user?.id
      });
    }, 2000);
  };

  // Send message via API (not socket - socket is for receiving only)
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    try {
      // Call your API to send the message
      // The backend will emit the socket event to all participants
      const response = await fetch(`${API_URL}/conversations/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId,
          content: inputText.trim(),
          type: 'text'
        })
      });

      if (response.ok) {
        setInputText('');
        // Stop typing indicator
        emit('typing_stop', { conversationId, userId: user?.id });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={{
            alignSelf: item.sender === user?.id ? 'flex-end' : 'flex-start',
            backgroundColor: item.sender === user?.id ? '#007AFF' : '#E5E5EA',
            padding: 10,
            margin: 5,
            borderRadius: 15,
            maxWidth: '70%'
          }}>
            <Text style={{ color: item.sender === user?.id ? '#FFF' : '#000' }}>
              {item.content}
            </Text>
          </View>
        )}
      />
      
      {typingUsers.length > 0 && (
        <Text style={{ padding: 10, fontStyle: 'italic', color: '#666' }}>
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </Text>
      )}

      <View style={{ flexDirection: 'row', padding: 10 }}>
        <TextInput
          value={inputText}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          style={{ flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 15 }}
        />
        <TouchableOpacity onPress={sendMessage} style={{ marginLeft: 10, padding: 10 }}>
          <Text>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

---

## Event Reference

### `analytics:update`

Emitted whenever an API request is made to the backend.

**Payload:**
```typescript
interface AnalyticsUpdate {
  route: string;        // API endpoint path
  method: string;       // HTTP method (GET, POST, etc.)
  clientType: string;   // Client identifier (mobile, web, etc.)
  statusCode: number;   // HTTP response status code
  timestamp: Date;      // When the request occurred
}
```

**Example Usage:**
```typescript
socket.on('analytics:update', (data: AnalyticsUpdate) => {
  console.log(`${data.method} ${data.route} - ${data.statusCode}`);
});
```

---

## Best Practices

### 1. Connection Management

```typescript
// Reconnect on app foreground
import { AppState } from 'react-native';

useEffect(() => {
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active' && !socket?.connected) {
      socket?.connect();
    }
  });

  return () => subscription.remove();
}, [socket]);
```

### 2. Error Handling

```typescript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
  // Implement retry logic or show user feedback
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

### 3. Room-Based Events (Suggested Implementation)

For family-specific events, use Socket.io rooms:

```typescript
// Join family room after authentication
socket.emit('join:family', { familyId: user.familyId });

// Listen for family-specific events
socket.on('family:mood_alert', (data) => {
  // Handle mood alerts for family
});
```

### 4. Typing Indicators (Chat Feature)

```typescript
// Emit typing status
socket.emit('chat:typing', { 
  conversationId, 
  isTyping: true 
});

// Listen for typing status
socket.on('chat:user_typing', ({ userId, isTyping }) => {
  // Update UI to show typing indicator
});
```

### 5. Offline Handling

```typescript
// Queue messages when offline
const sendMessage = (data: any) => {
  if (socket?.connected) {
    socket.emit('message', data);
  } else {
    // Store in queue for later
    messageQueue.push(data);
  }
};

// Send queued messages on reconnect
socket.on('connect', () => {
  while (messageQueue.length > 0) {
    socket.emit('message', messageQueue.shift());
  }
});
```

---

## Recent Updates (December 2024)

### Real-Time Notification Integration

The `NotificationContext` has been updated to include built-in Socket.io connection for real-time notifications. The frontend now automatically:

1. **Connects to WebSocket server** when user logs in
2. **Joins user room** (`user:{userId}`) to receive personal notifications
3. **Listens for `notification` events** and updates the notification bell in real-time
4. **Disconnects** when user logs out

#### NotificationContext Socket Integration

```typescript
// context/NotificationContext.tsx - Now includes socket connection
import { io, Socket } from "socket.io-client";

// Socket is auto-connected when user logs in
useEffect(() => {
  if (user && role) {
    const newSocket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      // Auto-join user room
      newSocket.emit("join_user", user._id);
    });

    // Listen for real-time notifications
    newSocket.on("notification", (data) => {
      // Add to notification list
      setNotifications(prev => [data.notification, ...prev]);
      // Update unread count
      setStats(prev => ({ ...prev, unread: prev.unread + 1 }));
    });
  }
}, [user, role]);
```

#### New Properties in NotificationContext

| Property | Type | Description |
|----------|------|-------------|
| `isSocketConnected` | `boolean` | Whether socket is currently connected |

### Chat Notification Navigation Fix

**Problem**: Clicking a chat notification from a child was navigating to the family group chat instead of the private chat.

**Solution**: Updated notification tap handler to detect chat type and navigate correctly:

```typescript
// app/(dashboard)/parent/notifications.tsx
case "new_message":
case "chat_message":
  if (data?.senderRole === 'child' || data?.chatType === 'parent_child') {
    // Navigate to private chat with child
    router.push({
      pathname: '/(dashboard)/parent/chat',
      params: {
        conversationId: data.conversationId,
        childName: data.senderName,
      }
    });
  } else {
    // Navigate to family group chat
    router.push('/(dashboard)/parent/family-chat');
  }
  break;
```

#### Parent Chat Screen Updates

The `chat.tsx` screen now accepts `conversationId` directly from notifications:

```typescript
// app/(dashboard)/parent/chat.tsx
const params = useLocalSearchParams();
const initialConversationId = params.conversationId as string;
const childId = params.childId as string;

useEffect(() => {
  if (initialConversationId) {
    // Load existing conversation directly
    loadChatFromConversationId(initialConversationId);
  } else if (childId) {
    // Create/get conversation with child
    initializeChat();
  }
}, [childId, initialConversationId]);
```

### Child Avatar Display Fix

**Problem**: Child avatars not showing in family group chat.

**Cause**: Avatar was accessed as `child.avatar?.url` but the correct path is `child.user?.avatar?.url`.

**Fix in `family-chat.tsx`**:

```typescript
// Before (incorrect)
avatar: child?.avatar?.url

// After (correct)
avatar: child?.user?.avatar?.url
```

Fixed in two locations:
- `getSenderInfo()` - For message bubble avatars
- `getFamilyMembers()` - For header member strip avatars

### Notification Data Structure

When a chat message triggers a notification, the following data is included:

```typescript
// Notification payload for chat messages
{
  type: 'new_message',
  notification: {
    _id: 'notification_id',
    title: 'New message from ChildName',
    message: 'Message preview...',
    data: {
      conversationId: 'conv_id',
      senderId: 'user_id',
      senderName: 'Child Name',
      senderRole: 'child',  // or 'parent'
      messagePreview: 'Full message text'
    },
    createdAt: '2024-12-25T...'
  }
}
```

### Backend Logging for Chat Notifications

The `sendChatNotification` helper now includes detailed logging:

```javascript
// controllers/conversationController.js
console.log(`[CHAT NOTIFICATION] Attempting to create notification:`, {
  senderId,
  recipientId,
  senderName,
  conversationId
});

console.log(`[CHAT NOTIFICATION] Created notification:`, {
  notificationId: notification._id,
  userId: notification.userId,
  type: notification.type,
  title: notification.title
});
```

### Frontend Socket.io Installation

The `socket.io-client` package was added to the frontend:

```json
// kivelo-frontend/package.json
{
  "dependencies": {
    "socket.io-client": "^4.8.1"
  }
}
```

**Important**: Run `npm install` after pulling these changes.

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Connection fails | CORS mismatch | Ensure `FRONTEND_ORIGIN` env variable includes your app's origin |
| Frequent disconnects | Network instability | Implement reconnection with backoff |
| Events not received | Not subscribed before emit | Subscribe to events before they're emitted |
| Auth errors | Invalid/expired token | Refresh token and reconnect |

### Debug Mode

```typescript
// Enable Socket.io debug logs
localStorage.setItem('debug', 'socket.io-client:socket');

// Or in React Native
import { Platform } from 'react-native';
if (__DEV__) {
  // @ts-ignore
  global.localStorage = {
    setItem: () => {},
    getItem: () => 'socket.io-client:socket'
  };
}
```

### Testing Connections

```typescript
// Test connection status
const testConnection = () => {
  if (socket?.connected) {
    console.log('✅ Socket connected, ID:', socket.id);
  } else {
    console.log('❌ Socket not connected');
    console.log('Socket state:', socket?.disconnected ? 'disconnected' : 'unknown');
  }
};
```

---

## Server URLs

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:5000` |
| Production | `https://family-wellness.onrender.com` |

---

## Future Enhancements

The following features are planned or suggested for future implementation:

1. **Real-time Chat** - Direct messaging between family members using Socket.io
2. **Mood Alerts** - Instant notifications when a child's mood score drops below threshold
3. **Activity Reminders** - Push notifications for upcoming activities
4. **Live Dashboard** - Real-time updates for parent dashboard
5. **Presence System** - Show online/offline status for family members

---

## Support

For questions or issues with WebSocket implementation:
- Check the [Socket.io documentation](https://socket.io/docs/v4/)
- Review backend logs for connection issues
- Ensure CORS settings match your client's origin

---

*Last Updated: December 25, 2024*
