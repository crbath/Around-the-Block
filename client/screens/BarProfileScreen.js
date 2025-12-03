import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, ActivityIndicator, Alert, TextInput } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WaitTimeSlider from '../components/WaitTimeSlider';

export default function BarProfileScreen({ route, navigation }) {
  const { bar } = route.params;
  const [avgTime, setAvgTime] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [timeValue, setTimeValue] = useState(10);
  const [loading, setLoading] = useState(false);
  const [isBarOwner, setIsBarOwner] = useState(false)
  const [deals, setDeals] = useState(bar.deals || '')
  const [hours, setHours] = useState(bar.hours || '')
  const [editing, setEditing] = useState(false)
  useEffect(() => {
    if(!bar) return
    fetchBarData();
    fetchBarInfo()
    
    const checkBarOwner = async () => {
      try{
          const token = await AsyncStorage.getItem('token')
          const res = await api.get('/profile', {
            headers: {Authorization: `Bearer ${token}`}
          })
          console.log(res.data.bar, bar.id)
          if (res.data.bar=== bar.id){
            setIsBarOwner(true)
          }
      }catch(err){
        console.log("ERROR: ", err)
      }
    }
    checkBarOwner()
  }, [bar]);

  const fetchBarInfo = async() => {
    console.log("Fetching... ", bar.id)
    try{
      setLoading(true)
      console.log(bar.id, typeof(bar.id))
      const res = await api.get(`/bar/${bar.id}`)
      setDeals(res.data.deals || '')
      setHours(res.data.hours || '')
      console.log("recieved: ", res)
    }catch (err) {
      console.log("Error fetching bar", err);
      setAvgTime(null);
    } finally {
      setLoading(false);
    }
  }

  const fetchBarData = async () => {
    try {
      console.log("Bar", bar)
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


const updateBarInfo = async() => {
  try{
    const token = await AsyncStorage.getItem('token')
    await api.post(
      '/update-bar', 
      {barId: bar.id, deals, hours},
      {headers: {Authorization: `Bearer ${token}`}}
    )

    Alert.alert("Updated bar information!")
    setEditing(false)
    await fetchBarInfo()
  }
  catch(err){
    Alert.alert("Error: could not set bar information.", err.message)
  }
}


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
          {isBarOwner && editing ? (
            <TextInput
            style = {[styles.cardText, {borderBottomWidth:1, borderColor: '#000'}]}
            value = {deals}
            onChangeText = {setDeals}
            placeholder='Enter deals'
            placeholderTextColor="#898989ff"
            />
          
          ):
            <Text style={styles.cardText}>{deals}</Text>
          }
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hours</Text>
          {isBarOwner && editing ? (
            <TextInput
            style = {[styles.cardText, {borderBottomWidth:1, borderColor: '#000'}]}
            value = {hours}
            onChangeText = {setHours}
            placeholder='Enter hours'
            placeholderTextColor="#898989ff"
            />
          
          ):
            <Text style={styles.cardText}>{hours}</Text>
          }
        </View>

        <View style={styles.card}>
          <Text style={styles.cardText}>No memories...{'\n'}yet.</Text>
        </View>

        {isBarOwner && (
          <View style = {{flexDirection:'row', gap:10, marginBottom: 15}}>
            {editing? (
              <>
                <TouchableOpacity style={styles.submitButton} onPress = {updateBarInfo}>
                  <Text style = {styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress = {()=> setEditing(false)}>
                  <Text style = {styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ):(
               <TouchableOpacity style={styles.submitButton} onPress = {() => setEditing(true)}>
                  <Text style = {styles.modalButtonText}>Edit</Text>
                </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* WAIT TIME INPUT MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>How long is the line?</Text>
            <Text style={styles.modalSubtitle}>Help others know the wait time</Text>
            
            <WaitTimeSlider
              value = {timeValue}
              onChange = {setTimeValue}
              getLabel={getWaitTimeLabel}
            />
            {/* <View style={styles.sliderContainer}>
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
            </View> */}

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

      {!isBarOwner && (
        <TouchableOpacity
        style = {styles.floatingButton}
        onPress={async() => {
          try{
            console.log(bar.id)
            const token = await AsyncStorage.getItem("token")
            const res = await api.post(
              "/select-bar",
              {barId: bar.id},
              {headers: {Authorization: `Bearer ${token}`}}
            )
            if (res.status = 200){
              setIsBarOwner(true)
            }
            console.log(res.status)
          
          }catch(err){
            Alert.alert("Failed to link bar", err.message, err.response?.data)
          }
        }}
        >
          <Ionicons name = "link-outline" size={24} color ="#fff"/>
        </TouchableOpacity>
      )}
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
    borderRadius:14,
    padding:10,
    shadowColor:'#000',
    shadowOpacity:0.3,
    shadowOffset:{width:0,height:3},
    elevation:6,
    borderWidth:1,
  },
  cancelButton: {
    backgroundColor: '#555',
    borderRadius:14,
    padding:10,
    shadowColor:'#000',
    shadowOpacity:0.3,
    shadowOffset:{width:0,height:3},
    elevation:6,
    borderWidth:1,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute', 
    bottom: 30,
    right: 20, 
    width:50,
    height:50,
    borderRadius:25,
    shadowColor:'#000',
    shadowOffset:{width:0, height:2},
    shadowOpacity:0.3,
    shadowRadius:4,
    elevation:5,
  }
});