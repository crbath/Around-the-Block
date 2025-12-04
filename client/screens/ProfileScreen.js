import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import api from '../api/api';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    // Temp placeholder data — replace with GET /profile later
    setProfile({
      username: 'User 1',
      birthday: '1/1/0000',
      friends: []
    });
    setLoading(false);
  };

  // ---- LOGOUT HANDLER ---- //
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');   // Remove JWT

      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],            // Navigate back to login screen
      });
    } catch (err) {
      console.log("Logout error:", err);
    }
  };

  const handleUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionAsync();
    if (!permission.granted) return;
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.launchImageLibraryAsync,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      // Handle image upload later (e.g., Firebase Storage)
    }
  };

  const handleFriendPress = () => {
    console.log('Should navigate to friends page');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Failed to load profile</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: 60 }]}>
      <Text style={[styles.text, { paddingBottom: 20, textAlign: 'center' }]}>Your Profile</Text>

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleUpload}>
            {profile.profilePicture ? (
              <Image source={{ uri: profile.profilePicture }} style={styles.profilePic} />
            ) : (
              <Text style={{ color: 'white' }}>Insert Image Here</Text>
            )}
          </TouchableOpacity>

          <View style={styles.info}>
            <Text style={styles.username}>{profile.username}</Text>
            <Text style={styles.age}>Birthday: {profile.birthday}</Text>

            <TouchableOpacity onPress={handleFriendPress}>
              <Text style={styles.friends}>
                {profile.friends?.length || 0} Friends
              </Text>
            </TouchableOpacity>

            {/* ---- LOG OUT BUTTON ---- */}
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.text, { paddingTop: 20, textAlign: 'center' }]}>Memories here</Text>

        <ScrollView contentContainerStyle={styles.container}>
          {/* memory grid empty for now */}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D17',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#fff',
  },
  info: {
    marginLeft: 20,
  },
  username: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  age: {
    color: '#ccc',
    marginTop: 4,
  },
  friends: {
    color: '#4EA8DE',
    marginTop: 8,
    fontWeight: 'bold',
  },
  text: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },

  logoutButton: {
    marginTop: 12,
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
