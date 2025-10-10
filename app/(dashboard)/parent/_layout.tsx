// app/(dashboard)/parent/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { Dimensions, Image, PixelRatio, View } from "react-native";
import { useAuth } from "../../../context/AuthContext";

// ✅ Function to make font size responsive
const { width } = Dimensions.get("window");
const responsiveFont = (size: number) => {
  // scale font size based on screen width
  const scale = width / 375; // 375 is base iPhone X width
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export default function ParentLayout() {
  const { role, user } = useAuth();

  if (role !== "parent") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#0530ad",
        tabBarInactiveTintColor: "#9ca3af",

        headerStyle: {
          backgroundColor: "transparent",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTransparent: true,
        headerTintColor: "black",

        // ✅ Apply Poppins to header
        headerTitleStyle: {
          fontFamily: "Poppins-SemiBold",
          fontSize: responsiveFont(13),
        },

        // ✅ Profile picture on the left
        headerLeft: () => (
          <View style={{ marginLeft: 15 }}>
            <Image
              source={{
                uri: user?.profilePic || "https://via.placeholder.com/40",
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 20,
              }}
            />
          </View>
        ),

        // ✅ Responsive font size for tab labels
        tabBarLabelStyle: {
          fontFamily: "Poppins-SemiBold",
          fontSize: responsiveFont(8),
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: "Journal",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-insight"
        options={{
          title: "AI Insights",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
