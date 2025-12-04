import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker'
import { useNavigation } from '@react-navigation/native'
import api from '../../api/api'

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigation = useNavigation();

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('token')
      const res = await api.get('/profile', { headers: { Authorization: `Bearer ${token}` } })
      setProfile(res.data)
    } catch (err) {
      setProfile(null)
    } finally { setLoading(false) }
  }

  const handleUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionAsync()
    if (!permission.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.launchImageLibraryAsync, allowsEditing: true, quality: 1 })
    if (!result.canceled) {
      // upload image
    }
  }

  const handleFriendPress = () => {
    console.log('should nav to friends page')
  }

  if (loading) {
    return (<View style={styles.container}><ActivityIndicator color="#fff" size="large" /></View>)
  }

  if (!profile) {
    return (<View style={styles.container}><Text style={styles.text}>Failed to load profile</Text></View>)
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
              <View style={styles.profilePlaceholder}>
                <Text style={{ color: 'white', textAlign: 'center', fontSize: 10 }}>Insert Image Here</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.info}>
            <View style={styles.card}>
              <Text style={styles.username}>{profile.username}</Text>
              <Text style={styles.age}>Birthday: {profile.birthday}</Text>
              <TouchableOpacity onPress={handleFriendPress}>
                <Text style={styles.friends}>{profile.friends?.length || 0} Friends</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Text style={[styles.text, { paddingTop: 20, textAlign: 'center' }]}>Memories here</Text>
        <ScrollView contentContainerStyle={styles.container}></ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D17', padding: 20 },
  header: { flexDirection: 'row', marginBottom: 20, alignItems: 'center' },
  profilePic: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#fff' },
  profilePlaceholder: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#fff', justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' },
  info: { marginLeft: 20, justifyContent: 'center' },
  username: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  age: { color: '#ccc', marginTop: 4 },
  friends: { color: '#4EA8DE', marginTop: 8, fontWeight: 'bold' },
  text: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  card: { backgroundColor: '#5B4DB7', width: '100%', borderRadius: 30, paddingVertical: 15, paddingHorizontal: 40, alignItems: 'flex-start', marginBottom: 15 },
});
