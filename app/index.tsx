

// app/index.tsx

// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import React, { useRef, useState } from "react";
// import {
//   Dimensions,
//   FlatList,
//   Image,
//   NativeScrollEvent,
//   NativeSyntheticEvent,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// const { width } = Dimensions.get("window");

// // === SLIDES DATA ===
// const slides = [
//   {
//     id: 1,
//     title: "Welcome to Safenest",
//     subtitle:
//       "A safe space where kids express freely and parents stay connected with care.",
//     image: require("../assets/images/family-connect.png"),
//   },
//   {
//     id: 2,
//     title: "Protect. Connect. Empower.",
//     subtitle:
//       "Encourage journaling, playful emotional check-ins, and safe conversations to build trust.",
//     image: require("../assets/images/emotional-support.png"),
//   },
//   {
//     id: 3,
//     title: "Together, We Fight Abuse",
//     subtitle:
//       "AI-powered detection helps parents identify emotional distress and prevent abuse.",
//     image: require("../assets/images/protect-children.png"),
//   },
// ];

// export default function Onboarding() {
//   const flatListRef = useRef<FlatList>(null);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const router = useRouter();

//   // === HANDLE SCROLL ===
//   const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
//     const index = Math.round(event.nativeEvent.contentOffset.x / width);
//     setCurrentIndex(index);
//   };

//   // === REQUIRED FOR FlatList indexing ===
//   const getItemLayout = (_: any, index: number) => ({
//     length: width,
//     offset: width * index,
//     index,
//   });

//   return (
//     <View style={styles.container}>
//       {/* SLIDER */}
//       <FlatList
//         ref={flatListRef}
//         data={slides}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={({ item }) => (
//           <View style={styles.slide}>
//             <Image
//               source={item.image}
//               style={styles.image}
//               resizeMode="contain"
//             />
//             <View style={styles.textContainer}>
//               <Text style={styles.title}>{item.title}</Text>
//               {item.subtitle && (
//                 <Text style={styles.subtitle}>{item.subtitle}</Text>
//               )}
//             </View>
//           </View>
//         )}
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         onScroll={handleScroll}
//         scrollEventThrottle={16}
//         getItemLayout={getItemLayout}
//       />

//       {/* === SWIPE TEXT (Hides on last slide) === */}
//       {currentIndex < slides.length - 1 && (
//         <Text style={styles.swipeText}>Swipe</Text>
//       )}

//       {/* Pagination Dots */}
//       <View style={styles.dots}>
//         {slides.map((_, index) => (
//           <Ionicons
//             key={index}
//             name="ellipse"
//             size={10}
//             color={index === currentIndex ? "#0530ad" : "#ccc"}
//             style={{ marginHorizontal: 4 }}
//           />
//         ))}
//       </View>

//       {/* Skip Button (hidden on last slide) */}
//       {currentIndex < slides.length - 1 && (
//         <TouchableOpacity
//           style={styles.skipButton}
//           onPress={() => router.push("/(auth)/login")}
//         >
//           <Text style={styles.skipText}>Skip</Text>
//         </TouchableOpacity>
//       )}

//       {/* ✅ Done Button (only on last slide) */}
//       {currentIndex === slides.length - 1 && (
//         <TouchableOpacity
//           style={styles.doneButton}
//           onPress={() => router.push("/(auth)/login")}
//         >
//           <Ionicons name="checkmark" size={24} color="#fff" />
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// }

