import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  ActivityIndicator, ScrollView, Alert, FlatList 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

import { getProfile, getUserPosts, updateProfile } from '../api/api';
import { uploadProfilePicture } from '../utils/firebase';
import PostCard from '../components/PostCard';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPic, setUploadingPic] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) fetchUserPosts();
  }, [profile]);

  // --- LOG OUT ---
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (err) {
      console.log("Logout error:", err);
    }
  };

  // --- FETCH PROFILE ---
  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      const profileData = res.data;

      setProfile(profileData);

      if (profileData._id) {
        await AsyncStorage.setItem('userId', profileData._id.toString());
      }
    } catch (error) {
      console.error("Error fetching profile:", error);

      const username = await AsyncStorage.getItem('user');
      setProfile({ username: username || "User", birthday: "", friends: [] });
    } finally {
      setLoading(false);
    }
  };

  // --- FETCH USER POSTS ---
  const fetchUserPosts = async () => {
    try {
      let userId = await AsyncStorage.getItem('userId');
      if (!userId && profile?._id) {
        userId = profile._id.toString();
      }

      if (userId) {
        const res = await getUserPosts(userId);
        setPosts(res.data || []);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  // --- UPLOAD PROFILE PICTURE ---
  const handleUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please grant photo access.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingPic(true);
        const userId = await AsyncStorage.getItem("userId") || profile?._id?.toString();
        const imageUrl = await uploadProfilePicture(result.assets[0].uri, userId);

        try {
          await updateProfile({ profilePicUrl: imageUrl });
          setProfile({ ...profile, profilePicUrl: imageUrl });
        } catch (err) {
          console.error("Error updating profile:", err);
          setProfile({ ...profile, profilePicUrl: imageUrl });
        }

        Alert.alert("Success", "Profile picture updated!");
      }
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert("Error", "Failed to upload picture.");
    } finally {
      setUploadingPic(false);
    }
  };

  const handleFriendPress = () => {
    console.log("Should navigate to friends page");
  };

  // --- LOADING STATES ---
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
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingTop: 60 }}
    >
      <Text style={[styles.text, { textAlign: "center", marginBottom: 20 }]}>
        Your Profile
      </Text>

      {/* -------- HEADER -------- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleUpload} disabled={uploadingPic}>
          {uploadingPic ? (
            <ActivityIndicator size="large" color="#7EA0FF" style={styles.profilePic} />
          ) : profile.profilePicUrl ? (
            <Image source={{ uri: profile.profilePicUrl }} style={styles.profilePic} />
          ) : (
            <View style={[styles.profilePic, styles.profilePicPlaceholder]}>
              <Text style={{ color: "white", fontSize: 12 }}>Tap to add photo</Text>
            </View>
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

          {/* LOG OUT BUTTON */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* -------- POSTS SECTION -------- */}
      <Text style={[styles.text, { textAlign: "center", marginTop: 20, marginBottom: 10 }]}>
        Your Posts
      </Text>

      {posts.length > 0 ? (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={{ ...item, navigation }} />}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyPosts}>
          <Text style={styles.emptyPostsText}>
            No posts yet. Create your first post!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0D17",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "center",
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#fff",
  },
  profilePicPlaceholder: {
    backgroundColor: "#1A1A2E",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    marginLeft: 20,
    flex: 1,
  },
  username: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  age: {
    color: "#ccc",
    marginTop: 4,
  },
  friends: {
    color: "#4EA8DE",
    marginTop: 8,
    fontWeight: "bold",
  },
  text: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  emptyPosts: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyPostsText: {
    color: "#9BA1A6",
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 12,
    backgroundColor: "#FF6B6B",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
