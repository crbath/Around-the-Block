import axios from 'axios';

// Replace with your IP address
const BASE_URL = "http://192.168.0.194:5000";

const api = axios.create({
  baseURL: BASE_URL,
});

export default api;