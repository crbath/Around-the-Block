import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    try {
      const response = await api.post('/login', { username, password });
      const token = response.data.token;

      await AsyncStorage.setItem('token', token);
      setMessage('Login successful');

      // Navigate to Home (make sure this route exists)
      navigation.navigate('Home');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed';
      setMessage(errorMsg);
      console.error(errorMsg);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/talking_ben.png')} style={styles.logo} />

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your username"
          placeholderTextColor="#ccc"
          value={username}
          onChangeText={setUsername}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#ccc"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity style={styles.altButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

      {message ? <Text style={{ color: 'white', marginTop: 10 }}>{message}</Text> : null}

      <TouchableOpacity style={styles.altButton} onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.signupText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.altButton} onPress={() => {}}>
        <Text style={styles.altButtonText}>Login with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.altButton} onPress={() => {}}>
        <Text style={styles.altButtonText}>Login with Instagram</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D17',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
  },
  label: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#777',
    borderRadius: 6,
    padding: 10,
    color: '#fff',
    marginBottom: 15,
  },
  altButton: {
    backgroundColor: '#2C2C2E',
    paddingVertical: 10,
    width: '100%',
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  altButtonText: {
    color: '#fff',
  },
  signupText: {
    color: '#7EA0FF',
    fontSize: 16,
  },
});
