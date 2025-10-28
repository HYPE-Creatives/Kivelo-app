

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
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

const ChooseRole = () => {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedRole === "child") {
      router.push("/(auth)/child-index");
    } else if (selectedRole === "parent") {
      router.push("/(auth)/parent-index");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Who are you?</Text>

      {/* CHILD ROLE */}
      <View style={[styles.roleSection, { marginTop: hp(13), marginBottom: hp(6) }]}>
        <TouchableOpacity
          style={styles.cardWrapper}
          onPress={() => setSelectedRole("child")}
          activeOpacity={1}
        >
          <LinearGradient
            colors={
              selectedRole === "child"
                ? ["rgba(20, 99, 20, 1)", "rgba(50,205,50,1)"]
                : ["rgba(20, 99, 20, 0.7)", "rgba(50,205,50,0.5)"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.cardContentLeft}>
              <Animated.View
                style={[
                  styles.imageWrapper,
                  styles.imageLeft,
                  selectedRole === "child" && {
                    transform: [{ scale: 1.05 }],
                    top: -141.3,
                  },
                ]}
              >
                <Image
                  source={require("../assets/images/boy.png")}
                  style={[styles.image, { width: wp(38), height: hp(28) }]}
                />
              </Animated.View>

              <View style={styles.textContainerChild}>
                <Text style={[styles.cardText, styles.textShadow]}>I’m a Child</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* PARENT ROLE */}
      <View style={[styles.roleSection, { marginTop: hp(6), marginBottom: hp(11) }]}>
        <TouchableOpacity
          style={styles.cardWrapper}
          onPress={() => setSelectedRole("parent")}
          activeOpacity={1}
        >
          <LinearGradient
            colors={
              selectedRole === "parent"
                ? ["rgba(15,82,186,1)", "rgba(0,51,102,1)"]
                : ["rgba(15,82,186,0.5)", "rgba(0,51,102,0.7)"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.cardContentRight}>
              <View style={styles.textContainerParent}>
                <Text style={[styles.cardText, styles.textShadow]}>I’m a Parent</Text>
              </View>

              <Animated.View
                style={[
                  styles.imageWrapper,
                  styles.imageRight,
                  selectedRole === "parent" && {
                    transform: [{ scale: 1.05 }],
                    top: -141.3,
                  },
                ]}
              >
                <Image
                  source={require("../assets/images/mom.png")}
                  style={[styles.image, { width: wp(38), height: hp(28) }]}
                />
              </Animated.View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* CONTINUE BUTTON */}
      <TouchableOpacity
        style={[styles.continueButton, !selectedRole && styles.disabledButton]}
        disabled={!selectedRole}
        onPress={handleContinue}
      >
        <Text style={styles.continueText}>
          {selectedRole ? "Continue" : "Select a Role"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ChooseRole;

// (styles remain unchanged)


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F8",
    alignItems: "center",
    paddingHorizontal: wp(6),
    paddingTop: hp(5), // ensures safe top margin on Android
  },
  title: {
    fontSize: wp(7),
    fontFamily: "Poppins-SemiBold",
    color: "#555",
    textAlign: "center",
    marginTop: 60,
  },
  roleSection: {
    width: "100%",
  },
  cardWrapper: {
    width: "100%",
    overflow: "visible",
  },
  card: {
    borderRadius: 20,
    paddingVertical: hp(6),
    paddingHorizontal: wp(6),
    width: "100%",
    justifyContent: "center",
  },
  cardContentLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardContentRight: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  textContainerChild: {
    flex: 1,
    alignItems: "flex-end",
    marginRight: wp(4),
  },
  textContainerParent: {
    flex: 1,
    alignItems: "flex-start",
    marginLeft: wp(4),
  },
  cardText: {
    color: "#fff",
    fontSize: wp(4),
    fontFamily: "Poppins-Regular",
  },
  textShadow: {
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  imageWrapper: {
    position: "absolute",
    top: -137,
    zIndex: 1,
  },
  imageLeft: {
    left: wp(-2),
  },
  imageRight: {
    right: wp(-2),
  },
  image: {
    resizeMode: "contain",
  },
  continueButton: {
    backgroundColor: "#000",
    width: "100%",
    borderRadius: 35,
    paddingVertical: hp(2.3),
    alignItems: "center",
  },
  continueText: {
    color: "#fff",
    fontSize: wp(3.3),
    fontFamily: "Poppins-SemiBold",
  },
  disabledButton: {
    backgroundColor: "#999",
  },
});
