import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserPosts } from '../api/api';
import PostCard from '../components/PostCard';

// mock data for when the backend isn't ready yet
const MOCK_FRIEND_PROFILES = {
  '1': {
    id: '1',
    username: 'alice',
    name: 'Alice Johnson',
    bio: 'Coffee enthusiast ☕ | Exploring new places around the block',
    postsCount: 12,
    friendsCount: 45,
    isFollowing: false,
    recentPosts: [
      {
        id: '101',
        username: 'alice',
        time: '1d',
        text: 'Beautiful sunset at the park today!',
        image: 'https://cdn.wallpapersafari.com/91/83/pOKSew.jpg',
        liked: false,
        likeCount: 8,
        commentCount: 2,
      },
    ],
  },
  '2': {
    id: '2',
    username: 'bob',
    name: 'Bob Smith',
    bio: 'Always up for an adventure! 🚀',
    postsCount: 23,
    friendsCount: 67,
    isFollowing: true,
    recentPosts: [],
  },
  '3': {
    id: '3',
    username: 'carol',
    name: 'Carol Williams',
    bio: 'Food lover 🍕 | Sharing my favorite spots',
    postsCount: 8,
    friendsCount: 34,
    isFollowing: false,
    recentPosts: [],
  },
};

export default function FriendProfileScreen({ route, navigation }) {
  // get the friend object that was passed when we navigated here
  const { friend } = route.params;
  // state for the profile data we're loading
  const [profile, setProfile] = useState(null);
  // state for showing loading spinner
  const [loading, setLoading] = useState(true);
  // state for whether we're following this friend or not
  const [isFollowing, setIsFollowing] = useState(false);

  // load the profile when the screen first opens
  useEffect(() => {
    loadFriendProfile();
  }, [friend.id]);

  // fetch the friend's profile data from the backend, or use mock data if backend fails
  async function loadFriendProfile() {
    try {
      // For now, use friend data passed from navigation
      // You can add a user profile endpoint later
      const friendProfile = {
        ...friend,
        bio: friend.bio || 'No bio available',
        postsCount: 0,
        friendsCount: 0,
        isFollowing: false,
        recentPosts: [],
      };
      setProfile(friendProfile);
      setIsFollowing(friendProfile.isFollowing || false);
      
      // Fetch friend's posts
      if (friend.id) {
        try {
          const postsRes = await getUserPosts(friend.id);
          friendProfile.recentPosts = postsRes.data || [];
          friendProfile.postsCount = friendProfile.recentPosts.length;
          setProfile({...friendProfile});
        } catch (err) {
          console.error('Error fetching friend posts:', err);
        }
      }
    } catch (err) {
      // if the api call fails, just use mock data instead
      const mockProfile = MOCK_FRIEND_PROFILES[friend.id] || {
        ...friend,
        bio: 'No bio available',
        postsCount: 0,
        friendsCount: 0,
        isFollowing: false,
        recentPosts: [],
      };
      setProfile(mockProfile);
      setIsFollowing(mockProfile.isFollowing || false);
    }
    setLoading(false);
  }

  // when user clicks the follow/unfollow button, toggle the follow status
  async function handleFollowToggle() {
    // flip the following state immediately for better ux
    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState);

    try {
      // update the backend with the new follow status
      if (newFollowingState) {
        await api.post(`/users/${friend.id}/follow`);
      } else {
        await api.delete(`/users/${friend.id}/follow`);
      }
    } catch (err) {
      // if the api call fails, revert back to the previous state
      setIsFollowing(!newFollowingState);
      console.error('Error toggling follow status:', err);
    }
  }

  // show loading spinner while we're fetching the profile data
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7EA0FF" />
        </View>
      </View>
    );
  }

  // if we couldn't load the profile for some reason, show an error message
  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>Profile not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* header with back button and username */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.username}</Text>
        <View style={styles.backButton} />
      </View>

      {/* scrollable content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* profile info section at the top */}
        <View style={styles.profileHeader}>
          {/* avatar circle showing first letter of username */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.username ? profile.username[0].toUpperCase() : '?'}
              </Text>
            </View>
          </View>

          {/* user's name and username */}
          <View style={styles.userInfo}>
            <Text style={styles.name}>{profile.name || profile.username}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
          </View>

          {/* stats showing posts count and friends count */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.postsCount || 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.friendsCount || 0}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
          </View>

          {/* follow/unfollow button */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                isFollowing ? styles.followingButton : styles.followButton,
              ]}
              onPress={handleFollowToggle}
            >
              <Ionicons
                name={isFollowing ? 'checkmark' : 'person-add'}
                size={18}
                color={isFollowing ? '#FFFFFF' : '#7EA0FF'}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  isFollowing && styles.followingButtonText,
                ]}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* section showing all of this friend's posts */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Posts ({profile.postsCount || 0})</Text>
          {profile.recentPosts && profile.recentPosts.length > 0 ? (
            // show the posts using the PostCard component
            <FlatList
              data={profile.recentPosts}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <PostCard post={{ ...item, navigation }} />
              )}
            />
          ) : (
            // show empty state if they don't have any posts
            <View style={styles.emptyPosts}>
              <Ionicons name="images-outline" size={48} color="#9BA1A6" />
              <Text style={styles.emptyPostsText}>
                No posts yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D17',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#0B0D17',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#1A1A2E',
    padding: 20,
    marginBottom: 12,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#7EA0FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0B0D17',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: 'bold',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    color: '#9BA1A6',
    fontSize: 16,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2A2A3E',
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 30,
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#9BA1A6',
    fontSize: 14,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  followButton: {
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#7EA0FF',
  },
  followingButton: {
    backgroundColor: '#7EA0FF',
  },
  actionButtonText: {
    color: '#7EA0FF',
    fontSize: 16,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#FFFFFF',
  },
  postsSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  emptyPosts: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyPostsText: {
    color: '#9BA1A6',
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    color: '#9BA1A6',
    fontSize: 16,
  },
});

