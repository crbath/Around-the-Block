import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

export default function WaitTimeSlider({ value, onChange, getLabel }) {
  return (
    <View style={styles.sliderContainer}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={120}
        step={5}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#7EA0FF"
        maximumTrackTintColor="#555"
        thumbTintColor="#7EA0FF"
      />
      <Text style={styles.timeValueText}>{value} min</Text>
      <Text style={styles.timeLabelText}>{getLabel ? getLabel(value) : ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderContainer: { width: '100%', marginTop: 10 },
  slider: { width: '100%', height: 40 },
  timeValueText: { color: '#fff', fontSize: 16, textAlign: 'center', marginTop: 8 },
  timeLabelText: { color: '#9BA1A6', fontSize: 14, textAlign: 'center', marginTop: 4 },
});
