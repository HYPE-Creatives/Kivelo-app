// app/debug-screen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Button, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function DebugScreen() {
  const [all, setAll] = useState<any>(null);

  const load = async () => {
    const users = await AsyncStorage.getItem("USERS");
    const current = await AsyncStorage.getItem("CURRENT_USER");
    setAll({ users: users ? JSON.parse(users) : null, current: current ? JSON.parse(current) : null });
  };

  useEffect(() => { load(); }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Button title="Reload" onPress={load} />
      <Text style={{ marginTop: 12, fontWeight: "bold" }}>USERS:</Text>
      <Text>{JSON.stringify(all?.users, null, 2)}</Text>
      <Text style={{ marginTop: 12, fontWeight: "bold" }}>CURRENT_USER:</Text>
      <Text>{JSON.stringify(all?.current, null, 2)}</Text>
    </ScrollView>
  );
}
