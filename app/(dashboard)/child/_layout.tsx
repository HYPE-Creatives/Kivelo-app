// app/(dashboard)/child/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

// ✅ scaling helpers
const baseWidth = 375;   // iPhone X width
const baseHeight = 812;  // iPhone X height
const scaleW = (size: number) => (width / baseWidth) * size;
const scaleH = (size: number) => (height / baseHeight) * size;

export default function ChildLayout() {
  const { role, user } = useAuth();

  if (role !== "child") {
    return <Redirect href="/(auth)/login" />;
  }

  const renderTabButton = (
    iconName: keyof typeof Ionicons.glyphMap,
    label: string,
    focused: boolean
  ) => {
    if (focused) {
      return (
        <LinearGradient
          colors={["rgba(34,139,34,1)", "rgba(50,205,50,1)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tabButtonActive}
        >
          <Ionicons
            name={iconName}
            style={[styles.icon, { color: "white" }]}
          />
          <Text style={[styles.label, { color: "white" }]}>{label}</Text>
        </LinearGradient>
      );
    }

    return (
      <View style={styles.tabButton}>
        <Ionicons
          name={iconName}
          style={[styles.icon, { color: "#9ca3af" }]}
        />
        <Text style={[styles.label, { color: "#9ca3af" }]}>{label}</Text>
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarShowLabel: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: "white" }], // ✅ keep tab bar white

        headerStyle: styles.header,
        headerTransparent: true,
        headerTintColor: "black",
        headerTitleStyle: styles.headerTitle,

        headerLeft: () => (
          <View style={{ marginLeft: scaleW(15) }}>
            <Image
              source={{
                uri: user?.profilePic || "https://via.placeholder.com/40",
              }}
              style={styles.profilePic}
            />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => renderTabButton("home", "Home", focused),
        }}
      />

      <Tabs.Screen
        name="check-in"
        options={{
          title: "Journal",
          tabBarIcon: ({ focused }) =>
            renderTabButton("book", "Journal", focused),
        }}
      />

      <Tabs.Screen
        name="ai-helper"
        options={{
          title: "AI Helper",
          tabBarIcon: ({ focused }) =>
            renderTabButton("sparkles", "Uma", focused),
        }}
      />

      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ focused }) =>
            renderTabButton("chatbubbles", "Chats", focused),
        }}
      />

      <Tabs.Screen
        name="games"
        options={{
          title: "Games",
          headerShown: false,
          tabBarIcon: ({ focused }) =>
            renderTabButton("game-controller", "Games", focused),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: scaleH(55), // ✅ responsive bottom spacing
    marginHorizontal: scaleW(40),
    borderRadius: scaleW(50),
    height: scaleH(55),
    width: "80%",
    paddingTop: scaleH(14),
    paddingHorizontal: scaleW(5),
    borderTopWidth: 0,
    backgroundColor: "white",

    // ✅ thin border
    borderWidth: 0.5,
    borderColor: "#e5e7eb",

    // ✅ subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    backgroundColor: "transparent",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: scaleW(14),
  },
  profilePic: {
    width: scaleW(28),
    height: scaleW(28),
    borderRadius: scaleW(20),
  },
  tabButton: {
    borderRadius: scaleW(50),
    width: scaleW(55),
    height: scaleW(55),
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    borderRadius: scaleW(50),
    width: scaleW(55),
    height: scaleW(55),
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: scaleW(20),
    marginBottom: scaleH(2),
  },
  label: {
    fontFamily: "Poppins-SemiBold",
    fontSize: scaleW(7),
  },
});
