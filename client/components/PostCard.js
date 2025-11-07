import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// PostCard component displays a single post in the feed
export default function PostCard({ post }) {
  // state to track if this post is liked and the like count
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // component first loads
  React.useEffect(() => {
    if (post.liked) {
      setLiked(true);
    }
    if (post.likeCount) {
      setLikeCount(post.likeCount);
    }
    if (post.commentCount) {
      // we'll show this but not make it interactive yet
    }
  }, []);

  // handle when user clicks like button
  function handleLike() {
    if (liked) {
      // if already liked, unlike it
      setLiked(false);
      setLikeCount(likeCount - 1);
    } else {
      // if not liked, like it
      setLiked(true);
      setLikeCount(likeCount + 1);
    }
  }

  // user clicks comment button
  function handleComment() {
    console.log('comment button pressed');
    // TODO: add comment functionality later
  }

  return (
    <View style={styles.card}>
      {/* header section with user profile icon and info */}
      <View style={styles.header}>
        {/* profile circle with first letter of username */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {post.username ? post.username[0].toUpperCase() : '?'}
          </Text>
        </View>
        {/* username and timestamp (?) */}
        <View>
          <Text style={styles.username}>{post.username}</Text>
          <Text style={styles.timestamp}>{post.time}</Text>
        </View>
      </View>

      {/* post text content - only show if post has text */}
      {post.text && <Text style={styles.text}>{post.text}</Text>}

      {/* post image - only show if post has an image */}
      {post.image && <Image source={{ uri: post.image }} style={styles.image} />}

      {/* footer with like and comment buttons */}
      <View style={styles.footer}>
        {/* like button */}
        <TouchableOpacity onPress={handleLike} style={styles.button}>
          {liked ? (
            // show filled heart if liked
            <Ionicons name="heart" size={20} color="#FF6B6B" />
          ) : (
            // show outline heart if not liked
            <Ionicons name="heart-outline" size={20} color="#9BA1A6" />
          )}
          <Text style={styles.buttonText}>
            {likeCount > 0 ? likeCount : 'Like'}
          </Text>
        </TouchableOpacity>

        {/* comment button */}
        <TouchableOpacity onPress={handleComment} style={styles.button}>
          <Ionicons name="chatbubble-outline" size={20} color="#9BA1A6" />
          <Text style={styles.buttonText}>
            {post.commentCount > 0 ? post.commentCount : 'Comment'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
