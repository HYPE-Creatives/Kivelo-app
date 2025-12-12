import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { showAlert } from '@/utils/showAlert';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../../context/AuthContext';

const API_BASE = 'https://family-wellness.onrender.com/api/v1';

export default function ChildProfileEdit() {
  const { user, refreshProfile } = useAuth() as any;
  const router = useRouter();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !email) {
      showAlert('Validation', 'Please enter both name and email.');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('kivelo_access_token');
      if (!token) throw new Error('Not authenticated');

      const body: any = { name, email };
      if (password) body.password = password;

      const res = await fetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Update failed');

      try { await refreshProfile(); } catch { /* ignore */ }

      showAlert('Success', 'Profile updated');
      router.back();
    } catch (err: any) {
      console.error('Profile update failed', err);
      showAlert('Error', err.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Edit Profile</Text>

        <Text style={styles.label}>Full name</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Your full name" />

        <Text style={styles.label}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.label}>New password (optional)</Text>
        <TextInput value={password} onChangeText={setPassword} style={styles.input} placeholder="Leave empty to keep current" secureTextEntry />

        <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20, color: '#0f172a' },
  label: { fontSize: 13, color: '#475569', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: 'white', borderColor: '#e2e8f0', borderWidth: 1, padding: 14, borderRadius: 10, fontSize: 16 },
  button: { backgroundColor: '#16A34A', padding: 14, borderRadius: 10, marginTop: 20, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: 'white', fontWeight: '700' },
});
