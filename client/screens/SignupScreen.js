import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Image } from 'react-native';
import api from '../api/api';

export default function SignupScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [birthday, setBirthday] = useState('');
    const [message, setMessage] = useState('');

    const handleSignup = async () => {
      if (password !== confirmPassword) {
        setMessage('Passwords do not match');
        return;
      }

      try {
        const response = await api.post('/signup', { username, password, birthday });
        setMessage(response.data.message);
        navigation.navigate('Login');
      } catch (error) {
        setMessage(error.response?.data?.message || 'Signup failed');
        console.error(error);
      }
    };

    return (
        <View style={styles.container}>
            {/* Placeholder, replace with actual logo image */}
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
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="#ccc"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />
                <Text style={styles.label}>Birthday</Text>
                <TextInput
                    style={styles.input}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor="#ccc"
                    value={birthday}
                    onChangeText={setBirthday}
                />
            </View>
            <TouchableOpacity style={styles.createButton} onPress={handleSignup}>
                <Text style={styles.createButtonText}>Create Account</Text>
            </TouchableOpacity>

            {message ? <Text style={{ color: 'white', marginTop: 10 }}>{message}</Text> : null}

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Back to Log In</Text>
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
    createButton: {
      backgroundColor: '#7EA0FF',
      paddingVertical: 10,
      width: '100%',
      borderRadius: 6,
      marginTop: 10,
      alignItems: 'center',
    },
    createButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    link: {
      color: '#7EA0FF',
      marginTop: 20,
      fontSize: 16,
    },
  });