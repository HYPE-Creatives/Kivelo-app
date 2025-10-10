// components/BackArrow.tsx
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface BackArrowProps {
  /** If true, close entire mood flow (replace with home) */
  exitFlow?: boolean;
  /** Custom route to navigate to instead of default */
  to?: string;
  /** Optional color */
  color?: string;
}

export default function BackArrow({ exitFlow = true, to, color = "black" }: BackArrowProps) {
  const router = useRouter();

  const handlePress = () => {
    if (to && typeof to === "string") {
      router.replace(to as any); // ✅ cast ensures TS doesn't complain
    } else if (exitFlow) {
      router.replace("/(dashboard)/child/home"); // ✅ exit mood flow
    } else {
      router.back(); // ✅ fallback to back
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{ padding: 16, position: "absolute", top: 40, left: 10, zIndex: 10 }}
    >
      <Ionicons name="arrow-back" size={24} color={color} />
    </TouchableOpacity>
  );
}
