import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const LAN_IP = Constants.manifest2?.extra?.expoClient?.hostUri?.split(':')[0];
const BASE_URL = `http://${LAN_IP}:5000`;
const api = axios.create({
  baseURL: BASE_URL,
});

// Add token to requests automatically
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    console.log('Full URL:', config.baseURL + config.url);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token added to request');
    } else {
      console.log('No token found');
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.config?.method?.toUpperCase(), error.config?.url);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
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

export const updateProfile = (data) => api.put('/profile', data);

// ---- FRIENDS API CALLS ---- //
export const getFriends = () => api.get('/friends');

export const addFriend = (username) => api.post('/friends', { username });

export const getAllUsers = () => api.get('/users');

export default api;
