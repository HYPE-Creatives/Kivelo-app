import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { showAlert } from '@/utils/showAlert';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

const API_BASE = 'https://family-wellness.onrender.com/api/v1';

export default function ChildProfileEdit() {
  const { user, refreshProfile } = useAuth() as any;
  const router = useRouter();

  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Get initials for avatar placeholder
  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleAvatarPress = () => {
    showAlert(
      "📸 Update Your Photo",
      "How would you like to update your profile picture?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "📷 Take Photo", onPress: openCamera },
        { text: "🖼️ Choose from Gallery", onPress: openImageLibrary },
        ...(user?.avatar?.url ? [{ text: "🗑️ Remove Photo", style: "destructive" as const, onPress: handleRemoveAvatar }] : []),
      ]
    );
  };

  const openImageLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert("Permission Needed", "Please allow photo access to change your picture!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showAlert("Permission Needed", "Please allow camera access to take a photo!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    setUploadingAvatar(true);
    try {
      const token = await AsyncStorage.getItem('kivelo_access_token');
      if (!token) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('avatar', {
        uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      const res = await fetch(`${API_BASE}/users/avatar`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Upload failed');

      await refreshProfile();
      showAlert("🎉 Awesome!", "Your new photo looks great!");
    } catch (err: any) {
      console.error('Avatar upload failed', err);
      showAlert("Oops!", err.message || "Could not upload photo. Try again!");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const token = await AsyncStorage.getItem('kivelo_access_token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_BASE}/users/avatar`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Remove failed');

      await refreshProfile();
      showAlert("Done!", "Your photo has been removed.");
    } catch (err: any) {
      console.error('Avatar remove failed', err);
      showAlert("Oops!", err.message || "Could not remove photo. Try again!");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Oops!', 'Please enter your name 📝');
      return;
    }

    if (name.trim().length < 2) {
      showAlert('Oops!', 'Your name should be at least 2 characters long!');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('kivelo_access_token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Update failed');

      try { await refreshProfile(); } catch { /* ignore */ }

      showAlert('🎉 Saved!', 'Your profile has been updated!', [
        { text: 'Awesome!', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      console.error('Profile update failed', err);
      showAlert('Oops!', err.message || 'Could not update profile. Try again!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#16A34A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>✏️ Edit Profile</Text>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarContainer} disabled={uploadingAvatar}>
            {uploadingAvatar ? (
              <View style={styles.avatarLoading}>
                <ActivityIndicator size="large" color="#16A34A" />
              </View>
            ) : user?.avatar?.url ? (
              <Image source={{ uri: user.avatar.url }} style={styles.avatarImage} />
            ) : (
              <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </LinearGradient>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change your photo</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="person" size={14} color="#16A34A" /> Your Name
            </Text>
            <TextInput 
              value={name} 
              onChangeText={setName} 
              style={styles.input} 
              placeholder="What's your name?" 
              placeholderTextColor="#94a3b8"
              autoCapitalize="words"
            />
            <Text style={styles.hint}>This is how others will see you in the app</Text>
          </View>

          {/* Email Display (read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="mail" size={14} color="#16A34A" /> Email
            </Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.readOnlyText}>{user?.email || 'No email'}</Text>
              <Ionicons name="lock-closed" size={14} color="#94a3b8" />
            </View>
            <Text style={styles.hint}>Your email can only be changed by your parent</Text>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              Want to change your password? Go to Settings → Change Password
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave} 
          disabled={saving}
          activeOpacity={0.8}
        >
          <LinearGradient 
            colors={saving ? ["#94a3b8", "#94a3b8"] : ["#16A34A", "#15803d"]} 
            style={styles.saveButtonGradient}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc',
  },
  scrollContent: { 
    padding: 20, 
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: Platform.OS === 'ios' ? 50 : 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#1e293b',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 8,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#16A34A',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#16A34A',
  },
  avatarLoading: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#16A34A',
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#16A34A',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarHint: {
    fontSize: 13,
    color: '#64748b',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600',
    color: '#374151', 
    marginBottom: 8,
  },
  input: { 
    backgroundColor: '#f8fafc', 
    borderColor: '#e2e8f0', 
    borderWidth: 1, 
    padding: 14, 
    borderRadius: 12, 
    fontSize: 16,
    color: '#1e293b',
  },
  hint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  readOnlyField: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#64748b',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  saveButtonText: { 
    color: 'white', 
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    alignItems: 'center',
    padding: 14,
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
  },
});
