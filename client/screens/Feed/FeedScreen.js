import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';
import PostCard from '../../components/feature/PostCard';

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
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const res = await api.get('/posts');
      setPosts(res.data);
    } catch (err) {
      setPosts(MOCK_POSTS);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7EA0FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Friends')} style={styles.friendsButton}>
          <Ionicons name="people" size={28} color="#7EA0FF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={{ ...item, navigation }} />}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreatePost')} activeOpacity={0.8}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D17' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0D17' },
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: '#0B0D17', position: 'relative' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  friendsButton: { padding: 8, position: 'absolute', right: 16 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#7EA0FF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
});
