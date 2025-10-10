// // DailyRewardsScreen.jsx
// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   Image,
// } from "react-native";
// import { useRouter } from "expo-router"; // ✅ Import useRouter

// // ---------------- Mock Database ----------------
// const mockDB = {
//   rewards: [
//     { id: 1, label: "100 ME", type: "ME" },
//     { id: 2, label: "3 RP", type: "RP" },
//     { id: 3, label: "250 ME", type: "ME" },
//     { id: 4, label: "GIFT CARD", type: "GIFT" },
//     { id: 5, label: "500 ME", type: "ME" },
//     { id: 6, label: "5 RP", type: "RP" },
//     { id: 7, label: "5000 ME", type: "GIFT" },
//   ],

//   unlockedRewards: 0,
//   claimedRewards: [],
//   unlockTimer: 60 * 60 * 22 + 60 * 15,
// };

// // ---------------- Reward Icons ----------------
// const icons = {
//   ME: require("../../../assets/images/coin.png"),
//   RP: require("../../../assets/images/diamond.png"),
//   GIFT: require("../../../assets/images/stack-of-coins.png"),
// };

// // ---------------- Reward Box Component ----------------
// const RewardBox = ({ reward, unlocked, claimed, isLast }) => {
//   return (
//     <View
//       style={[
//         styles.rewardBox,
//         isLast ? styles.lastRewardBox : {},
//         unlocked ? styles.unlocked : styles.locked,
//       ]}
//     >
//       <Image source={icons[reward.type]} style={styles.rewardIcon} />

//       <Text style={[styles.rewardText, claimed && styles.claimedText]}>
//         {reward.label}
//       </Text>

//       {/* Locked Overlay */}
//       {!unlocked && (
//         <View style={styles.lockOverlay}>
//           <Text style={styles.lockText}>🔒</Text>
//         </View>
//       )}

//       {/* Claimed Checkmark */}
//       {claimed && (
//         <View style={styles.claimedOverlay}>
//           <Text style={styles.claimedCheck}>✔</Text>
//         </View>
//       )}
//     </View>
//   );
// };

// // ---------------- Main Screen ----------------
// export default function DailyRewardsScreen() {
//   const router = useRouter(); // ✅ Initialize router

//   const [rewards, setRewards] = useState([]);
//   const [unlockedCount, setUnlockedCount] = useState(0);
//   const [claimedRewards, setClaimedRewards] = useState([]);
//   const [timer, setTimer] = useState(0);

//   // Simulate fetching data from DB
//   useEffect(() => {
//     setRewards(mockDB.rewards);
//     setUnlockedCount(mockDB.unlockedRewards);
//     setClaimedRewards(mockDB.claimedRewards);
//     setTimer(mockDB.unlockTimer);
//   }, []);

//   // Countdown logic
//   useEffect(() => {
//     if (timer <= 0) return;

//     const interval = setInterval(() => {
//       setTimer((prev) => {
//         if (prev <= 1) {
//           clearInterval(interval);
//           unlockNextReward();
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [timer]);

//   // Unlock next reward when countdown finishes
//   const unlockNextReward = () => {
//     setUnlockedCount((prev) => Math.min(prev + 1, rewards.length));
//     setTimer(60 * 60 * 24); // Reset timer to 24 hours
//   };

//   // Format countdown (HH:MM:SS)
//   const formatTime = (seconds) => {
//     const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
//     const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
//     const secs = String(seconds % 60).padStart(2, "0");
//     return `${hrs}:${mins}:${secs}`;
//   };

//   // ✅ Navigate to mood flow
//   const handleNavigateToMood = () => {
//     router.push("/(dashboard)/mood/select"); 
//   };

//   return (
//     <ScrollView style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerText}>DAILY REWARDS</Text>
//       </View>

//       {/* Rewards Grid */}
//       <View style={styles.grid}>
//         {rewards.map((reward, index) => (
//           <RewardBox
//             key={reward.id}
//             reward={reward}
//             unlocked={index < unlockedCount}
//             claimed={claimedRewards.includes(reward.id)}
//             isLast={reward.id === 7}
//           />
//         ))}
//       </View>

//       {/* CTA Button - Navigate to Mood */}
//       <TouchableOpacity style={styles.claimButton} onPress={handleNavigateToMood}>
//         <Text style={styles.claimButtonText}>Claim Your Reward</Text>
//       </TouchableOpacity>

//       {/* Countdown */}
//       <Text style={styles.countdownText}>
//         Your next reward unlocks in {formatTime(timer)}
//       </Text>
//     </ScrollView>
//   );
// }

// // ---------------- Styles ----------------
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#E8F5E9",
//     padding: 20,
//   },
//   header: {
//     alignItems: "center",
//     marginVertical: 20,
//   },
//   headerText: {
//     fontSize: 26,
//     fontWeight: "bold",
//     color: "#2E7D32",
//     letterSpacing: 1,
//   },
//   grid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "center",
//   },