// // === STYLES ===
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f8f8ff",
//   },
//   slide: {
//     width,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//   },
//   image: {
//     width: "100%",
//     height: 400,
//     marginVertical: 10
//   },
//   textContainer: {
//     marginTop: -30,
//     alignItems: "center",
//     paddingHorizontal: 8,
//     marginBottom: 30,
//   },
//   title: {
//     fontFamily: "Poppins-Bold",
//     fontSize: 24,
//     textAlign: "center",
//     color: "#111",
//     lineHeight: 22
//   },
//   subtitle: {
//     fontSize: 11,
//     fontFamily: "Poppins-Regular",
//     textAlign: "center",
//     color: "#555",
//     marginTop: 10,
//   },
//   swipeText: {
//     fontFamily: "Poppins-Regular",
//     textAlign: "center",
//     fontSize: 12,
//     color: "#333",
//     marginBottom: -4,
//   },
//   dots: {
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 40,
//   },
//   skipButton: {
//     position: "absolute",
//     bottom: 95,
//     left: 30,
//   },
//   skipText: {
//     fontFamily: "Poppins-SemiBold",
//     fontSize: 14,
//     color: "#333",
//   },
//   doneButton: {
//     position: "absolute",
//     bottom: 93,
//     right: 30,
//     backgroundColor: "#0530ad",
//     borderRadius: 30,
//     padding: 12,
//     elevation: 3,
//   },
// });

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Your Child’s Emotional Well-Being",
    subtitle:
      "Track, Understand & Support your child, emotionally and otherwise.",
    bgColor: "#A9D5FF",
    image: require("../assets/images/onboarding1.png"),
    imageStyle: {
      width: width * 0.95,
      height: height * 0.95,
      marginTop: height * 0.3,
    },
  },
  {
    id: "2",
    title: "Empower Your Child’s Emotional Intelligence",
    subtitle: "Discover your child’s mood and feeling with SAFTNEST",
    bgColor: "#F9CFE6",
    image: require("../assets/images/onboarding2.png"),
    imageStyle: {
      width: width * 1.1,
      height: height * 1.1,
      marginTop: height * 0.1,
    },
  },
  {
    id: "3",
    title: "Parent Them With Confidence",
    subtitle:
      "Get started with SAFTNEST today and help your child to feel good.",
    bgColor: "#C5E3FF",
    image: require("../assets/images/onboarding3.png"),
    imageStyle: {
      width: width * 0.85,
      height: height * 0.85,
      marginTop: height * 0.3,
      left: width * 0.165,
    },
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<Animated.FlatList<any>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const backgroundColor = scrollX.interpolate({
    inputRange: slides.map((_, i) => i * width),
    outputRange: slides.map((s) => s.bgColor),
    extrapolate: "clamp",
  });

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
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
          <View style={[styles.slide, { width }]}>
            <Image
              source={item.image}
              style={[styles.image, item.imageStyle]}
              resizeMode="contain"
            />
          </View>
        )}
      />

      {/* --- Text Section --- */}
      <View style={styles.textWrapper}>
        <Animated.Text style={styles.title}>
          {slides[currentIndex].title}
        </Animated.Text>
        <Animated.Text style={styles.subtitle}>
          {slides[currentIndex].subtitle}
        </Animated.Text>
      </View>

      {/* --- Pagination --- */}
      <View style={styles.pagination}>
        {slides.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [6, 16, 6],
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
              style={[
                styles.dot,
                { width: dotWidth, opacity, backgroundColor: "#fff" },
              ]}
            />
          );
        })}
      </View>

      {/* --- Bottom Buttons --- */}
      {currentIndex === slides.length - 1 ? (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.checkButtonWrapper}
          onPress={() => router.push("/(auth)/login")}
        >
          <LinearGradient
            colors={["rgba(0,51,102,1)", "rgba(15,82,186,1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkButton}
          >
            <Ionicons name="checkmark" size={width * 0.07} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    alignSelf: "center",
    position: "absolute",
    top: 0,
  },

  // Text section
  textWrapper: {
    position: "absolute",
    top: height * 0.1,
    paddingHorizontal: width * 0.06,
    width: "100%",
  },
  title: {
    fontSize: width * 0.058,
    fontFamily: "Poppins-SemiBold",
    color: "#000",
    lineHeight: width * 0.068, // reduced line spacing
    textAlign: "left",
  },
  subtitle: {
    fontSize: width * 0.035,
    fontFamily: "Poppins-Regular",
    color: "#333",
    lineHeight: width * 0.043,
    marginTop: height * 0.01,
    opacity: 0.8,
    width: "90%",
  },

  // Pagination
  pagination: {
    position: "absolute",
    top: height * 0.06,
    left: width * 0.06,
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    height: width * 0.015,
    borderRadius: width * 0.007,
    marginHorizontal: width * 0.008,
    backgroundColor: "#fff",
  },

  // Buttons
  skipButton: {
    position: "absolute",
    right: width * 0.05,
    bottom: height * 0.05,
  },
  skipText: {
    color: "#000",
    fontWeight: "600",
    fontSize: width * 0.04,
  },
  checkButtonWrapper: {
    position: "absolute",
    bottom: height * 0.05,
    right: width * 0.05,
  },
  checkButton: {
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.075,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
});
