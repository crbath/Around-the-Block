import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MapsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Maps Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0D17',
  },
  text: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
