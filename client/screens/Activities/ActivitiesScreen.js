import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function ActivitiesScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activities</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('HeadsUpGame')}
      >
        <Text style={styles.buttonText}>Heads Up Game</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('Trivia')}
      >
        <Text style={styles.buttonText}>Trivia</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('TalkingBenMinigame')}
      >
        <Text style={styles.buttonText}>Talking Ben Minigame</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('Beer')}
      >
        <Text style={styles.buttonText}>Beer</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#7EA0FF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});