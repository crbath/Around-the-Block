import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';

// Mock comments data (will be replaced with API call)
const MOCK_COMMENTS = {
  '1': [
    { id: '1', username: 'Alex', text: 'I\'ve been meaning to try that place!', time: '1h' },
    { id: '2', username: 'Sam', text: 'Their lattes are amazing!', time: '30m' },
  ],
  '2': [
    { id: '3', username: 'Jordan', text: 'Perfect weather today!', time: '4h' },
    { id: '4', username: 'Casey', text: 'Same here!', time: '3h' },
    { id: '5', username: 'Morgan', text: 'Beautiful day for a walk!', time: '2h' },
  ],
  '3': [
    { id: '6', username: 'Riley', text: 'Count me in!', time: '20h' },
  ],
};

export default function PostDetailScreen({ route, navigation }) {
  const { post } = route.params;
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(post.liked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [imageEnlarged, setImageEnlarged] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    loadComments();
    // Initialize like state from post
    if (post.liked) {
      setLiked(true);
    }
    if (post.likeCount) {
      setLikeCount(post.likeCount);
    }
  }, [post.id]);

  // Fetch comments from backend or use mock data
  async function loadComments() {
    try {
      // Try to fetch comments from backend
      const res = await api.get(`/posts/${post.id}/comments`);
      setComments(res.data);
    } catch (err) {
      // If backend fails, use mock data
      setComments(MOCK_COMMENTS[post.id] || []);
    }
    setLoading(false);
  }

  // Handle like button press
  function handleLike() {
    if (liked) {
      setLiked(false);
      setLikeCount(likeCount - 1);
    } else {
      setLiked(true);
      setLikeCount(likeCount + 1);
    }
    // TODO: Call API to update like status
  }

  // Handle submitting a new comment
  async function handleSubmitComment() {
    if (!commentText.trim()) return;

    setSubmitting(true);
    const newComment = {
      id: Date.now().toString(),
      username: 'You', // TODO: Get from user context/auth
      text: commentText.trim(),
      time: 'now',
    };

    try {
      // Try to post comment to backend
      await api.post(`/posts/${post.id}/comments`, { text: commentText.trim() });
      // Reload comments after successful post
      await loadComments();
      setCommentText('');
    } catch (err) {
      // If backend fails, add comment locally
      setComments([...comments, newComment]);
      setCommentText('');
    }
    setSubmitting(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header with back button and title */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Post Card */}
        <View style={styles.postCard}>
          {/* Header section with user profile icon and info */}
          <View style={styles.postHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {post.username ? post.username[0].toUpperCase() : '?'}
              </Text>
            </View>
            <View>
              <Text style={styles.username}>{post.username}</Text>
              <Text style={styles.timestamp}>{post.time}</Text>
            </View>
          </View>

          {/* Post text content */}
          {post.text && <Text style={styles.postText}>{post.text}</Text>}

          {/* Post image - clickable to enlarge */}
          {post.image && (
            <TouchableOpacity
              onPress={() => setImageEnlarged(true)}
              activeOpacity={0.9}
            >
              <Image source={{ uri: post.image }} style={styles.postImage} />
            </TouchableOpacity>
          )}

          {/* Footer with like and comment buttons */}
          <View style={styles.postFooter}>
            <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
              {liked ? (
                <Ionicons name="heart" size={22} color="#FF6B6B" />
              ) : (
                <Ionicons name="heart-outline" size={22} color="#9BA1A6" />
              )}
              <Text style={styles.actionButtonText}>
                {likeCount > 0 ? likeCount : 'Like'}
              </Text>
            </TouchableOpacity>

            <View style={styles.actionButton}>
              <Ionicons name="chatbubble" size={22} color="#9BA1A6" />
              <Text style={styles.actionButtonText}>
                {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
              </Text>
            </View>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments</Text>
          
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color="#7EA0FF" />
            </View>
          ) : comments.length === 0 ? (
            <Text style={styles.noComments}>No comments yet. Be the first to comment!</Text>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>
                    {comment.username ? comment.username[0].toUpperCase() : '?'}
                  </Text>
                </View>
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentUsername}>{comment.username}</Text>
                    <Text style={styles.commentTime}>{comment.time}</Text>
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Write a comment..."
            placeholderTextColor="#9BA1A6"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSubmitComment}
            style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Enlarged Image Modal */}
      {post.image && (
        <Modal
          visible={imageEnlarged}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setImageEnlarged(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setImageEnlarged(false)}
          >
            <View style={styles.modalContent}>
              {/* Close button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setImageEnlarged(false)}
              >
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Enlarged image */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {}} // Prevent closing when tapping on image
              >
                <Image
                  source={{ uri: post.image }}
                  style={[
                    styles.enlargedImage,
                    {
                      width: screenWidth,
                      height: screenHeight,
                    },
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  scrollContent: {
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: '#1A1A2E',
    padding: 16,
    margin: 16,
    borderRadius: 10,
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7EA0FF',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
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
    marginTop: 2,
  },
  postText: {
    color: '#ECEDEE',
    marginBottom: 12,
    fontSize: 15,
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A3E',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionButtonText: {
    color: '#9BA1A6',
    marginLeft: 6,
    fontSize: 14,
  },
  commentsSection: {
    paddingHorizontal: 16,
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  noComments: {
    color: '#9BA1A6',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#1A1A2E',
    padding: 12,
    borderRadius: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7EA0FF',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  commentTime: {
    color: '#9BA1A6',
    fontSize: 12,
  },
  commentText: {
    color: '#ECEDEE',
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    backgroundColor: '#1A1A2E',
    borderTopWidth: 1,
    borderTopColor: '#2A2A3E',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#0B0D17',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7EA0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#2A2A3E',
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 1,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enlargedImage: {
    width: '100%',
    height: '100%',
  },
});

