import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, ActivityIndicator, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker'
import {useNavigation} from '@react-navigation/native'
import { getProfile, getUserPosts } from '../api/api'
import { uploadProfilePicture } from '../utils/firebase'
import PostCard from '../components/PostCard'

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadingPic, setUploadingPic] = useState(false)
  //eventually navigate to friends page
  const navigation = useNavigation();

  useEffect(()=> {
    fetchProfile()
  }, [])

  useEffect(()=> {
    if (profile) {
      fetchUserPosts()
    }
  }, [profile])

  const fetchProfile = async () => {
    try {
      const res = await getProfile()
      const profileData = res.data
      setProfile(profileData)
      
      // Store userId if we have it
      if (profileData._id) {
        await AsyncStorage.setItem('userId', profileData._id.toString())
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      // Fallback to basic profile
      const username = await AsyncStorage.getItem('user')
      setProfile({username: username || 'User', birthday: '', friends: []})
    }
    setLoading(false)
  }

  const fetchUserPosts = async () => {
    try {
      let userId = await AsyncStorage.getItem('userId')
      if (!userId && profile?._id) {
        userId = profile._id.toString()
      }
      if (userId) {
        const res = await getUserPosts(userId)
        setPosts(res.data || [])
      }
    } catch (error) {
      console.error('Error fetching user posts:', error)
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
        setUploadingPic(true)
        const userId = await AsyncStorage.getItem('userId') || profile?._id?.toString() || 'anonymous'
        const imageUrl = await uploadProfilePicture(result.assets[0].uri, userId)
        
        // Update profile with new image URL
        // Note: You may want to add an API endpoint to update profilePicUrl
        setProfile({...profile, profilePicUrl: imageUrl})
        setUploadingPic(false)
        Alert.alert('Success', 'Profile picture updated!')
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      Alert.alert('Error', 'Failed to upload profile picture')
      setUploadingPic(false)
    }
  }

  const handleFriendPress = () => {
    // navigation.navigate('FriendsList', {friends: profile?.friends})
    console.log('should nav to friends page')
  }

  if (loading){
    return (
      <View style={styles.container}>
        <ActivityIndicator color = "#fff" size="large"/>
      </View>
    )
  }

  //if no profile loaded, basic message to report error
  if (!profile){
    return (
      <View style={styles.container}>
        <Text style = {styles.text}>Failed to load profile</Text>
      </View>
    )
  }

  return (
    // <ScrollView contentContainerStyle={styles.container}>
    <View style={[styles.container, {paddingTop:60}]}>
     <Text style={[styles.text, {paddingBottom:20, textAlign:'center'}]}>Your Profile</Text>

    <View style={styles.container}>
  
      <View style={styles.header}>
        <TouchableOpacity onPress={handleUpload} disabled={uploadingPic}>
          {uploadingPic ? (
            <ActivityIndicator size="large" color="#7EA0FF" style={styles.profilePic} />
          ) : profile.profilePicUrl ? (
            <Image source={{uri: profile.profilePicUrl}} style={styles.profilePic}/>
          ) : (
            <View style={[styles.profilePic, styles.profilePicPlaceholder]}>
              <Text style={{color:'white', fontSize: 12}}>Tap to add photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={styles.username}>{profile.username}</Text>
          <Text style={styles.age}>Birthday: {profile.birthday}</Text>
        
          <TouchableOpacity onPress={handleFriendPress}>
            <Text style = {styles.friends}>
              {profile.friends?.length || 0} Friends
            </Text>
          </TouchableOpacity>
        
        </View>


      </View>
      <Text style={[styles.text, {paddingTop:20, paddingBottom: 10, textAlign:'center'}]}>Your Posts</Text>
      {posts.length > 0 ? (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard post={{ ...item, navigation }} />
          )}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyPosts}>
          <Text style={styles.emptyPostsText}>No posts yet. Create your first post!</Text>
        </View>
      )}
    </View>
    </View>
    // </ScrollView>
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
  profilePicPlaceholder: {
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPosts: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyPostsText: {
    color: '#9BA1A6',
    fontSize: 16,
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
});
