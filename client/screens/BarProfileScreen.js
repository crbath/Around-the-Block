import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BarProfileScreen({ route, navigation }) {
  const { bar } = route.params;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{bar.name}</Text>
        <Ionicons name="heart-outline" size={28} color="#fff" />
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center' }}>
        {/* Bar Photo Placeholder */}
        <Image
          source={{ uri: bar.image || 'https://via.placeholder.com/150' }}
          style={styles.image}
        />

        {/* Buttons Row */}
        <View style={styles.buttonRow}>
          <View style={styles.infoButton}><Text style={styles.infoText}>OPEN</Text></View>
          <View style={styles.infoButton}><Text style={styles.infoText}>10–15 min</Text></View>
          <View style={styles.infoButton}><Text style={styles.infoText}>MAP</Text></View>
        </View>

        {/* Deals Box */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>DEALS</Text>
          <Text style={styles.cardText}>{bar.deals || '$1 Fishbowl'}</Text>
        </View>

        {/* Hours Box */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hours</Text>
          <Text style={styles.cardText}>{bar.hours || '24/7'}</Text>
        </View>

        {/* Memories Box */}
        <View style={styles.card}>
          <Text style={styles.cardText}>No memories...{'\n'}yet.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D17',
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#fff'
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 100,
    marginVertical: 20,
    backgroundColor: '#333'
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 20
  },
  infoButton: {
    backgroundColor: '#E5E0FF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 5
  },
  infoText: {
    fontWeight: 'bold',
    color: '#000'
  },
  card: {
    backgroundColor: '#D4C8FF',
    width: '100%',
    borderRadius: 30,
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 5,
    color: '#000'
  },
  cardText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#000'
  }
});
