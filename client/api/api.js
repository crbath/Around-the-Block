import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your machine IP address and backend port
// Example: "http://192.168.1.99:5000"
<<<<<<< HEAD
const BASE_URL = "http://192.168.1.99:5000";
=======
const BASE_URL = "http://192.168.1.11:5000";
>>>>>>> origin/main

const api = axios.create({
  baseURL: BASE_URL,
});

// Add token to requests automatically
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

// ---- USER API CALLS ---- //
export const getProfile = () => api.get('/profile');

export default api;
