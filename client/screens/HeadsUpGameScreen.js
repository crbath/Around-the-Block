import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HeadsUpGameScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Heads Up Game</Text>
      <Text style={styles.subtitle}>Get ready to play!</Text>
      
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
