import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BarProfileScreen({ route, navigation }) {
  const { bar } = route.params;
  const [avgTime, setAvgTime] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [timeValue, setTimeValue] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBarData();
  }, []);

  const fetchBarData = async () => {
    try {
      setLoading(true);
      const result = await api.get(`/bartime/${bar.id}`);
      setAvgTime(result.data.average);
    } catch (err) {
      console.log("Error fetching avg time", err);
      setAvgTime(null);
    } finally {
      setLoading(false);
    }
  };

  const submitTime = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      await api.post(
        '/bartime',
        {
          barId: bar.id.toString(),
          barName: bar.name,
          latitude: bar.latitude,
          longitude: bar.longitude,
          time: timeValue
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      Alert.alert("Success!", "Wait time submitted successfully");
      setModalVisible(false);

      await fetchBarData();
    } catch (err) {
      console.log("Error submitting time:", err);
      Alert.alert("Error", err.response?.data?.message || "Failed to submit wait time");
    } finally {
      setLoading(false);
    }
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
        <Image source={{ uri: bar.image || 'https://via.placeholder.com/150' }} style={styles.image} />

        {/* BUTTONS */}
        <View style={styles.buttonRow}>
          <View style={styles.infoButton}><Text style={styles.infoText}>OPEN</Text></View>
          
          {/* Clickable wait time button */}
          <TouchableOpacity 
            style={[styles.infoButton, styles.waitTimeButton]} 
            onPress={() => setModalVisible(true)}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.infoText}>
                {avgTime !== null && avgTime !== undefined
                  ? `${Math.round(avgTime)} min`
                  : "Add Time"}
              </Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.infoButton}><Text style={styles.infoText}>MAP</Text></View>
        </View>

        {/* Wait time description */}
        {avgTime !== null && avgTime !== undefined && (
          <Text style={styles.waitDescription}>
            Wait time: {getWaitTimeLabel(avgTime)}
          </Text>
        )}

        {/* Other info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>DEALS</Text>
          <Text style={styles.cardText}>{bar.deals || '$1 Fishbowl'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hours</Text>
          <Text style={styles.cardText}>{bar.hours || '24/7'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardText}>No memories...{'\n'}yet.</Text>
        </View>
      </ScrollView>

      {/* WAIT TIME INPUT MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>How long is the line?</Text>
            <Text style={styles.modalSubtitle}>Help others know the wait time</Text>
            
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={120}
                step={5}
                value={timeValue}
                onValueChange={setTimeValue}
                minimumTrackTintColor="#7EA0FF"
                maximumTrackTintColor="#555"
                thumbTintColor="#7EA0FF"
              />
              <Text style={styles.timeValueText}>{timeValue} min</Text>
              <Text style={styles.timeLabelText}>{getWaitTimeLabel(timeValue)}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]} 
                onPress={submitTime}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 10
  },
  infoButton: {
    backgroundColor: '#E5E0FF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 5
  },
  waitTimeButton: {
    minWidth: 80,
    alignItems: 'center',
  },
  infoText: {
    fontWeight: 'bold',
    color: '#000'
  },
  waitDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 15,
    fontStyle: 'italic',
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
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalView: {
    width: '85%',
    backgroundColor: '#1A1D29',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  sliderContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 25,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeValueText: {
    color: '#7EA0FF',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 10,
  },
  timeLabelText: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 5,
  },
  modalButtons: {
    width: '100%',
    gap: 10,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#7EA0FF',
  },
  cancelButton: {
    backgroundColor: '#555',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});