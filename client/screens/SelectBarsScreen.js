import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from "react-native";
import api from "../api/api";

export default function SelectBarsScreen({ navigation }) {
  const [search, setSearch] = useState("");
  const [bars, setBars] = useState([]);

  useEffect(() => {
    const fetchBars = async () => {
      try {
        const response = await api.get("/bars");
        setBars(response.data);
      } catch (error) {
        console.log("API error:", error.message);
      }
    };

    fetchBars();
  }, []);


  const filteredBars = bars.filter(bar =>
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

        {/* WAIT TIME LABEL */}
        <Text style={styles.waitTime}>
          {item.avgTime ? `${Math.round(item.avgTime)} min` : "No data"}
        </Text>

        {/* WAIT TIME BAR */}
        <View style={styles.waitBarBackground}>
          <View style={[styles.waitBarFill, { width: `${item.avgTime ? item.avgTime : 1}%` }]} />
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
        keyExtractor={item => item._id}
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
  waitTime: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4
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