//   // Reward Box
//   rewardBox: {
//     width: "28%",
//     paddingVertical: 18,
//     alignItems: "center",
//     justifyContent: "center",
//     borderRadius: 12,
//     borderWidth: 2,
//     margin: 6,
//     position: "relative",
//   },
//   lastRewardBox: {
//     width: "90%",
//   },
//   unlocked: {
//     backgroundColor: "#181818ff",
//     borderColor: "#8BC34A",
//   },
//   locked: {
//     backgroundColor: "#E0E0E0",
//     borderColor: "#BDBDBD",
//   },

//   rewardIcon: {
//     width: 40,
//     height: 40,
//     marginBottom: 8,
//     resizeMode: "contain",
//   },
//   rewardText: {
//     fontSize: 14,
//     fontWeight: "bold",
//     textAlign: "center",
//     color: "#333",
//   },
//   claimedText: {
//     textDecorationLine: "line-through",
//     color: "#888",
//   },

//   // Locked Overlay
//   lockOverlay: {
//     position: "absolute",
//     top: 6,
//     right: 6,
//     backgroundColor: "rgba(0,0,0,0.3)",
//     borderRadius: 12,
//     paddingHorizontal: 5,
//     paddingVertical: 2,
//   },
//   lockText: {
//     color: "#fff",
//     fontSize: 12,
//   },

//   // Claimed Overlay
//   claimedOverlay: {
//     position: "absolute",
//     bottom: 6,
//     right: 6,
//     backgroundColor: "#8BC34A",
//     borderRadius: 12,
//     paddingHorizontal: 4,
//     paddingVertical: 2,
//   },
//   claimedCheck: {
//     color: "#fff",
//     fontSize: 12,
//   },

//   // Claim Button
//   claimButton: {
//     backgroundColor: "#8BC34A",
//     paddingVertical: 15,
//     borderRadius: 50,
//     alignItems: "center",
//     marginTop: 30,
//   },
//   claimButtonText: {
//     fontSize: 16,
//     color: "#fff",
//     fontWeight: "bold",
//   },

//   // Countdown Text
//   countdownText: {
//     textAlign: "center",
//     color: "#555",
//     marginTop: 15,
//     fontSize: 14,
//   },
// });
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");
const guidelineBaseWidth = 375;  // iPhone X width
const guidelineBaseHeight = 812; // iPhone X height

const scaleW = (size: number) => (width / guidelineBaseWidth) * size;
const scaleH = (size: number) => (height / guidelineBaseHeight) * size;
const scaleFont = (size: number) => Math.min(scaleW(size), scaleH(size));

// ✅ darken color helper
const darken = (hex: string, amount = 0.2) => {
  let col = hex.replace("#", "");
  if (col.length === 3) col = col.split("").map(c => c + c).join("");
  const num = parseInt(col, 16);

  let r = (num >> 16) - 255 * amount;
  let g = ((num >> 8) & 0x00ff) - 255 * amount;
  let b = (num & 0x0000ff) - 255 * amount;

  r = Math.max(0, r);
  g = Math.max(0, g);
  b = Math.max(0, b);

  return `rgb(${r},${g},${b})`;
};

