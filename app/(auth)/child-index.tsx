import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  FlatList,
  SafeAreaView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

// 💡 Adjust image height easily
const IMAGE_HEIGHT_PERCENT = 60;

const slides = [
  {
    id: "1",
    title: "KIVELO",
    bgColor: "#cfe1b9",
    image: require("../../assets/images/child1.png"),
  },
  {
    id: "2",
    title: "Your Adventure Starts Here",
    subtitle:
      "Solve puzzles, win rewards, and climb to new levels of learning every day.",
    bgColor: "#C5E3FF",
    image: require("../../assets/images/child2.png"),
  },
  {
    id: "3",
    title: "Safe Fun Just For You!",
    subtitle:
      "Play exciting games, make discoveries and stay safe while you grow smarter.",
    bgColor: "#cfe1b9",
    image: require("../../assets/images/child3.png"),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

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
    <Animated.View style={[styles.flex, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea}>
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
              <Image
                source={item.image}
                style={[
                  styles.image,
                  {
                    height: hp(IMAGE_HEIGHT_PERCENT),
                  },
                ]}
                resizeMode="contain"
              />
            </View>
          )}
        />

        {/* --- Text Section --- */}
        <View
          style={[
            styles.textWrapper,
            currentIndex === 0
              ? { top: hp(35) } // ✅ Center “KIVELO”
              : { top: hp(18) }, // ✅ Other slides lower
          ]}
        >
          <Text
            style={[
              styles.title,
              currentIndex === 0 && styles.kiveloTitle, // ✅ Bigger and bolder for first slide
            ]}
          >
            {slides[currentIndex].title}
          </Text>

          {slides[currentIndex].subtitle && (
            <Text style={styles.subtitle}>
              {slides[currentIndex].subtitle}
            </Text>
          )}

          {/* --- Get Started Button (only on last slide) --- */}
          {currentIndex === slides.length - 1 && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(auth)/child-login")}
              style={styles.getStartedWrapper}
            >
              <LinearGradient
                colors={["rgba(34,139,34,1)", "rgba(50,205,50,1)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.getStartedButton}
              >
                <Text style={styles.getStartedText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* --- Pagination Dots --- */}
        <View style={styles.pagination}>
          {slides.map((_, i) => {
            const inputRange = [
              (i - 1) * wp(100),
              i * wp(100),
              (i + 1) * wp(100),
            ];
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

        {/* --- Skip Button --- */}
        {currentIndex !== slides.length - 1 && (
          <TouchableOpacity
            style={styles.skipButton}
            activeOpacity={0.8}
            onPress={() => router.push("/(auth)/child-login")}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  slide: {
    flex: 1,
    justifyContent: "flex-end", // 👇 images anchored to bottom
    alignItems: "center",
  },
  image: {
    width: wp(100),
    marginBottom: -30,
  },

  // 📝 Text section
  textWrapper: {
    position: "absolute",
    width: "100%",
    alignItems: "center",
    paddingHorizontal: wp(6),
  },
  title: {
    fontSize: wp(6),
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    textAlign: "center",
    lineHeight: hp(4),
  },
  kiveloTitle: {
    fontSize: wp(8),
    fontFamily: "Poppins-Bold", 
    letterSpacing: wp(0.5),
    color: "#000",
  },
  subtitle: {
    fontSize: wp(3.8),
    fontFamily: "Poppins-Regular",
    color: "#555",
    marginTop: hp(1.5),
    lineHeight: hp(2.5),
    textAlign: "center",
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

  // 🔘 Skip Button
  skipButton: {
    position: "absolute",
    right: wp(5),
    bottom: Platform.OS === "ios" ? hp(5) : hp(3.5),
  },
  skipText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: wp(4),
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // 🌟 Get Started Button
  getStartedWrapper: {
    marginTop: hp(5),
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  getStartedButton: {
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(20),
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  getStartedText: {
    color: "#fff",
    fontSize: wp(4),
    fontFamily: "Poppins-SemiBold",
    textAlign: "center",
  },
});
