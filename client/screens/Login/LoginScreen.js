import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/api';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

// complete auth session in web browser
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await api.post('/login', { username, password });
      const token = response.data.token;
      const userId = response.data.userId; // Assuming backend returns userId
      console.log(JSON.stringify(response.data));

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(username));
      if (userId) {
        await AsyncStorage.setItem('userId', userId);
      }
      setMessage('Login successful');

      navigation.navigate('Home');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed';
      setMessage(errorMsg);
      console.error(errorMsg);
    }
  };

  // facebook login handler - opens facebook oauth popup for demo
  const handleFacebookLogin = async () => {
    try {
      setOauthLoading(true);
      
      // get facebook app id from environment or use placeholder
      const facebookAppId = Constants.expoConfig?.extra?.EXPO_PUBLIC_FACEBOOK_APP_ID || 
                           process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || 
                           'YOUR_FACEBOOK_APP_ID';
      
      // create redirect uri for oauth callback
      const redirectUri = AuthSession.makeRedirectUri({
        useProxy: true,
      });

      // facebook oauth discovery endpoints
      const discovery = {
        authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
        tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
      };

      // create auth request
      const request = new AuthSession.AuthRequest({
        clientId: facebookAppId,
        scopes: ['public_profile', 'email'],
        responseType: AuthSession.ResponseType.Token,
        redirectUri,
        usePKCE: false,
      });

      // prompt user with facebook login
      const result = await request.promptAsync(discovery, {
        useProxy: true,
      });

      if (result.type === 'success') {
        // for demo purposes, just show success message
        // in full implementation, you would send the token to your backend
        Alert.alert('Facebook Login', 'Login successful! (Demo mode)');
      } else if (result.type === 'cancel') {
        Alert.alert('Facebook Login', 'Login cancelled');
      } else {
        Alert.alert('Facebook Login', 'Login failed. Please try again.');
      }
    } catch (error) {
      Alert.alert('Facebook Login', 'An error occurred. Please try again.');
    } finally {
      setOauthLoading(false);
    }
  };

  // instagram login handler - opens instagram oauth popup for demo
  // note: instagram uses facebook oauth system, so it will show facebook login first
  // then request instagram permissions - this is the standard way instagram login works
  const handleInstagramLogin = async () => {
    try {
      setOauthLoading(true);
      
      // get facebook app id (instagram requires a facebook app)
      const facebookAppId = Constants.expoConfig?.extra?.EXPO_PUBLIC_FACEBOOK_APP_ID || 
                           process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || 
                           'YOUR_FACEBOOK_APP_ID';
      
      // create redirect uri for oauth callback
      const redirectUri = AuthSession.makeRedirectUri({
        useProxy: true,
      });

      // instagram uses facebook oauth endpoints
      // the login screen will show facebook, but will request instagram permissions
      const discovery = {
        authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
        tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
      };

      // create auth request with instagram scopes
      // this will show facebook login, then request instagram access
      const request = new AuthSession.AuthRequest({
        clientId: facebookAppId,
        scopes: ['instagram_basic', 'instagram_content_publish', 'public_profile'],
        responseType: AuthSession.ResponseType.Token,
        redirectUri,
        usePKCE: false,
      });

      // prompt user - will show facebook login screen (this is normal for instagram)
      const result = await request.promptAsync(discovery, {
        useProxy: true,
      });

      if (result.type === 'success') {
        // for demo purposes, just show success message
        // in full implementation, you would send the token to your backend
        Alert.alert('Instagram Login', 'Login successful! (Demo mode)');
      } else if (result.type === 'cancel') {
        Alert.alert('Instagram Login', 'Login cancelled');
      } else {
        Alert.alert('Instagram Login', 'Login failed. Please try again.');
      }
    } catch (error) {
      Alert.alert('Instagram Login', 'An error occurred. Please try again.');
    } finally {
      setOauthLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/talking_ben.png')} style={styles.logo} />

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

      <View style={styles.oauthButtonContainer}>
        <TouchableOpacity 
          style={[styles.oauthButton, styles.oauthButtonHalf]} 
          onPress={handleFacebookLogin}
          disabled={oauthLoading}
        >
          <Ionicons name="logo-facebook" size={18} color="#fff" />
          <Text style={styles.oauthButtonText}>Facebook</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.oauthButton, styles.oauthButtonHalf]} 
          onPress={handleInstagramLogin}
          disabled={oauthLoading}
        >
          <Ionicons name="logo-instagram" size={18} color="#fff" />
          <Text style={styles.oauthButtonText}>Instagram</Text>
        </TouchableOpacity>
      </View>
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
  oauthButtonContainer: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 10,
    gap: 10,
  },
  oauthButton: {
    backgroundColor: '#2C2C2E',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  oauthButtonHalf: {
    flex: 1,
  },
  oauthButtonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
  },
});