export default function JournalHomeScreen() {
  const router = useRouter();
  const selectedDate = new Date();

  // ✅ Navigate to mood flow
  const handleNavigateToMood = () => {
    router.push("/(dashboard)/mood/select");
  };

  // helper to get week start (Monday) and produce an array of 7 date objects
  const week = useMemo(() => {
    const d = new Date(selectedDate);
    const day = d.getDay();
    const daysFromMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + daysFromMonday);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const dd = new Date(monday);
      dd.setDate(monday.getDate() + i);
      days.push(dd);
    }
    return days;
  }, [selectedDate]);

  const weekdayShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const quickJournals = [
    { title: "Pause & reflect 🌱", desc: "What are you grateful for today?", color: "#fce7f3" },
    { title: "Set Intentions 🙂", desc: "How do you want to feel?", color: "#ede9fe" },
    { title: "Embrace Calm", desc: "Breathe and focus on one thing", color: "#ecfdf5" },
    { title: "Memories", desc: "Add a photo or quick note", color: "#f9fafb" },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Calendar row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarRow}>
        {week.map((day, idx) => {
          const selected = isSameDay(day, selectedDate);
          return (
            <View key={idx} style={styles.calendarDay}>
              <Text style={[styles.calendarLabel, selected && styles.calendarLabelSelected]}>
                {weekdayShort[idx]}
              </Text>
              {selected ? (
                <LinearGradient
                  colors={["rgba(34,139,34,1)", "rgba(50,205,50,1)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.calendarCircle}
                >
                  <Text style={{ color: "white", fontSize: scaleFont(13) }}>
                    {day.getDate()}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={[styles.calendarCircle, styles.calendarCircleDefault]}>
                  <Text style={{ color: "black", fontSize: scaleFont(13) }}>
                    {day.getDate()}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* My Journal */}
      <View style={styles.myJournalRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily check-in</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>See all</Text>
            </TouchableOpacity>
          </View>

          <ImageBackground
            source={require("../../../assets/images/happybg.png")}
            style={styles.journalCard}
            imageStyle={styles.journalCardImage}
          >
            {/* Text at top */}
            <View style={styles.journalTop}>
              <Text style={styles.journalTitle}>Let’s start your day</Text>
              <Text style={styles.journalSubtitle}>
                Begin with a mindful mood reflection.
              </Text>
            </View>

            {/* Gradient Button */}
            <LinearGradient
              colors={["rgba(34,139,34,1)", "rgba(50,205,50,1)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.journalButton}
            >
              <TouchableOpacity onPress={handleNavigateToMood}>
                <Text style={styles.journalButtonText}>Start Now</Text>
              </TouchableOpacity>
            </LinearGradient>
          </ImageBackground>
        </View>
      </View>

      {/* Quick Journal as Slider */}
      <View style={styles.quickJournalWrapper}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Journal</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickJournals.map((item, idx) => (
            <View key={idx} style={[styles.quickJournalCard, { backgroundColor: item.color }]}>
              <Text style={styles.quickJournalTitle}>{item.title}</Text>
              <Text style={styles.quickJournalDesc}>{item.desc}</Text>

              {/* White button with matching border + darker text */}
              <TouchableOpacity
                style={[styles.quickJournalTag, { borderColor: item.color }]}
              >
                <Text
                  style={[
                    styles.quickJournalTagText,
                    { color: darken(item.color, 0.4) },
                  ]}
                >
                  Start Now
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3efee",
    padding: scaleW(16),
    marginTop: scaleH(40),
  },
  calendarRow: {
    marginBottom: scaleH(24),
  },
  calendarDay: {
    alignItems: "center",
    marginHorizontal: scaleW(4.35),
  },
  calendarLabel: {
    fontSize: scaleFont(12),
    color: "gray",
    fontWeight: "400",
  },
  calendarLabelSelected: {
    color: "#000",
    fontWeight: "600",
  },
  calendarCircle: {
    marginTop: scaleH(6),
    width: scaleW(40),
    height: scaleW(40),
    borderRadius: scaleW(20),
    alignItems: "center",
    justifyContent: "center",
  },
  calendarCircleDefault: {
    backgroundColor: "#fff",
  },
  myJournalRow: {
    flexDirection: "row",
    marginBottom: scaleH(24),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scaleH(8),
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: "600",
  },
  sectionLink: {
    fontSize: scaleFont(12),
    color: "gray",
  },
  journalCard: {
    borderRadius: 12,
    overflow: "hidden",
    padding: scaleW(16),
    height: scaleH(320),
    justifyContent: "space-between",
  },
  journalCardImage: {
    borderRadius: 12,
    resizeMode: "cover",
  },
  journalTop: {
    alignItems: "flex-start",
  },
  journalTitle: {
    fontSize: scaleFont(20),
    fontFamily: "Poppins-Bold",
    marginBottom: scaleH(-12),
    color: "#000",
  },
  journalSubtitle: {
    fontSize: scaleFont(10),
    color: "#000",
    fontFamily: "Poppins-SemiBold",
  },
  journalButton: {
    borderRadius: 50,
    marginHorizontal: 80,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scaleH(12),
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
  },
  journalButtonText: {
    fontSize: scaleFont(13),
    fontFamily: "Poppins-SemiBold",
    color: "#fff",
    textAlign: "center",
  },
  quickJournalWrapper: {
    marginBottom: scaleH(24),
  },
  quickJournalCard: {
    width: scaleW(185),
    height: scaleH(160),
    borderRadius: 12,
    padding: scaleW(18),
    marginRight: scaleW(8),
    position: "relative",
  },
  quickJournalTitle: {
    fontSize: scaleFont(12),
    fontFamily: "Poppins-SemiBold",
  },
  quickJournalDesc: {
    fontSize: scaleFont(11),
    color: "gray",
    marginTop: scaleH(4),
    fontFamily: "Poppins-Regular",
  },
  quickJournalTag: {
    position: "absolute",
    bottom: scaleH(10),
    left: scaleW(12),
    paddingHorizontal: scaleW(12),
    paddingVertical: scaleH(5),
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
    backgroundColor: "#fff",
    borderWidth: 1,
  },
  quickJournalTagText: {
    fontSize: scaleFont(10),
    fontFamily: "Poppins-SemiBold",
  },
});
