import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert,Modal,TouchableWithoutFeedback } from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import * as Location from 'expo-location'
import axios from 'axios'

export default function MapsScreen() {
  //user's location
  const [location, setLocation] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  //bars from OSM
  const [bars, setBars] = useState([])

  const [selectedBar, setSelectedBar] = useState(null)
  const [showModal, setShowModal] = useState(false)

  //using OSM to fetch bars instead of googleplaces
  useEffect(()=>{
    if (!location) return;

    const fetchBars = async () =>{
      try {
        const lat = location.latitude
        const long = location.longitude
        const delta = 0.05 

        const overpassQuery = `
        [out:json];
        node
        ["amenity"="bar"]
        (${lat-delta},${long-delta},${lat+delta},${long+delta});
        out;
        `;

        const response = await axios.post(
          'https://overpass-api.de/api/interpreter',
          overpassQuery,
          {headers:
            {'Content-Type': 'text/plain'}
          }
        )
        //map each element
        const nodes = response.data.elements.map (element => ({
          id: element.id,
          latitude: element.lat,
          longitude: element.lon,
          name: element.tags?.name || 'Unable to retrieve name'
        }))
        //save each bar
        setBars(nodes)


      }catch(err){
        setErrorMessage("Error grabbing bars")
      }


    }
    fetchBars()
  },[location])

  //Grab permission for location from user if not already granted
  useEffect(() =>{
    (async () => {
      let {status} = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted'){
        setErrorMessage("Permission to access location was denied. You must allow access to use the app.")
        Alert.alert("Permission denied, you must allow location services to use the app")
      }
      let loc = await Location.getCurrentPositionAsync({})
      setLocation(loc.coords)
    })()
  },[])


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
        style = {styles.map}
        provider = {MapView.PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}>
          <Marker
            coordinate={{latitude:location.latitude, longitude:location.longitude}}
            title = {"Your Location"}
            description={location.latitude + ", " + location.longitude}
            />
            {bars.map(bar => (
              <Marker
              key = {bar.id}
              coordinate={{latitude: bar.latitude, longitude: bar.longitude}}
              // title = {bar.name}
              pinColor = "purple"
              onPress = {() => {setSelectedBar(bar); setShowModal(true)}}
              />
            ))}
      </MapView>
      
      )}
      <Modal
        visible = {showModal}
        transparent = {true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}>
          <TouchableWithoutFeedback onPress={()=> setShowModal(false)}>
        <View style ={styles.modalBackground}>
          <View style = {styles.modalContainer}>

            <View style={{flex:1, justifyContent:'flex-start', alignItems:'center'}}>
            <Text style={styles.modalTitle}>{selectedBar?.name}</Text>
            {/* add other bar information here... and onclick to text to go to bar screen */}
            </View>

            <Text style={{marginBottom:10, color:'purple'}}
            onPress={()=> setShowModal(false)}>
              Close
            </Text>
          </View>
        </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer:{
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: "#0B0D17"
  },
  text: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    paddingTop:40,
  },
  map:{
    flex: 1, 
  },
  modalBackground:{
    flex: 1,
    backgroundColor:'rgba(0,0,0,0.5)',
    justifyContent:'center',
    alignItems:'center'
  },
  modalContainer: {
    width:'80%',
    height:'70%',
    padding: 20,
    backgroundColor:'rgba(213, 213, 213, 0.8)',
    borderRadius: 10,
    alignItems:'center',
    justifyContent:'space-between'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign:'center',
    color:'rgba(59, 4, 83, 1)'
  }
});
