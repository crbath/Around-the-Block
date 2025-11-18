import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, Button } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { getBarAverage, submitBarTime } from '../api/api';

export default function BarProfileScreen({ route, navigation }) {
  const { bar } = route.params;
  const [avgTime, setAvgTime] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [timeValue, setTimeValue] = useState(10);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getBarAverage(bar._id);
        setAvgTime(result.data.average);
      } catch (err) {
        console.log("Error fetching avg time", err);
      }
    }
    fetchData();
  }, []);

  const submitTime = async () => {
    await submitBarTime(bar._id, timeValue);
    setModalVisible(false);

    const updated = await getBarAverage(bar._id);
    setAvgTime(updated.data.average);
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
          <View style={styles.infoButton}>
            <Text style={styles.infoText}>
              {bar.avgTime ? `${Math.round(bar.avgTime)} min` : "No data"}
            </Text>
          </View>
          <View style={styles.infoButton}><Text style={styles.infoText}>MAP</Text></View>
        </View>

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
        <View style={styles.modalView}>
          <Text style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}>
            How long did you wait?
          </Text>
          <Slider
            style={{ width: 250 }}
            minimumValue={0}
            maximumValue={120}
            step={5}
            value={timeValue}
            onValueChange={setTimeValue}
          />
          <Text style={{ color: "white", fontSize: 20, marginVertical: 10 }}>
            {timeValue} min
          </Text>

          <Button title="Submit" onPress={submitTime} />
          <Button title="Cancel" onPress={() => setModalVisible(false)} color="red" />
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
  },
  modalView: {
    flex: 1,
    backgroundColor: '#000000dd',
    justifyContent: 'center',
    alignItems: 'center'
  }
});
