import axios from 'axios';

// Replace with your machine IP address and backend port
// Example: "http://192.168.1.99:5000"
const BASE_URL = "http://192.168.1.99:5000";

const api = axios.create({
  baseURL: BASE_URL,
});

export default api;