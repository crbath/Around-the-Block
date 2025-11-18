import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';

const sampleBars = [
  { id: '1', name: 'Kollege Klub', waitTime: 75 },
  { id: '2', name: 'Red Rock', waitTime: 60 },
  { id: '3', name: 'Whiskey Jacks', waitTime: 90 },
  { id: '4', name: 'State Street Brats', waitTime: 40 },
  { id: '5', name: 'Double U', waitTime: 50 },
];

export default function SelectBarsScreen({ navigation }) {
  const [search, setSearch] = useState('');

  const filteredBars = sampleBars.filter(bar =>
    bar.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderBar = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('BarProfile', { bar: item })}
      style={styles.barContainer}
    >
      <View style={styles.initialsCircle}>
        <Text style={styles.initialText}>
          {item.name.split(' ').map(word => word[0]).join('').substring(0, 2)}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.barName}>{item.name}</Text>
        <View style={styles.waitBarBackground}>
          <View style={[styles.waitBarFill, { width: `${item.waitTime}%` }]} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Bars</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search"
        placeholderTextColor="#CFCFCF"
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredBars}
        renderItem={renderBar}
        keyExtractor={item => item.id}
        style={{ width: '100%' }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#0B0D17'
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20
  },
  searchInput: {
    width: '100%',
    backgroundColor: '#1A1D29',
    padding: 10,
    borderRadius: 50,
    fontSize: 16,
    marginBottom: 20,
    color: '#fff'
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5B4DB7',
    marginBottom: 15,
    padding: 15,
    borderRadius: 20
  },
  initialsCircle: {
    width: 45,
    height: 45,
    borderRadius: 100,
    backgroundColor: '#DAD3F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  initialText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4A3AA7'
  },
  barName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6
  },
  waitBarBackground: {
    width: '100%',
    height: 10,
    backgroundColor: '#C3B6F2',
    borderRadius: 10
  },
  waitBarFill: {
    height: '100%',
    backgroundColor: '#6A4CF3',
    borderRadius: 10
  }
});
