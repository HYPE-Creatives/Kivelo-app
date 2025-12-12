import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { showAlert } from '@/utils/showAlert';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// NOTE: keep this in sync with AuthContext API_URLS
const API_BASE = 'https://family-wellness.onrender.com/api/v1';

type Props = {
  size?: number;
};

export default function AvatarPicker({ size = 84 }: Props) {
  const { user, refreshProfile } = useAuth() as any;
  const [uploading, setUploading] = useState(false);

  const openImageLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission required', 'Please allow photo access in settings');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission required', 'Please allow camera access in settings');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);

      const token = await AsyncStorage.getItem('kivelo_access_token');
      if (!token) throw new Error('Not authenticated');

      const formData = new FormData();
      const uriParts = uri.split('.');
      const ext = uriParts[uriParts.length - 1];
      const name = `avatar.${ext}`;
      // @ts-ignore - React Native FormData file object
      formData.append('avatar', { uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri, name, type: `image/${ext}` });

      const res = await fetch(`${API_BASE}/users/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Upload failed');
      }

      // Refresh profile in AuthContext so UI updates everywhere
      try {
        await refreshProfile();
      } catch {
        // fallback: ignore
      }

      showAlert('Success', 'Avatar updated');
    } catch (err: any) {
      console.error('Avatar upload failed', err);
      showAlert('Upload failed', err.message || 'Could not upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    showAlert('Remove photo', 'Are you sure you want to remove your profile photo?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          setUploading(true);
          const token = await AsyncStorage.getItem('kivelo_access_token');
          const res = await fetch(`${API_BASE}/users/avatar`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          });
          if (!res.ok) throw new Error('Failed to remove avatar');
          await refreshProfile();
          showAlert('Removed', 'Profile photo removed');
        } catch (err: any) {
          console.error('Remove avatar failed', err);
          showAlert('Failed', err.message || 'Could not remove avatar');
        } finally {
          setUploading(false);
        }
      } }
    ]);
  };

  const initials = (user?.name || 'U').split(' ').map((p: string) => p[0]).slice(0,2).join('').toUpperCase();

  return (
    <View style={styles.container}>
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}> 
        {user?.avatar?.url ? (
          <Image source={{ uri: user.avatar.url }} style={{ width: size, height: size, borderRadius: size / 2 }} />
        ) : (
          <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
        {uploading && (
          <View style={styles.uploadOverlay}>
            <ActivityIndicator color="white" />
          </View>
        )}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={openImageLibrary}>
          <Ionicons name="image-outline" size={18} color="#374151" />
          <Text style={styles.actionText}>Choose</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={openCamera}>
          <Ionicons name="camera-outline" size={18} color="#374151" />
          <Text style={styles.actionText}>Camera</Text>
        </TouchableOpacity>
        {user?.avatar?.url && (
          <TouchableOpacity style={[styles.actionBtn, { borderColor: '#ef4444' }]} onPress={handleRemove}>
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
            <Text style={[styles.actionText, { color: '#ef4444' }]}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  avatar: { overflow: 'hidden', backgroundColor: '#e6eef3', justifyContent: 'center', alignItems: 'center' },
  placeholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#c7e4d9' },
  initials: { fontSize: 28, color: '#074c33', fontWeight: '700' },
  actionsRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'white', borderWidth: 1, borderColor: '#e5e7eb', gap: 6 },
  actionText: { marginLeft: 6, color: '#374151', fontWeight: '600' },
  uploadOverlay: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
});
