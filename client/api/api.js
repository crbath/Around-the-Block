import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const LAN_IP = Constants.manifest2?.extra?.expoClient?.hostUri?.split(':')[0];
const BASE_URL = `http://${LAN_IP}:5000`;
const api = axios.create({
  baseURL: BASE_URL,
});

// ---- BAR API CALLS ---- //
export const getBars = () => api.get('/bars');

export const getBarAverage = (barId) =>
  api.get(`/bartime/${barId}`);

export const submitBarTime = (barId, time) =>
  api.post(`/bartime`, { barId, time });

export default api;
