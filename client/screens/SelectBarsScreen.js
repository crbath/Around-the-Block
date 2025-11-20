import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import api from "../api/api";

export default function SelectBarsScreen({ navigation }) {
  const [search, setSearch] = useState("");
  const [bars, setBars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBars();
  }, []);

  // Add listener to refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchBars();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchBars = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/bars");
      setBars(response.data);
    } catch (error) {
      console.log("API error:", error.message);
      setError("Failed to load bars. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBars();
    setRefreshing(false);
  };

  // ------ Unified Wait Time Label Function ------
  const getWaitTimeLabel = (waitTime) => {
    if (waitTime === null || waitTime === undefined) return "No data";
    if (waitTime <= 0) return "No wait";
    if (waitTime <= 10) return "Short";
    if (waitTime <= 30) return "Moderate";
    if (waitTime <= 60) return "Long";
    return "Very long";
  };


  const filteredBars = bars.filter(bar =>
    bar.name && bar.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderBar = ({ item }) => {
    const waitTime = item.avgTime !== null && item.avgTime !== undefined ? item.avgTime : 0;
    const barFillPercentage = Math.min((waitTime / 120) * 100, 100); // Scale to 120 minutes max

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('BarProfile', { bar: item })}
        style={styles.barContainer}
      >
        <View style={styles.initialsCircle}>
          <Text style={styles.initialText}>
            {item.name ? item.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase() : '??'}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.barName}>{item.name || 'Unknown Bar'}</Text>

          {/* WAIT TIME LABEL */}
          <Text style={styles.waitTime}>
            {item.avgTime !== null && item.avgTime !== undefined 
              ? `${Math.round(item.avgTime)} min - ${getWaitTimeLabel(item.avgTime)}`
              : "No data"}
          </Text>


          {/* WAIT TIME BAR - Scaled to 120 minutes */}
          <View style={styles.waitBarBackground}>
            <View 
              style={[
                styles.waitBarFill, 
                { 
                  width: `${barFillPercentage}%`,
                  backgroundColor: waitTime > 8 ? '#FF6B6B' : waitTime > 5 ? '#FFB347' : '#6A4CF3'
                }
              ]} 
            />
          </View>
          
          {/* Max time indicator */}
          {item.avgTime !== null && item.avgTime !== undefined && (
            <Text style={styles.maxTimeText}>0 min — 120 min</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Select Bars</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#7EA0FF" />
          <Text style={styles.loadingText}>Loading bars...</Text>
        </View>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Select Bars</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchBars}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Select Bars</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={24} 
            color="#7EA0FF" 
            style={refreshing ? styles.refreshingIcon : null}
          />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search"
        placeholderTextColor="#CFCFCF"
        value={search}
        onChangeText={setSearch}
      />

      {filteredBars.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>
            {bars.length === 0 
              ? "No bars found. Add bars from the Maps screen!" 
              : "No bars match your search."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBars}
          renderItem={renderBar}
          keyExtractor={(item, index) => item.id ? item.id.toString() : `bar-${index}`}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#7EA0FF"
              colors={["#7EA0FF"]}
            />
          }
        />
      )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    padding: 8,
  },
  refreshingIcon: {
    opacity: 0.5,
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
    borderRadius: 10,
    marginBottom: 2,
  },
  waitBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  maxTimeText: {
    fontSize: 10,
    color: '#DAD3F5',
    marginTop: 2,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#7EA0FF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});