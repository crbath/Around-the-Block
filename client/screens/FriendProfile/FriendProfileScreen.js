import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api, { getUserPosts } from '../../api/api';
import PostCard from '../../components/feature/PostCard';

const MOCK_FRIEND_PROFILES = {
  '1': { id: '1', username: 'alice', name: 'Alice Johnson', bio: 'Coffee enthusiast ☕ | Exploring new places around the block', postsCount: 12, friendsCount: 45, isFollowing: false, recentPosts: [{ id: '101', username: 'alice', time: '1d', text: 'Beautiful sunset at the park today!', image: 'https://cdn.wallpapersafari.com/91/83/pOKSew.jpg', liked: false, likeCount: 8, commentCount: 2 }] },
  '2': { id: '2', username: 'bob', name: 'Bob Smith', bio: 'Always up for an adventure! 🚀', postsCount: 23, friendsCount: 67, isFollowing: true, recentPosts: [] },
  '3': { id: '3', username: 'carol', name: 'Carol Williams', bio: 'Food lover 🍕 | Sharing my favorite spots', postsCount: 8, friendsCount: 34, isFollowing: false, recentPosts: [] },
};

export default function FriendProfileScreen({ route, navigation }) {
  const { friend } = route.params;
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => { loadFriendProfile(); }, [friend.id]);

  // reload posts when screen comes into focus (important: shows new posts friend created)
  useFocusEffect(
    React.useCallback(() => {
      if (friend?.id) {
        loadFriendPosts();
      }
    }, [friend?.id])
  );

  async function loadFriendProfile() {
    try {
      const res = await api.get(`/users/${friend.id}/profile`);
      setProfile(res.data);
      setIsFollowing(res.data.isFollowing || false);
      // load friend's posts
      await loadFriendPosts();
    } catch (err) {
      const mockProfile = MOCK_FRIEND_PROFILES[friend.id] || { ...friend, bio: 'No bio available', postsCount: 0, friendsCount: 0, isFollowing: false, recentPosts: [] };
      setProfile(mockProfile);
      setIsFollowing(mockProfile.isFollowing || false);
      setPosts(mockProfile.recentPosts || []);
    }
    setLoading(false);
  }

  // fetch friend's posts from API
  async function loadFriendPosts() {
    try {
      const res = await getUserPosts(friend.id);
      const data = Array.isArray(res.data) ? res.data : [];
      // ensure profilePicUrl is present; fallback to friend's profile pic if missing
      const withPics = data.map(p => ({
        ...p,
        profilePicUrl: p.profilePicUrl || profile?.profilePicUrl || ''
      }));
      setPosts(withPics);
    } catch (err) {
      console.error('Error fetching friend posts:', err);
      setPosts([]);
    }
  }

  async function handleFollowToggle() {
    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState);
    try {
      if (newFollowingState) { await api.post(`/users/${friend.id}/follow`); }
      else { await api.delete(`/users/${friend.id}/follow`); }
    } catch (err) {
      setIsFollowing(!newFollowingState);
      console.error('Error toggling follow status:', err);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.center}><ActivityIndicator size="large" color="#7EA0FF" /></View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.center}><Text style={styles.errorText}>Profile not found</Text></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.username}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{profile.username ? profile.username[0].toUpperCase() : '?'}</Text></View>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.name}>{profile.name || profile.username}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}><Text style={styles.statNumber}>{profile.postsCount || 0}</Text><Text style={styles.statLabel}>Posts</Text></View>
            <View style={styles.statItem}><Text style={styles.statNumber}>{profile.friendsCount || 0}</Text><Text style={styles.statLabel}>Friends</Text></View>
          </View>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={[styles.actionButton, isFollowing ? styles.followingButton : styles.followButton]} onPress={handleFollowToggle}>
              <Ionicons name={isFollowing ? 'checkmark' : 'person-add'} size={18} color={isFollowing ? '#FFFFFF' : '#7EA0FF'} />
              <Text style={[styles.actionButtonText, isFollowing && styles.followingButtonText]}>{isFollowing ? 'Following' : 'Follow'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Posts</Text>
          {posts && posts.length > 0 ? (
            <FlatList 
              data={posts} 
              keyExtractor={(item) => item.id} 
              scrollEnabled={false}
              nestedScrollEnabled={true}
              renderItem={({ item }) => (<PostCard post={item} navigation={navigation} />)} 
            />
          ) : (
            <View style={styles.emptyPosts}><Ionicons name="images-outline" size={48} color="#9BA1A6" /><Text style={styles.emptyPostsText}>No posts yet</Text></View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D17' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: '#0B0D17' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  scrollView: { flex: 1 },
  profileHeader: { backgroundColor: '#1A1A2E', padding: 20, marginBottom: 12 },
  avatarContainer: { alignItems: 'center', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#7EA0FF', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#0B0D17' },
  avatarText: { color: '#FFFFFF', fontSize: 40, fontWeight: 'bold' },
  userInfo: { alignItems: 'center', marginBottom: 20 },
  name: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  username: { color: '#9BA1A6', fontSize: 16, marginBottom: 8 },
  statsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20, paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#2A2A3E' },
  statItem: { alignItems: 'center', marginHorizontal: 30 },
  statNumber: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { color: '#9BA1A6', fontSize: 14 },
  actionsContainer: { flexDirection: 'row', justifyContent: 'center' },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, gap: 6 },
  followButton: { backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: '#7EA0FF' },
  followingButton: { backgroundColor: '#7EA0FF' },
  actionButtonText: { color: '#7EA0FF', fontSize: 16, fontWeight: '600' },
  followingButtonText: { color: '#FFFFFF' },
  postsSection: { paddingHorizontal: 16, paddingBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  emptyPosts: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyPostsText: { color: '#9BA1A6', fontSize: 16, marginTop: 12 },
  errorText: { color: '#9BA1A6', fontSize: 16 },
});
