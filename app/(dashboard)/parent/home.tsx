// HomeScreen.tsx
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";

const { width } = Dimensions.get("window");

const offerCarousel = [
  {
    id: "1",
    title: "Engaged Connection",
    subtitle: "Playful check-ins and challenges keep the bond strong.",
    color: "#FFECA8",
    icon: "people-circle-outline",
  },
  {
    id: "2",
    title: "Track Emotions",
    subtitle: "Help your child express how they feel daily.",
    color: "#D9E7F4",
    icon: "heart-circle-outline",
  },
  {
    id: "3",
    title: "Positive Parenting",
    subtitle: "Learn how to support without judgment.",
    color: "#F4D9E7",
    icon: "happy-outline",
  },
];

const HomeScreen = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<any>>(null);

 

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.ceil(event.nativeEvent.contentOffset.x / width);
    if (slide !== activeIndex) setActiveIndex(slide);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.helloText}>Hello, Jane</Text>
            <Text style={styles.welcomeText}>Welcome Back Today!</Text>
          </View>
          <Ionicons name="notifications-outline" size={26} color="#333" />
        </View>

        {/* Static Welcome Section */}
        <View style={styles.welcomeCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeTitle}>Welcome to Kivelo</Text>
            <Text style={styles.welcomeSubtitle}>
              Your trusted space to support and understand your child.
            </Text>
            <TouchableOpacity style={styles.learnMoreBtn}>
              <Text style={styles.learnMoreText}>Learn more</Text>
            </TouchableOpacity>
          </View>
          <Image
            source={require("../../../assets/images/onboarding2.png")}
            style={styles.welcomeImage}
          />
        </View>

        {/* What The App Offers */}
        <Text style={styles.sectionTitle}>What The App Offers</Text>
        <Text style={styles.sectionSubtitle}>
          Focus on what the app offers:
        </Text>

        {/* Carousel */}
        <FlatList
          ref={flatListRef}
          data={offerCarousel}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          renderItem={({ item }) => (
            <View
              style={[styles.offerCard, { backgroundColor: item.color }]}
            >
              <Ionicons
                name={item.icon as any}
                size={42}
                color="#333"
                style={styles.offerIcon}
              />
              <Text style={styles.offerTitle}>{item.title}</Text>
              <Text style={styles.offerSubtitle}>{item.subtitle}</Text>
            </View>
          )}
        />

        {/* Dots */}
        <View style={styles.dotsContainer}>
          {offerCarousel.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === activeIndex ? "#6C63FF" : "#ccc" },
              ]}
            />
          ))}
        </View>

        {/* Tip of The Day */}
        <Text style={styles.sectionTitle}>Tip of The Day</Text>
        <Text style={styles.sectionSubtitle}>
          Track, Understand & Support your child, emotionally and otherwise.
        </Text>

        <View style={styles.tipCardContainer}>
          <View style={[styles.tipCard, { backgroundColor: "#E4D2FF" }]}>
            <Ionicons name="bulb-outline" size={22} color="#4B2EFF" />
            <Text style={styles.tipText}>
              Children open up more when they feel safe from judgment.
            </Text>
          </View>

          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={22} color="#4B2EFF" />
            <Text style={styles.tipText}>
              Ask them ‘how did you feel’ instead of “what did you do”.
            </Text>
          </View>

          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={22} color="#4B2EFF" />
            <Text style={styles.tipText}>
              Always check insights about your child — daily updates are
              available.
            </Text>
          </View>

          <TouchableOpacity style={styles.learnMoreBlock}>
            <Text style={styles.learnMoreTextGray}>Learn More</Text>
          </TouchableOpacity>
        </View>

        {/* Go to Dashboard */}
        <Text style={styles.dashboardTitle}>Go to Dashboard</Text>
        <Text style={styles.sectionSubtitle}>
          See your child's well-being updates, track, understand & support your
          child, emotionally and otherwise.
        </Text>

        <TouchableOpacity style={styles.dashboardButton}>
          <Text style={styles.dashboardButtonText}>Go to dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  helloText: {
    fontFamily: "Poppins-Bold",
    fontSize: 20,
    color: "#333",
  },
  welcomeText: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: "#666",
  },
  welcomeCard: {
    backgroundColor: "#F4D9E7",
    borderRadius: 16,
    flexDirection: "row",
    padding: 15,
    marginVertical: 20,
  },
  welcomeTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#333",
  },
  welcomeSubtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: "#444",
    marginVertical: 4,
  },
  learnMoreBtn: {
    backgroundColor: "#fff",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  learnMoreText: {
    fontFamily: "Poppins-SemiBold",
    color: "#333",
  },
  welcomeImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    resizeMode: "cover",
    marginLeft: 8,
  },
  sectionTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#2B5CFF",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
  },
  offerCard: {
    width: width - 80,
    borderRadius: 14,
    padding: 16,
    marginRight: 15,
  },
  offerIcon: {
    marginBottom: 10,
  },
  offerTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: "#333",
  },
  offerSubtitle: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: "#333",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  tipCardContainer: {
    marginBottom: 25,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F3F3",
    padding: 12,
    borderRadius: 10,
    marginVertical: 5,
    gap: 10,
  },
  tipText: {
    fontFamily: "Poppins-Regular",
    fontSize: 13,
    color: "#333",
    flex: 1,
  },
  learnMoreBlock: {
    backgroundColor: "#E9E9E9",
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
    alignItems: "center",
  },
  learnMoreTextGray: {
    fontFamily: "Poppins-SemiBold",
    color: "#777",
  },
  dashboardTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: "#2B5CFF",
  },
  dashboardButton: {
    backgroundColor: "#8A3FFC",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 40,
    alignItems: "center",
  },
  dashboardButtonText: {
    fontFamily: "Poppins-SemiBold",
    color: "#fff",
    fontSize: 15,
  },
});
