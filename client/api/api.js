import axios from 'axios';

// Replace with your IP address
const BASE_URL = "http://192.168.1.11:5000";

const api = axios.create({
  baseURL: BASE_URL,
});

export default api;