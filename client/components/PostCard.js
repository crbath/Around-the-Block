  import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { likePost } from '../api/api';

// displays a single post card in the feed
export default function PostCard({ post, navigation }) {
  // track if this post is liked and the like count (important: keeps state in sync with backend)
  const [liked, setLiked] = useState(post.liked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);

  // update state when post data changes (important: syncs with backend data)
  React.useEffect(() => {
    if (post.liked !== undefined) {
      setLiked(post.liked);
    }
    if (post.likeCount !== undefined) {
      setLikeCount(post.likeCount);
    }
  }, [post.liked, post.likeCount]);

  // handle like button click (important: optimistic UI update, reverts on error)
  async function handleLike() {
    // save previous state so we can revert if api call fails
    const previousLiked = liked;
    const previousLikeCount = likeCount;
    
    try {
      // update UI immediately (optimistic update)
      const newLiked = !liked;
      setLiked(newLiked);
      setLikeCount(newLiked ? likeCount + 1 : Math.max(0, likeCount - 1));

      // call backend to actually save the like
      await likePost(post.id);
    } catch (error) {
      // revert UI if api call failed
      setLiked(previousLiked);
      setLikeCount(previousLikeCount);
      console.error('Error liking post:', error);
    }
  }

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation?.navigate('PostDetail', { post })} 
      activeOpacity={0.8}
    >
      {/* header: profile pic or initial, username, timestamp */}
      <View style={styles.header}>
        {/* show profile pic if available, otherwise show first letter of username */}
        {post.profilePicUrl ? (
          <Image source={{ uri: post.profilePicUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {post.username ? post.username[0].toUpperCase() : '?'}
            </Text>
          </View>
        )}
        <View>
          <Text style={styles.username}>{post.username}</Text>
          <Text style={styles.timestamp}>{post.time}</Text>
        </View>
      </View>

      {/* post text (only render if exists) */}
      {post.text && <Text style={styles.text}>{post.text}</Text>}

      {/* post image (only render if exists) */}
      {post.image && <Image source={{ uri: post.image }} style={styles.image} />}

      {/* footer: like and comment buttons */}
      <View style={styles.footer}>
        {/* like button - filled heart if liked, outline if not */}
        <TouchableOpacity onPress={handleLike} style={styles.button}>
          {liked ? (
            <Ionicons name="heart" size={20} color="#FF6B6B" />
          ) : (
            <Ionicons name="heart-outline" size={20} color="#9BA1A6" />
          )}
          <Text style={styles.buttonText}>
            {likeCount > 0 ? likeCount : 'Like'}
          </Text>
        </TouchableOpacity>

        {/* comment button - navigates to post detail screen */}
        <TouchableOpacity 
          onPress={() => navigation?.navigate('PostDetail', { post })} 
          style={styles.button}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#9BA1A6" />
          <Text style={styles.buttonText}>
            {post.commentCount > 0 ? post.commentCount : 'Comment'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A2E',
    padding: 16,
    margin: 12,
    borderRadius: 10,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7EA0FF',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  username: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    color: '#9BA1A6',
    fontSize: 12,
  },
  text: {
    color: '#ECEDEE',
    marginBottom: 12,
    fontSize: 15,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A3E',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  buttonText: {
    color: '#9BA1A6',
    marginLeft: 6,
    fontSize: 14,
  },
});
