import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

// 🖼️ Slides with per-image layout control
const slides = [
  {
    id: "1",
    title: "Your Child’s Emotional Well-Being",
    subtitle:
      "Track, Understand & Support your child, emotionally and otherwise.",
    bgColor: "#A9D5FF",
    image: require("../../assets/images/onboarding1.png"),
    imageStyle: {
      width: wp(105),
      height: hp(61),
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      resizeMode: "contain",
    },
  },
  {
    id: "2",
    title: "Empower Your Child’s Emotional Intelligence",
    subtitle: "Discover your child’s mood and feeling with SAFTNEST.",
    bgColor: "#F9CFE6",
    image: require("../../assets/images/onboarding2.png"),
    imageStyle: {
      width: wp(135),
      height: hp(86),
      position: "absolute",
      bottom: 0,
      left: wp(-20), // slightly offset
      resizeMode: "contain",
    },
  },
  {
    id: "3",
    title: "Parent Them With Confidence",
    subtitle:
      "Get started with SAFTNEST today and help your child to feel good.",
    bgColor: "#C5E3FF",
    image: require("../../assets/images/onboarding3.png"),
    imageStyle: {
      width: wp(135),
      height: hp(75),
      position: "absolute",
      bottom: hp(5),
      left: wp(-13),
      resizeMode: "contain",
    },
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 🎨 Interpolated background
  const backgroundColor = scrollX.interpolate({
    inputRange: slides.map((_, i) => i * wp(100)),
    outputRange: slides.map((s) => s.bgColor),
    extrapolate: "clamp",
  });

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / wp(100));
    setCurrentIndex(index);
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      {/* --- Image Section --- */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={handleScroll}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: wp(100) }]}>
            <Image source={item.image} style={item.imageStyle} />
          </View>
        )}
      />

      {/* --- Text Section --- */}
      <View style={styles.textWrapper}>
        <Text style={styles.title}>{slides[currentIndex].title}</Text>
        <Text style={styles.subtitle}>{slides[currentIndex].subtitle}</Text>
      </View>

      {/* --- Pagination Dots --- */}
      <View style={styles.pagination}>
        {slides.map((_, i) => {
          const inputRange = [(i - 1) * wp(100), i * wp(100), (i + 1) * wp(100)];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [wp(1.5), wp(4), wp(1.5)],
            extrapolate: "clamp",
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });
          return (
            <Animated.View
              key={i.toString()}
              style={[styles.dot, { width: dotWidth, opacity }]}
            />
          );
        })}
      </View>

      {/* --- Bottom Buttons --- */}
      {currentIndex === slides.length - 1 ? (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.checkButtonWrapper}
          onPress={() => router.push("/(auth)/parent-login")}
        >
          <LinearGradient
            colors={["#003366", "#0F52BA"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkButton}
          >
            <Ionicons name="checkmark" size={wp(7)} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.skipButton}
          activeOpacity={0.8}
          onPress={() => router.push("/(auth)/parent-login")}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: { alignItems: "center", justifyContent: "center" },

  // 📝 Text section
  textWrapper: {
    position: "absolute",
    top: hp(12),
    paddingHorizontal: wp(6),
    width: "100%",
  },
  title: {
    fontSize: wp(5.5),
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    lineHeight: hp(3.7),
  },
  subtitle: {
    fontSize: wp(3.8),
    fontFamily: "Poppins-Regular",
    color: "#555",
    marginTop: hp(1.5),
    lineHeight: hp(2.5),
    width: wp(85),
  },

  // ⚪ Pagination
  pagination: {
    position: "absolute",
    top: hp(6),
    left: wp(6),
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    height: wp(1.5),
    borderRadius: wp(1),
    marginHorizontal: wp(1),
    backgroundColor: "#fff",
  },

  // 🔘 Buttons
  skipButton: {
    position: "absolute",
    right: wp(5),
    bottom: hp(8),
  },
  skipText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: wp(4),
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  checkButtonWrapper: {
    position: "absolute",
    bottom: hp(6),
    right: wp(5),
  },
  checkButton: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
});
