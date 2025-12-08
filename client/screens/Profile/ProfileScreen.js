import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView, Alert, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { getProfile, updateProfile, getUserPosts } from '../../api/api'
import { uploadProfilePicture } from '../../utils/firebase'
import PostCard from '../../components/feature/PostCard'

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigation = useNavigation();

  useEffect(() => { fetchProfile() }, [])

  // reload profile and posts when screen comes into focus (important: shows new posts after creating them)
  useFocusEffect(
    React.useCallback(() => {
      if (profile) {
        fetchUserPosts();
      }
    }, [profile])
  )

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await getProfile()
      const profileData = res.data
      setProfile(profileData)
      console.log(profileData)

      // Store userId if we have it
      if (profileData._id) {
        await AsyncStorage.setItem('userId', profileData._id.toString())
        // fetch posts after profile is loaded
        await fetchUserPosts(profileData._id.toString())
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      // Fallback to basic profile
      const username = await AsyncStorage.getItem('user')
      setProfile({ username: username || 'User', birthday: '', friends: [] })
    } finally {
      setLoading(false)
    }
  }

  // fetch user's posts
  const fetchUserPosts = async (userId = null) => {
    try {
      const userIdToUse = userId || await AsyncStorage.getItem('userId')
      if (userIdToUse) {
        const res = await getUserPosts(userIdToUse)
        setPosts(res.data || [])
      }
    } catch (err) {
      console.error('Error fetching user posts:', err)
      setPosts([])
    }
  }

  const handleUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please grant permission to access your photos')
      return
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const userId = await AsyncStorage.getItem('userId') || profile?._id?.toString() || 'anonymous'
        const imageUrl = await uploadProfilePicture(result.assets[0].uri, userId)

        // Update profile with new image URL in the backend
        try {
          await updateProfile({ profilePicUrl: imageUrl })
          setProfile({ ...profile, profilePicUrl: imageUrl })
          Alert.alert('Success', 'Profile picture updated!')
        } catch (updateError) {
          console.error('Error updating profile in backend:', updateError)
          // Still update local state even if backend update fails
          setProfile({ ...profile, profilePicUrl: imageUrl })
          Alert.alert('Warning', 'Picture uploaded but may not be saved to profile')
        }
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      Alert.alert('Error', 'Failed to upload profile picture')
    }
  }

  // navigate to friends screen when tapping friends count (important: Friends is in FeedStack, so navigate to Feed tab first)
  const handleFriendPress = () => {
    navigation.navigate('Feed', { screen: 'Friends' });
  }

  if (loading) {
    return (<View style={{ flex: 1, backgroundColor: '#B0D17', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#fff" size="large" /></View>)
  }

  if (!profile) {
    return (<View style={styles.container}><Text style={styles.text}>Failed to load profile</Text></View>)
  }

  return (
    <View style={[styles.container, { paddingTop: 60 }]}>
      <Text style={[styles.text, { paddingBottom: 20, textAlign: 'center' }]}>Your Profile</Text>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleUpload}>
            {profile.profilePicUrl ? (
              <Image source={{ uri: profile.profilePicUrl }} style={styles.profilePic} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={{ color: 'white', textAlign: 'center', fontSize: 10 }}>Tap to add photo</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.info}>
            <View style={styles.card}>
              <Text style={styles.username}>{profile.username}</Text>
              {(profile.barAcc != null && profile.barAcc) ? (
                <Text style={styles.age}>Bar Account</Text>
              ) :
                <Text style={styles.age}>Birthday: {profile.birthday}</Text>
              }

              <TouchableOpacity onPress={handleFriendPress}>
                <Text style={styles.friends}>{profile.friends?.length || 0} Friends</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Text style={[styles.text, { paddingTop: 20, textAlign: 'center', marginBottom: 10 }]}>Your Posts</Text>
        {posts.length > 0 ? (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PostCard post={item} navigation={navigation} />}
            scrollEnabled={false}
            nestedScrollEnabled={true}
          />
        ) : (
          <View style={styles.emptyPosts}>
            <Text style={styles.emptyPostsText}>No posts yet. Create your first post!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D17', padding: 20 },
  scrollContainer: { flex: 1 },
  header: { flexDirection: 'row', marginBottom: 20, alignItems: 'center' },
  profilePic: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#fff' },
  profilePlaceholder: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#fff', justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' },
  info: { marginLeft: 20, justifyContent: 'center' },
  username: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  age: { color: '#ccc', marginTop: 4 },
  friends: { color: '#4EA8DE', marginTop: 8, fontWeight: 'bold' },
  text: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  card: { backgroundColor: '#5B4DB7', width: '100%', borderRadius: 30, paddingVertical: 15, paddingHorizontal: 40, alignItems: 'flex-start', marginBottom: 15 },
  emptyPosts: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyPostsText: { color: '#9BA1A6', fontSize: 16 },
});
