import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (post.liked) setLiked(true);
    if (post.likeCount) setLikeCount(post.likeCount);
  }, []);

  function handleLike() {
    setLiked((prev) => !prev);
    setLikeCount((count) => (liked ? count - 1 : count + 1));
  }

  function handlePostPress() {
    if (post.navigation) {
      post.navigation.navigate('PostDetail', { post });
    }
  }

  return (
    <TouchableOpacity style={styles.card} onPress={handlePostPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{post.username ? post.username[0].toUpperCase() : '?'}</Text>
        </View>
        <View>
          <Text style={styles.username}>{post.username}</Text>
          <Text style={styles.timestamp}>{post.time}</Text>
        </View>
      </View>

      {post.text && <Text style={styles.text}>{post.text}</Text>}
      {post.image && <Image source={{ uri: post.image }} style={styles.image} />}

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleLike} style={styles.button}>
          {liked ? <Ionicons name="heart" size={20} color="#FF6B6B" /> : <Ionicons name="heart-outline" size={20} color="#9BA1A6" />}
          <Text style={styles.buttonText}>{likeCount > 0 ? likeCount : 'Like'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (post.navigation) {
              post.navigation.navigate('PostDetail', { post });
            }
          }}
          style={styles.button}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#9BA1A6" />
          <Text style={styles.buttonText}>{post.commentCount > 0 ? post.commentCount : 'Comment'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#1A1A2E', padding: 16, margin: 12, borderRadius: 10 },
  header: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7EA0FF', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  username: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  timestamp: { color: '#9BA1A6', fontSize: 12 },
  text: { color: '#ECEDEE', marginBottom: 12, fontSize: 15 },
  image: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12 },
  footer: { flexDirection: 'row', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2A2A3E' },
  button: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  buttonText: { color: '#9BA1A6', marginLeft: 6, fontSize: 14 },
});
