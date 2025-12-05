import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Accelerometer } from 'expo-sensors';

const { width } = Dimensions.get('window');
const GLASS_WIDTH = Math.min(280, width * 0.8);
const GLASS_HEIGHT = 420;

export default function BeerScreen({ navigation }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [calibrated, setCalibrated] = useState(false);
  const level = useRef(new Animated.Value(1)).current; // 1 = full, 0 = empty
  const foamOpacity = useRef(new Animated.Value(1)).current;
  const tiltAnim = useRef(new Animated.Value(0)).current; // smoothed forward tilt
  const rafId = useRef(null);
  const currentTilt = useRef(0); // store smoothed tilt numeric
  const baselineY = useRef(0); // calibration baseline

  useEffect(() => {
    Accelerometer.setUpdateInterval(80);
    const alpha = 0.15; // smoothing factor
    let sampleCount = 0;
    let calibrationSum = 0;

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      // Calibrate for first 30 frames (~2.4 seconds at 80ms intervals)
      if (!calibrated && sampleCount < 30) {
        calibrationSum += x; // Use x-axis for left/right tilt
        sampleCount++;
        if (sampleCount === 30) {
          baselineY.current = calibrationSum / 30;
          setCalibrated(true);
        }
        return;
      }

      // Use calibrated baseline to get relative tilt (x-axis for left/right)
      const rawX = x - baselineY.current;
      const clampedX = Math.max(-1, Math.min(1, rawX));
      // Negate to fix left/right direction
      currentTilt.current = currentTilt.current * (1 - alpha) + (-clampedX) * alpha;
      Animated.timing(tiltAnim, { toValue: currentTilt.current, duration: 80, useNativeDriver: false }).start();
    });

    startDrainLoop();

    return () => {
      subscription && subscription.remove();
      stopDrainLoop();
    };
  }, []);

  function startDrainLoop() {
    const loop = () => {
      // Use absolute tilt in either direction, threshold to ignore small movement
      const absTilt = Math.abs(currentTilt.current);
      const tiltOverThreshold = Math.max(0, absTilt - 0.2);
      const drainRate = isPlaying ? tiltOverThreshold * 0.0028 : 0; // tuned rate per frame
      if (drainRate > 0) {
        level.stopAnimation((val) => {
          const next = Math.max(0, val - drainRate);
          level.setValue(next);
          foamOpacity.setValue(Math.max(0.25, next));
        });
      }
      rafId.current = requestAnimationFrame(loop);
    };
    rafId.current = requestAnimationFrame(loop);
  }

  function stopDrainLoop() {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }

  const resetGame = () => {
    setIsPlaying(true);
    level.setValue(1);
    foamOpacity.setValue(1);
    tiltAnim.setValue(0);
    currentTilt.current = 0;
  };

  const togglePlay = () => setIsPlaying((p) => !p);

  // Animated styles (keeping glass static, only liquid changes)
  const beerHeight = level.interpolate({ inputRange: [0, 1], outputRange: [0, GLASS_HEIGHT - 22] });
  const liquidTiltDeg = tiltAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Beer Minigame</Text>

      <View style={styles.glassWrapper}>
        <View style={styles.glass}>
          <View style={styles.glassInner}>
            <Animated.View style={[styles.liquidContainer, { transform: [{ rotate: liquidTiltDeg }] }]}>
              <Animated.View style={[styles.beerLiquid, { height: beerHeight }]}>
                <Animated.View style={[styles.foam, { opacity: foamOpacity }]} />
              </Animated.View>
            </Animated.View>
          </View>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={togglePlay}>
          <Text style={styles.controlText}>{isPlaying ? 'Pause' : 'Resume'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={resetGame}>
          <Text style={styles.controlText}>Refill</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0D17', padding: 20 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 18 },
  glassWrapper: { alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  glass: { width: GLASS_WIDTH, height: GLASS_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  glassInner: { width: GLASS_WIDTH, height: GLASS_HEIGHT, borderRadius: 24, borderWidth: 3, borderColor: '#CCCCCC', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)' },
  liquidContainer: { flex: 1, justifyContent: 'flex-end', overflow: 'hidden' },
  beerLiquid: { width: '200%', backgroundColor: '#F4C542', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, position: 'relative' },
  foam: { position: 'absolute', top: 0, left: 0, right: 0, height: 22, backgroundColor: '#FFF' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  controlButton: { backgroundColor: '#7EA0FF', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 },
  controlText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backButton: { backgroundColor: '#2C2C2E', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, marginLeft: 6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
