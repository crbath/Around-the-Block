import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import * as Location from 'expo-location'

export default function MapsScreen() {
  const [location, setLocation] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

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
      </MapView>
      )}
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
});
