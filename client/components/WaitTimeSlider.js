import React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import Slider from '@react-native-community/slider'

export default function WaitTimeSlider({value, onChange, getLabel}){
   return(
      <View style = {styles.sliderContainer}>
         <Slider
            style={styles.slider}
            minimumValue ={0}
            maximumValue= {120}
            step={5}
            value={value}
            onValueChange={onChange}
            minimumTrackTintColor = "#7EA0FF"
            maximumTrackTintColor = "#555"
            thumbTintColor='#7EA0FF'
            />

            <Text style = {styles.timeValueText}>{value} minutes</Text>
            <Text style = {styles.timeLabelText}>{getLabel(value)}</Text>
      </View>
   )
}

const styles = StyleSheet.create({
   sliderContainer: {
      width: '100%',
      alignItems: 'center',
   },
   slider:{
      width: '100%',
      height: 40,
   },
   timeValueText: {
      color: '#7EA0FF',
      fontSize: 32,
      fontWeight: 'bold',
      marginTop: 10,
   },
   timeLabelText:{
      color: '#fff',
      fontSize: 16,
      marginTop:5,
   },
})