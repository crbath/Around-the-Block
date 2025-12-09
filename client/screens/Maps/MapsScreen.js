import React, { useEffect, useState, useRef, useMemo } from 'react';

import { View, Text, StyleSheet, Alert, Modal, TouchableWithoutFeedback, TouchableOpacity, Image, ScrollView } from 'react-native';

import MapView, { Marker } from 'react-native-maps';

import api, { getCheckInsByBar, getActiveCheckIns, createCheckIn, checkOut, getUserCheckIn } from '../../api/api';

import * as Location from 'expo-location'

import axios from 'axios'

import AsyncStorage from '@react-native-async-storage/async-storage';

import WaitTimeSlider from '../../components/feature/WaitTimeSlider';

// import LocationMonitorService from '../../services/LocationMonitorService.js'; // removed - using manual check-in/out



export default function MapsScreen({ navigation }) {

  const [location, setLocation] = useState(null)

  const [errorMessage, setErrorMessage] = useState(null)

  const [bars, setBars] = useState([])

  const [selectedBar, setSelectedBar] = useState(null)

  const [showModal, setShowModal] = useState(false)

  const [avgTime, setAvgTime] = useState(null)

  const [loading, setLoading] = useState(false)

  const [activeCheckIns, setActiveCheckIns] = useState([])

  const [barCheckIns, setBarCheckIns] = useState([])

  const mapRef = useRef(null)
  const barsFetchedRef = useRef(false) // track if bars have been fetched
  const barsRef = useRef([]) // preserve bars across renders

  // user's current check-in status
  const [currentCheckIn, setCurrentCheckIn] = React.useState(null);

  // TEST MODE: manual check-in function for testing without being at location
  // const handleTestCheckIn = async () => {
  //   if (!selectedBar) {
  //     Alert.alert("Test Check-In", "Please select a bar first by tapping on a bar marker");
  //     return;
  //   }

  //   try {
  //     const barId = selectedBar.id?.toString() || selectedBar.barId?.toString();
  //     const barName = selectedBar.name || selectedBar.barName;
      
  //     const response = await createCheckIn(
  //       barId,
  //       barName,
  //       selectedBar.latitude,
  //       selectedBar.longitude
  //     );
      
  //     Alert.alert("Test Check-In", `Successfully checked into ${barName}!`);
      
  //     // refresh check-ins
  //     await fetchActiveCheckIns();
  //     if (selectedBar) {
  //       await fetchBarCheckIns(barId);
  //     }
      
  //     // reload profile if on profile screen
  //     // (this will be handled by the profile screen's useFocusEffect)
  //   } catch (error) {
  //     console.error("Test check-in error:", error);
  //     Alert.alert("Test Check-In Error", error.response?.data?.message || error.message);
  //   }
  // };

  function getDistanceFromBar(lat1, long1, lat2, long2) {

    const R = 6371000

    const o1 = lat1 * Math.PI / 180

    const o2 = lat2 * Math.PI / 180

    const dO1 = (lat2 - lat1) * Math.PI / 180

    const dLam = (long2 - long1) * Math.PI / 180

    const a = Math.sin(dO1 / 2) * Math.sin(dO1 / 2) + Math.cos(o1) * Math.cos(o2) * Math.sin(dLam / 2) * Math.sin(dLam / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    const d = R * c

    return d

  }

  const toUserLoc = () => {
    if (!location || !mapRef.current) return;

    mapRef.current.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 500)
  }

  const isNearBar = () => {

    if (!selectedBar || !location) return false;

    return getDistanceFromBar(location.latitude, location.longitude, selectedBar.latitude, selectedBar.longitude) <= 100

  };



  const fetchAverageTime = async (barId) => {

    try {

      setLoading(true)

      const res = await api.get(`/bartime/${barId}`)

      setAvgTime(res.data.average)

    } catch (err) {

      setAvgTime(null)

    } finally {

      setLoading(false)

    }

  }



  const [waitTime, setWaitTime] = useState(0)



  const submitWaitTime = async () => {

    if (!selectedBar) return;

    if (!isNearBar()) {

      Alert.alert("You are too far from the bar!")

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

    } finally {

      setLoading(false)

    }

  }



  const getWaitTimeLabel = (waitTime) => {

    if (waitTime === null || waitTime === undefined) return "No data";

    if (waitTime <= 0) return "No wait";

    if (waitTime <= 10) return "Short";

    if (waitTime <= 30) return "Moderate";

    if (waitTime <= 60) return "Long";

    return "Very long";

  };



  useEffect(() => {

    if (!location) return;
    
    // only fetch bars once, or if bars array is empty
    if (barsFetchedRef.current && bars.length > 0) return;

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

          { headers: { 'Content-Type': 'text/plain' } }

        )



        const nodes = response.data.elements.map(element => ({

          id: element.id,

          latitude: element.lat,

          longitude: element.lon,

          name: element.tags?.name || 'Unable to retrieve name'

        }))

        // only update bars if we got results, preserve existing bars otherwise
        if (nodes && nodes.length > 0) {
          setBars(nodes)
          barsRef.current = nodes // also store in ref
          barsFetchedRef.current = true
        }

      } catch (err) {

        setErrorMessage("Error grabbing bars")
        // don't clear bars on error - keep existing bars
        console.error("Error fetching bars:", err)

      }

    }

    fetchBars()

  }, [location, bars.length])


  useEffect(() => {
    if (selectedBar) {
      fetchAverageTime(selectedBar.id)
      fetchBarCheckIns(selectedBar.id)
      fetchUserCheckIn() // refresh user's check-in status when bar is selected
    }
  }, [selectedBar])

  // fetch active check-ins for all bars
  useEffect(() => {
    fetchActiveCheckIns()
    const interval = setInterval(fetchActiveCheckIns, 30000) // refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // fetch user's current check-in status
  useEffect(() => {
    fetchUserCheckIn();
  }, [])

  const fetchUserCheckIn = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const response = await getUserCheckIn(userId);
        setCurrentCheckIn(response.data);
      }
    } catch (err) {
      console.error('Error fetching user check-in:', err);
      setCurrentCheckIn(null);
    }
  }

  const fetchActiveCheckIns = async () => {
    try {
      const res = await getActiveCheckIns()
      setActiveCheckIns(res.data || [])
    } catch (error) {
      console.error('Error fetching active check-ins:', error)
      // don't clear activeCheckIns on error - keep existing data
      // setActiveCheckIns([]) // commented out to preserve existing check-ins
    }
  }

  const fetchBarCheckIns = async (barId) => {
    try {
      const res = await getCheckInsByBar(barId)
      setBarCheckIns(res.data || [])
    } catch (error) {
      console.error('Error fetching bar check-ins:', error)
      setBarCheckIns([])
    }
  }

  // manual check-in function
  const handleCheckIn = async () => {
    if (!selectedBar) {
      Alert.alert("Error", "Please select a bar first");
      return;
    }

    // check if user is within distance of the bar
    if (!isNearBar()) {
      Alert.alert("Too Far Away", "You must be within 100 meters of the bar to check in.");
      return;
    }

    try {
      const barId = selectedBar.id?.toString() || selectedBar.barId?.toString();
      const barName = selectedBar.name || selectedBar.barName;
      
      const response = await createCheckIn(
        barId,
        barName,
        selectedBar.latitude,
        selectedBar.longitude
      );
      
      setCurrentCheckIn(response.data.checkIn);
      Alert.alert("Success", `Checked into ${barName}!`);
      
      // refresh check-ins (but preserve bars array)
      await fetchActiveCheckIns();
      await fetchBarCheckIns(barId);
      await fetchUserCheckIn();
      
      // ensure bars are still set (defensive check)
      if (bars.length === 0 && barsFetchedRef.current === false) {
        // if bars were somehow cleared, refetch them
        barsFetchedRef.current = false;
      }
    } catch (error) {
      console.error("Check-in error:", error);
      Alert.alert("Error", error.response?.data?.message || error.message);
    }
  }

  // manual check-out function
  const handleCheckOut = async () => {
    if (!currentCheckIn || !currentCheckIn._id) {
      Alert.alert("Error", "You are not currently checked in anywhere");
      return;
    }

    try {
      await checkOut(currentCheckIn._id);
      setCurrentCheckIn(null);
      Alert.alert("Success", "Checked out successfully!");
      
      // refresh check-ins (but preserve bars array)
      await fetchActiveCheckIns();
      if (selectedBar) {
        const barId = selectedBar.id?.toString() || selectedBar.barId?.toString();
        await fetchBarCheckIns(barId);
      }
      await fetchUserCheckIn();
      
      // ensure bars are still set (defensive check)
      if (bars.length === 0 && barsFetchedRef.current === false) {
        // if bars were somehow cleared, refetch them
        barsFetchedRef.current = false;
      }
    } catch (error) {
      console.error("Check-out error:", error);
      Alert.alert("Error", error.response?.data?.message || error.message);
    }
  }


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

        <Text style={styles.text}>Maps</Text>

      </View>

      {location && (

        <MapView
          ref={mapRef}

          style={styles.map}

          provider={MapView.PROVIDER_GOOGLE}

          initialRegion={{

            latitude: location.latitude,

            longitude: location.longitude,

            latitudeDelta: 0.005,

            longitudeDelta: 0.005,

          }}

        >

          <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title={"Your Location"}
            description={location.latitude + ", " + location.longitude}>
            <View style={{ alignItems: "center", justifyContent: 'center' }}>
              <Text style={{ backgroundColor: "rgba(255, 245, 245, 0.6)", color: "black", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, fontSize: 12, marginBottom: 5 }}>Your Location</Text>

              <Image source={require("../../assets/images/purple-pin.png")} style={{ width: 50, height: 50 }} resizeMode="contain" tintColor={"#a8c8ffff"} />
            </View>

          </Marker>

          {(bars && bars.length > 0 ? bars : barsRef.current).map((bar, index) => {
            if (!bar || !bar.id || !bar.latitude || !bar.longitude) return null;
            
            const barId = bar.id?.toString() || bar.barId?.toString()
            const checkInsAtBar = (activeCheckIns || []).filter(ci => ci && ci.barId === barId && ci.isActive)
            
            return (
              <Marker
                key={`bar-${bar.id}`}
                identifier={`bar-${bar.id}`}
                coordinate={{ latitude: bar.latitude, longitude: bar.longitude }}
                pinColor="purple"
                tracksViewChanges={false}
                onPress={async () => {
                  setSelectedBar(bar);
                  setShowModal(true);
                  try {
                    await api.post("/create-bar-if-needed", {
                      barId: bar.id, barName: bar.name, latitude: bar.latitude, longitude: bar.longitude
                    });
                  }
                  catch (err) {

                  }
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <Text style={{ backgroundColor: "rgba(104, 102, 102, 0.6)", color: "white", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, fontSize: 12, marginBottom: 5 }}>{bar.name || 'Bar'}</Text>
                  
                  {/* show checked-in users count */}
                  {checkInsAtBar.length > 0 && (
                    <View style={{ backgroundColor: "rgba(76, 175, 80, 0.8)", borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 3 }}>
                      <Text style={{ color: "white", fontSize: 10, fontWeight: 'bold' }}>
                        {checkInsAtBar.length} checked in
                      </Text>
                    </View>
                  )}
                  
                  <Image source={require("../../assets/images/purple-pin.png")} style={{ width: 50, height: 50 }} resizeMode="contain" />
                  
                  {/* show user avatars for checked-in users */}
                  {checkInsAtBar.length > 0 && checkInsAtBar.length <= 3 && (
                    <View style={{ flexDirection: 'row', marginTop: 2, gap: 2 }}>
                      {checkInsAtBar.slice(0, 3).map((checkIn, idx) => (
                        <View key={`checkin-${checkIn._id || idx}`} style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#4CAF50', borderWidth: 1, borderColor: 'white' }}>
                          {checkIn.profilePicUrl ? (
                            <Image source={{ uri: checkIn.profilePicUrl }} style={{ width: 18, height: 18, borderRadius: 9 }} />
                          ) : (
                            <Text style={{ color: 'white', fontSize: 10, textAlign: 'center', lineHeight: 18 }}>
                              {checkIn.username?.[0]?.toUpperCase() || '?'}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </Marker>
            )
          })}



          {/* <Marker

            coordinate={{ latitude: location.latitude, longitude: location.longitude }}

            title={"Your Location"}

            pinColor='#7EA0FF'

            description={location.latitude + ", " + location.longitude}

            zIndex={999}

          /> */}

        </MapView>

      )
      }



      <Modal

        visible={showModal}

        transparent={true}

        animationType="fade"

        onRequestClose={() => setShowModal(false)}

      >

        <View style={styles.modalBackground}>

          <TouchableWithoutFeedback onPress={() => { setShowModal(false); setSelectedBar(null) }}>

            <View style={styles.backdrop} />

          </TouchableWithoutFeedback>



          <View style={styles.modalContainer}>

            <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center' }}>

              <TouchableOpacity onPress={() => {
                setShowModal(false)
                navigation.navigate("BarProfile", { bar: selectedBar })
              }}>
                <Text style={[styles.modalTitle, { fontWeight: 'bold' }]}>{selectedBar?.name}</Text>



              </TouchableOpacity>

              <Text style={[{ fontSize: 20, marginBottom: 10, textAlign: 'center', color: '#5B4DB7', paddingTop: 20 }]}>Estimated Wait Time: {getWaitTimeLabel(avgTime ? avgTime : 0)}</Text>

              {/* check-in/check-out button */}
              <View style={{ marginBottom: 15, width: '100%', alignItems: 'center' }}>
                {currentCheckIn && currentCheckIn.isActive && currentCheckIn.barId === (selectedBar?.id?.toString() || selectedBar?.barId?.toString()) ? (
                  <TouchableOpacity 
                    style={{ padding: 12, backgroundColor: '#FF6B6B', borderRadius: 8, width: '80%' }} 
                    onPress={handleCheckOut}
                  >
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
                      Check Out
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={{ 
                      padding: 12, 
                      backgroundColor: isNearBar() ? '#4CAF50' : '#9E9E9E', 
                      borderRadius: 8, 
                      width: '80%',
                      opacity: isNearBar() ? 1 : 0.6
                    }} 
                    onPress={handleCheckIn}
                    disabled={!isNearBar()}
                  >
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
                      {isNearBar() ? 'Check In' : 'Too Far Away'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* show checked-in users */}
              {barCheckIns.length > 0 && (
                <View style={{ marginBottom: 15, width: '100%' }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#7EA0FF', marginBottom: 8, textAlign: 'center' }}>
                    Checked In ({barCheckIns.length})
                  </Text>
                  <ScrollView style={{ maxHeight: 100 }}>
                    {barCheckIns.map((checkIn, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingHorizontal: 10 }}>
                        {checkIn.profilePicUrl ? (
                          <Image source={{ uri: checkIn.profilePicUrl }} style={{ width: 30, height: 30, borderRadius: 15, marginRight: 8 }} />
                        ) : (
                          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#5B4DB7', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                            <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
                              {checkIn.username?.[0]?.toUpperCase() || '?'}
                            </Text>
                          </View>
                        )}
                        <Text style={{ color: '#fff', fontSize: 14 }}>{checkIn.username}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}



              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>

                <Text style={{ fontWeight: 'bold', color: '#7EA0FF' }}>How Long is The Line?</Text>

                <View style={{ width: 250 }}>

                  <WaitTimeSlider value={waitTime} onChange={setWaitTime} getLabel={getWaitTimeLabel} />

                </View>

                <TouchableOpacity style={{ padding: 10, backgroundColor: loading || !isNearBar() ? 'grey' : '#5B4DB7', margin: 10, borderRadius: 5 }} onPress={submitWaitTime} disabled={loading || !isNearBar()}>

                  <Text style={{ color: 'white' }}>Submit</Text>

                </TouchableOpacity>

                {/* TEST MODE: Manual check-in button for testing without being at location */}
                {/* <TouchableOpacity 
                  style={{ padding: 10, backgroundColor: '#4CAF50', margin: 10, borderRadius: 5 }} 
                  onPress={handleTestCheckIn}
                >
                  <Text style={{ color: 'white', fontSize: 12 }}>🧪 Test Check-In (Debug)</Text>
                </TouchableOpacity> */}

              </View>

            </View>



            <Text style={{ marginBottom: 10, color: '#5B4DB7' }} onPress={() => { setShowModal(false); setSelectedBar(null) }}>Close</Text>

          </View>


        </View>

      </Modal>

      {
        location && (
          <TouchableOpacity style={styles.fab} onPress={toUserLoc}>
            <Image
              source={require("../../assets/images/purple-pin.png")}
              style={{ width: 40, height: 40, tintColor: 'white', }}
              resizeMode="contain" />
          </TouchableOpacity>
        )
      }

    </View >

  );

}



const styles = StyleSheet.create({
  fab: { position: 'absolute', bottom: 40, right: 20, backgroundColor: '#a8c8ffff', width: 60, height: 60, justifyContent: 'center', alignItems: 'center', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, elevation: 10 },
  container: { flex: 1 },

  titleContainer: { alignItems: 'center', paddingVertical: 20, backgroundColor: "#0B0D17" },

  text: { color: '#fff', fontSize: 24, fontWeight: 'bold', paddingTop: 40 },

  map: { flex: 1 },

  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },

  modalContainer: { width: '80%', height: '70%', padding: 20, backgroundColor: 'rgba(30,30,30, 0.8)', borderRadius: 10, alignItems: 'center', justifyContent: 'space-between', zIndex: 2 },

  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#fff' },

  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },

});
