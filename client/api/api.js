import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// backend url (change this to your machine ip and port)
const BASE_URL = "http://192.168.1.99:5000";

const api = axios.create({
  baseURL: BASE_URL,
});

// automatically add auth token to all requests (important: this is how we authenticate)
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ---- BAR API CALLS ---- //
export const getBars = () => api.get('/bars');

export const getBarAverage = (barId) =>
  api.get(`/bartime/${barId}`);

export const submitBarTime = (barId, time) =>
  api.post(`/bartime`, { barId, time });

// ---- POST API CALLS ---- //
export const createPost = (content, imageUrl) =>
  api.post('/posts', { content, imageUrl });

export const getPosts = () => api.get('/posts');

export const getUserPosts = (userId) =>
  api.get(`/posts/user/${userId}`);

export const likePost = (postId) =>
  api.post(`/posts/${postId}/like`);

export const deletePost = (postId) =>
  api.delete(`/posts/${postId}`);

// ---- COMMENT API CALLS ---- //
export const getComments = (postId) =>
  api.get(`/posts/${postId}/comments`);

export const createComment = (postId, text) =>
  api.post(`/posts/${postId}/comments`, { text });

// ---- USER API CALLS ---- //
export const getProfile = () => api.get('/profile');

export const updateProfile = (profileData) => api.put('/profile', profileData);

// ---- FRIENDS API CALLS ---- //
export const getAllUsers = () => api.get('/users');

export const getFriends = () => api.get('/friends');

export const addFriend = (userId) => api.post(`/friends/${userId}`);

export const removeFriend = (userId) => api.delete(`/friends/${userId}`);

export default api;
