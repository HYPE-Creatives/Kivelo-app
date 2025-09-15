import { View } from "react-native";

export default function AiLayout({ children }: { children: React.ReactNode }) {
  return <View className="flex-1 bg-yellow-50">{children}</View>;
}
