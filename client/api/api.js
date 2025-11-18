import axios from 'axios';

// Replace with your machine IP address and backend port
// Example: "http://192.168.1.99:5000"
const BASE_URL = "http://192.168.0.194:5000";

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
