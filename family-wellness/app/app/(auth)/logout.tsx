import { View, Text, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function Logout() {
  const handleLogout = async () => {
    await AsyncStorage.removeItem("dummyUser"); // Clear session
    router.replace("/"); // Redirect to landing page
  };

  return (
    <View className="flex-1 items-center justify-center p-6 bg-white">
      <Text className="text-2xl font-bold text-gray-700 mb-6">Logout</Text>
      <TouchableOpacity
        className="bg-red-600 py-3 px-6 rounded-lg"
        onPress={handleLogout}
      >
        <Text className="text-white font-bold text-lg">Confirm Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
