import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPosts } from '../api/api';
import PostCard from '../components/PostCard';

// mock posts
const MOCK_POSTS = [
  {
    id: '1',
    username: 'Kate',
    time: '2h',
    text: 'Just tried the new coffee shop downtown. Highly recommend!',
    image: 'https://tse1.explicit.bing.net/th/id/OIP.xSBmAXsH90Brm9WxkhSMzAHaHa?w=500&h=500&rs=1&pid=ImgDetMain&o=7&rm=3',
    liked: false,
    likeCount: 5,
    commentCount: 2,
  },
  {
    id: '2',
    username: 'Ben',
    time: '5h',
    text: 'Great day for a walk around the block.',
    image: 'https://cdn.wallpapersafari.com/91/83/pOKSew.jpg',
    liked: true,
    likeCount: 12,
    commentCount: 3,
  },
  {
    id: '3',
    username: 'Taylor',
    time: '1d',
    text: 'Who wants to join trivia night tomorrow?',
    liked: false,
    likeCount: 8,
    commentCount: 1,
  },
];

export default function FeedScreen({ navigation }) {
  // track posts, loading status, and refresh status
  const [posts, setPosts] = useState([]); // posts to display
  const [loading, setLoading] = useState(true); // wgether we're loading data
  const [refreshing, setRefreshing] = useState(false); // whether or not a user is pulling to refresh

  // useEffect runs when component first loads
  useEffect(() => {
    // load posts when screen loads
    loadPosts();
  }, []);

  // fetch posts from backend or use mock data
  async function loadPosts() {
    try {
      // try to get posts from backend API
      const res = await getPosts();
      setPosts(res.data);
    } catch (err) {
      console.error('Error loading posts:', err);
      // if backend fails, use mock data
      setPosts(MOCK_POSTS);
    }
    setLoading(false); // done loading
  }

  // function called when user pulls down to refresh
  async function handleRefresh() {
    setRefreshing(true); // Show refresh spinner
    await loadPosts(); // Reload posts
    setRefreshing(false); // Hide refresh spinner
  }

  // loading spinner while data is being fetched
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7EA0FF" />
      </View>
    );
  }

  // show feed with posts
  return (
    <View style={styles.container}>
      {/* header with title and buttons */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <View style={styles.headerButtons}>
          {/* button to create new post */}
          <TouchableOpacity 
            onPress={() => navigation.navigate('CreatePost')}
            style={styles.createButton}
          >
            <Ionicons name="add-circle-outline" size={28} color="#7EA0FF" />
          </TouchableOpacity>
          {/* button to navigate to friends screen */}
          <TouchableOpacity 
            onPress={() => navigation.navigate('Friends')}
            style={styles.friendsButton}
          >
            <Ionicons name="people" size={28} color="#7EA0FF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* list of posts - FlatList efficiently renders long lists */}
      <FlatList
        data={posts} // posts
        keyExtractor={(item) => item.id} // unique key for each post
        renderItem={({ item }) => {
          // render each post using PostCard component
          // Pass navigation prop so PostCard can navigate to detail screen
          return <PostCard post={{ ...item, navigation }} />;
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#7EA0FF" />
        }
      />
    </View>
  );
}

// styles for the feed screen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D17',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0D17',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  createButton: {
    padding: 8,
  },
  friendsButton: {
    padding: 8,
  },
});
