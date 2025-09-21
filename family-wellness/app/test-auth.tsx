// app/test-auth.tsx
import { View, Text, Button } from "react-native";
import { useAuth } from "./context/AuthContext";

export default function TestAuth() {
  const { user, login, isLoading } = useAuth();
  
  const testLogin = async () => {
    console.log("Testing login...");
    const result = await login("parent@test.com", "password");
    console.log("Login result:", result);
    console.log("Current user:", user);
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>AuthContext Test</Text>
      <Text>User: {user ? user.email : "No user"}</Text>
      <Text>Loading: {isLoading ? "Yes" : "No"}</Text>
      <Button title="Test Login" onPress={testLogin} />
    </View>
  );
}