import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { likePost } from '../../api/api';

export default function PostCard({ post, navigation }) {
  const [liked, setLiked] = useState(post.liked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);

  // update state when post prop changes (important: syncs with refreshed data)
  useEffect(() => {
    if (post.liked !== undefined) setLiked(post.liked);
    if (post.likeCount !== undefined) setLikeCount(post.likeCount);
  }, [post.liked, post.likeCount]);

  // handle like button click (important: calls API to save like to database)
  async function handleLike() {
    const previousLiked = liked;
    const previousLikeCount = likeCount;
    
    try {
      // optimistically update UI
      const newLiked = !liked;
      setLiked(newLiked);
      setLikeCount(newLiked ? likeCount + 1 : Math.max(0, likeCount - 1));

      // call API to save like
      const response = await likePost(post.id);
      
      // update with server response (important: ensures UI matches server state)
      if (response.data) {
        const serverLikes = response.data.likes !== undefined ? response.data.likes : likeCount;
        const serverLiked = response.data.liked !== undefined ? response.data.liked : newLiked;
        setLikeCount(serverLikes);
        setLiked(serverLiked);
      }
    } catch (error) {
      // revert on error
      setLiked(previousLiked);
      setLikeCount(previousLikeCount);
      console.error('Error liking post:', error);
    }
  }

  // handle when user clicks on the post card (important: navigate to PostDetail, which is in FeedStack)
  function handlePostPress() {
    if (!navigation) return;
    
    // check navigation state to see which navigator we're in
    const state = navigation.getState();
    const currentRoute = state?.routes?.[state?.index];
    const routeName = currentRoute?.name;
    
    // if we're in FeedStack (FeedMain, Friends, PostDetail, FriendProfile, CreatePost), navigate directly
    if (routeName === 'FeedMain' || routeName === 'Friends' || routeName === 'PostDetail' || routeName === 'FriendProfile' || routeName === 'CreatePost') {
      navigation.navigate('PostDetail', { post, fromProfile: false });
    } else {
      // we're in Profile tab or another tab, need to navigate to Feed tab first
      // pass fromProfile: true so PostDetail knows to go back to Profile
      navigation.navigate('Feed', { 
        screen: 'PostDetail', 
        params: { post, fromProfile: true } 
      });
    }
  }

  return (
    <View style={styles.card}>
      {/* clickable header/content area */}
      <TouchableOpacity onPress={handlePostPress} activeOpacity={0.8}>
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
      </TouchableOpacity>

      {/* footer with like and comment buttons (important: separate from card's onPress) */}
      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={handleLike} 
          style={styles.button}
          activeOpacity={0.7}
        >
          {liked ? <Ionicons name="heart" size={20} color="#FF6B6B" /> : <Ionicons name="heart-outline" size={20} color="#9BA1A6" />}
          <Text style={styles.buttonText}>{likeCount > 0 ? likeCount : 'Like'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            if (navigation) {
              navigation.navigate('PostDetail', { post });
            }
          }}
          style={styles.button}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#9BA1A6" />
          <Text style={styles.buttonText}>{post.commentCount > 0 ? post.commentCount : 'Comment'}</Text>
        </TouchableOpacity>
      </View>
    </View>
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
