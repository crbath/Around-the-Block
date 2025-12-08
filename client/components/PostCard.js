  import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { likePost } from '../api/api';

// PostCard component displays a single post in the feed
export default function PostCard({ post, navigation }) {
  // state to track if this post is liked and the like count
  const [liked, setLiked] = useState(post.liked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);

  // component first loads
  React.useEffect(() => {
    if (post.liked !== undefined) {
      setLiked(post.liked);
    }
    if (post.likeCount !== undefined) {
      setLikeCount(post.likeCount);
    }
  }, [post.liked, post.likeCount]);

  // handle when user clicks like button (important: calls API to save like to database)
  async function handleLike() {
    console.log('=== POSTCARD HANDLELIKE CALLED ===');
    console.log('post.id:', post.id, 'post object:', post);
    console.log('current liked:', liked, 'current likeCount:', likeCount);
    
    // Store previous state for potential revert
    const previousLiked = liked;
    const previousLikeCount = likeCount;
    
    try {
      // Optimistically update UI
      const newLiked = !liked;
      setLiked(newLiked);
      setLikeCount(newLiked ? likeCount + 1 : Math.max(0, likeCount - 1));
      console.log('UI updated optimistically - newLiked:', newLiked, 'newCount:', newLiked ? likeCount + 1 : Math.max(0, likeCount - 1));

      // Call API to update like
      console.log('Calling likePost API for post.id:', post.id);
      if (!post.id) {
        console.error('ERROR: post.id is undefined!');
        throw new Error('Post ID is missing');
      }
      
      const response = await likePost(post.id);
      console.log('Like API response received:', response.data);
      
      // update with server response (important: ensures UI matches server state)
      if (response.data) {
        // note: use explicit undefined check so 0 doesn't fall back
        const serverLikes = response.data.likes !== undefined ? response.data.likes : likeCount;
        const serverLiked = response.data.liked !== undefined ? response.data.liked : newLiked;
        setLikeCount(serverLikes);
        setLiked(serverLiked);
        console.log('State updated from server - likes:', serverLikes, 'liked:', serverLiked);
      }
      console.log('=== POSTCARD HANDLELIKE SUCCESS ===');
    } catch (error) {
      // Revert on error
      console.error('=== POSTCARD HANDLELIKE ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setLiked(previousLiked);
      setLikeCount(previousLikeCount);
      console.log('Reverted to previous state');
    }
  }

  // user clicks comment button
  function handleComment() {
    console.log('comment button pressed');
    // TODO: add comment functionality later
  }

  // handle when user clicks on the post card
  function handlePostPress() {
    if (navigation) {
      navigation.navigate('PostDetail', { post });
    }
  }

  return (
    <View style={styles.card}>
      {/* clickable header/content area */}
      <TouchableOpacity onPress={handlePostPress} activeOpacity={0.8}>
        {/* header section with user profile icon and info */}
        <View style={styles.header}>
          {/* profile circle with first letter of username or profile pic */}
          {post.profilePicUrl ? (
            <Image source={{ uri: post.profilePicUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {post.username ? post.username[0].toUpperCase() : '?'}
              </Text>
            </View>
          )}
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
      </TouchableOpacity>

      {/* footer with like and comment buttons (important: separate from card's onPress) */}
      <View style={styles.footer}>
        {/* like button */}
        <TouchableOpacity 
          onPressIn={() => console.log('Like button pressed IN - post.id:', post.id)}
          onPress={handleLike} 
          style={styles.button}
          activeOpacity={0.7}
        >
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

        {/* comment button - navigate to detail screen */}
        <TouchableOpacity 
          onPress={() => {
            if (navigation) {
              navigation.navigate('PostDetail', { post });
            } else {
              handleComment();
            }
          }}
          style={styles.button}
          activeOpacity={0.7}
        >
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
    padding: 8,
    minHeight: 44, // minimum touch target size
  },
  buttonText: {
    color: '#9BA1A6',
    marginLeft: 6,
    fontSize: 14,
  },
});
