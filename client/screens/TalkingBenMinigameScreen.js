import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

export default function TalkingBenMinigameScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Talking Ben Minigame</Text>
      <Image source={require('../assets/images/talking_ben.png')} style={styles.benImage} />
      <Text style={styles.subtitle}>Play with Talking Ben!</Text>
      
      <TouchableOpacity style={styles.startButton}>
        <Text style={styles.buttonText}>Start Game</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0D17',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  benImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  subtitle: {
    color: '#ccc',
    fontSize: 18,
    marginBottom: 40,
  },
  startButton: {
    backgroundColor: '#7EA0FF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginVertical: 10,
  },
  backButton: {
    backgroundColor: '#2C2C2E',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
