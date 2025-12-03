import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Modal, TouchableWithoutFeedback, TouchableOpacity, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import api from '../api/api';
import * as Location from 'expo-location'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage';
import WaitTimeSlider from '../components/WaitTimeSlider';

export default function MapsScreen() {
  //user's location
  const [location, setLocation] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  //bars from OSM
  const [bars, setBars] = useState([])

  const [selectedBar, setSelectedBar] = useState(null)
  const [showModal, setShowModal] = useState(false)

  //for fetching bar information
  const [avgTime, setAvgTime] = useState(null)
  const [loading, setLoading] = useState(false)

  function getDistanceFromBar(lat1, long1, lat2, long2) {
    //haversine formula to calc distance between these lat long points https://www.movable-type.co.uk/scripts/latlong.html

    const R = 6371000
    const o1 = lat1 * Math.PI / 180
    const o2 = lat2 * Math.PI / 180
    const dO1 = (lat2 - lat1) * Math.PI / 180
    const dLam = (long2 - long1) * Math.PI / 180

    const a = Math.sin(dO1 / 2) * Math.sin(dO1 / 2) + Math.cos(o1) * Math.cos(o2) * Math.sin(dLam / 2) * Math.sin(dLam / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c //meters

    return d
  }

  const isNearBar = () => {
    if (!selectedBar || !location) return false;
    return getDistanceFromBar(location.latitude, location.longitude, selectedBar.latitude, selectedBar.longitude) <= 100
  };

  const fetchAverageTime = async (barId) => {
    try {
      setLoading(true)
      // setAvgTime(null)

      const res = await api.get(`/bartime/${barId}`)
      setAvgTime(res.data.average)
    } catch (err) {
      setAvgTime(null)
    } finally {
      setLoading(false)
    }
  }




  //setting wait times
  const [waitTime, setWaitTime] = useState(0)

  const submitWaitTime = async () => {
    if (!selectedBar) return;

    //check if the user is close to the bar or not
    const distance = getDistanceFromBar(location.latitude, location.longitude, selectedBar.latitude, selectedBar.longitude)

    if (distance > 100) {
      Alert.alert("You are too far from the bar!"
      )
      return;
    }

    try {
      setLoading(true)
      const token = await AsyncStorage.getItem('token')

      const res = await api.post(
        `/bartime`,
        {
          barId: selectedBar.id.toString(),
          barName: selectedBar.name,
          latitude: selectedBar.latitude,
          longitude: selectedBar.longitude,
          time: waitTime
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      Alert.alert("Submitted line length!", res.data.message)
      fetchAverageTime(selectedBar.id)
    } catch (err) {
      console.log(err)
      Alert.alert("Error", err.response?.data?.message || err.message)
    }
    finally {
      setLoading(false)
    }
  }

  // ------ Unified Wait Time Label Function ------
  const getWaitTimeLabel = (waitTime) => {
    if (waitTime === null || waitTime === undefined) return "No data";
    if (waitTime <= 0) return "No wait";
    if (waitTime <= 10) return "Short";
    if (waitTime <= 30) return "Moderate";
    if (waitTime <= 60) return "Long";
    return "Very long";
  };


  //using OSM to fetch bars instead of googleplaces
  useEffect(() => {
    if (!location) return;

    const fetchBars = async () => {
      try {
        const lat = location.latitude
        const long = location.longitude
        const delta = 0.05

        const overpassQuery = `
        [out:json];
        node
        ["amenity"="bar"]
        (${lat - delta},${long - delta},${lat + delta},${long + delta});
        out;
        `;

        const response = await axios.post(
          'https://overpass-api.de/api/interpreter',
          overpassQuery,
          {
            headers:
              { 'Content-Type': 'text/plain' }
          }
        )
        //map each element
        const nodes = response.data.elements.map(element => ({
          id: element.id,
          latitude: element.lat,
          longitude: element.lon,
          name: element.tags?.name || 'Unable to retrieve name'
        }))
        //save each bar
        setBars(nodes)


      } catch (err) {
        setErrorMessage("Error grabbing bars")
      }


    }
    fetchBars()
  }, [location])

  //Grab permission for location from user if not already granted
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setErrorMessage("Permission to access location was denied. You must allow access to use the app.")
        Alert.alert("Permission denied, you must allow location services to use the app")
      }
      let loc = await Location.getCurrentPositionAsync({})
      setLocation(loc.coords)
    })()
  }, [])


  return (

    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.text}>
          Maps
        </Text>
      </View>
      {/* <Text style={styles.text}>Maps Screen</Text> */}
      {location && (
        <MapView
          style={styles.map}
          provider={MapView.PROVIDER_GOOGLE}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}>

          {bars.map(bar => (
            <Marker
              key={bar.id}
              coordinate={{ latitude: bar.latitude, longitude: bar.longitude }}
              // title = {bar.name}
              pinColor="purple"
              tracksViewChanges={false}
              onPress={() => {
                setSelectedBar(bar); setShowModal(true); fetchAverageTime(bar.id)
              }}>

              <View style={{ alignItems: "center" }}>

                <Text
                  style={{
                    backgroundColor: "rgba(104, 102, 102, 0.6)",
                    color: "white",
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 5,
                    fontSize: 12,
                    marginBottom: 5,
                  }}
                >
                  {bar.name}
                </Text>
                <Image //I HAD TO ADD MY OWN IMAGE BCS I WANTED TEXT ABOVE IT. WE CAN CHANGE WHAT THIS IS IN ASSETS
                  source={require("../assets/images/purple-pin.png")}
                  style={{ width: 50, height: 50 }}
                  resizeMode="contain"
                />
              </View>
            </Marker>
          ))}
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title={"Your Location"}
            pinColor='#7EA0FF'
            description={location.latitude + ", " + location.longitude}
            zIndex={999}
          />
        </MapView>

      )}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalBackground}>

          <TouchableWithoutFeedback onPress={() => { setShowModal(false); setSelectedBar(null) }}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.modalContainer}>

            <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center' }}>
              <Text style={styles.modalTitle}>{selectedBar?.name}</Text>
              <Text style={[{
                fontSize: 20,

                marginBottom: 10,
                textAlign: 'center',
                color: 'purple', paddingTop: 20
              }]}>Estimated Wait Time: {getWaitTimeLabel(avgTime ? avgTime : 0)}</Text>

              {/* add other bar information here... and onclick to text to go to bar screen */}

              {
                //if user is in area
              }
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold', color: '#7EA0FF' }}>How Long is The Line?</Text>
                {/* <Slider
                style={{ width: 200, paddingTop: 20 }}
                minimumValue={0}
                maximumValue={120}
                step={5}
                value={waitTime}
                onValueChange={setWaitTime}
                minimumTrackTintColor="purple"
                maximumTrackTintColor="lightgrey"
                thumbTintColor="purple"
                trackHeight={10}
              /> */}
                <View style={{ width: 250 }}>
                  <WaitTimeSlider
                    value={waitTime}
                    onChange={setWaitTime}
                    getLabel={getWaitTimeLabel}
                  />
                </View>
                {/* <Text style={{ paddingBottom: 20, color: 'grey' }}>
                {getWaitTimeLabel(waitTime)}
              </Text> */}
                <TouchableOpacity style={{ padding: 10, backgroundColor: loading || !isNearBar() ? 'grey' : 'purple', margin: 10, borderRadius: 5 }} onPress={submitWaitTime} disabled={loading || !isNearBar}>
                  <Text style={{ color: 'white' }}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={{ marginBottom: 10, color: 'purple' }}
              onPress={() => { setShowModal(false); setSelectedBar(null) }}>
              Close
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: "#0B0D17"
  },
  text: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    paddingTop: 40,
  },
  map: {
    flex: 1,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: '80%',
    height: '70%',
    padding: 20,
    backgroundColor: 'rgba(30,30,30, 0.8)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#fff'
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1
  }
});
