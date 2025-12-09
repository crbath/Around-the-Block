import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { createCheckIn, checkOut, getUserCheckIn } from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// helper function to calculate distance between two coordinates (in meters)
function getDistanceFromLocation(lat1, lon1, lat2, lon2) {
  const R = 6371000; // earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// hook to monitor user location and automatically check in after 15 minutes at a location
export default function useCheckInMonitor(bars = []) {
  const [currentCheckIn, setCurrentCheckIn] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const locationWatchRef = useRef(null);
  const checkInTimerRef = useRef(null);
  const currentBarRef = useRef(null);
  const locationStartTimeRef = useRef(null);
  const lastLocationRef = useRef(null);
  const CHECK_IN_DISTANCE_THRESHOLD = 100; // meters - same as wait time submission
  const CHECK_IN_TIME_THRESHOLD = 15 * 60 * 1000; // 15 minutes in milliseconds
  // FOR TESTING: uncomment the line below and comment the line above to test with 30 seconds instead of 15 minutes
  // const CHECK_IN_TIME_THRESHOLD = 30 * 1000; // 30 seconds for testing

  // load existing check-in on mount
  useEffect(() => {
    loadCurrentCheckIn();
  }, []);

  const loadCurrentCheckIn = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const response = await getUserCheckIn(userId);
        if (response.data) {
          setCurrentCheckIn(response.data);
        }
      }
    } catch (error) {
      console.error('Error loading check-in:', error);
    }
  };

  // start monitoring location (works in background too)
  const startMonitoring = async () => {
    if (isMonitoring) return;

    try {
      // request foreground location permissions first
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.log('Foreground location permission denied');
        return;
      }

      // request background location permissions for background tracking
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.log('Background location permission denied - check-in will only work when app is open');
        // continue with foreground-only tracking
      }

      setIsMonitoring(true);

      // watch location changes (works in background if permission granted)
      locationWatchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 60000, // check every 60 seconds (less frequent for battery)
          distanceInterval: 50, // or every 50 meters
          mayShowUserSettingsDialog: true,
        },
        (location) => {
          handleLocationUpdate(location.coords);
        }
      );
    } catch (error) {
      console.error('Error starting location monitoring:', error);
      setIsMonitoring(false);
    }
  };

  // stop monitoring location
  const stopMonitoring = () => {
    if (locationWatchRef.current) {
      locationWatchRef.current.remove();
      locationWatchRef.current = null;
    }
    if (checkInTimerRef.current) {
      clearTimeout(checkInTimerRef.current);
      checkInTimerRef.current = null;
    }
    setIsMonitoring(false);
    currentBarRef.current = null;
    locationStartTimeRef.current = null;
    lastLocationRef.current = null;
  };

  // handle location updates
  const handleLocationUpdate = (coords) => {
    const { latitude, longitude } = coords;
    lastLocationRef.current = { latitude, longitude };

    // find nearest bar
    let nearestBar = null;
    let minDistance = Infinity;

    bars.forEach(bar => {
      const distance = getDistanceFromLocation(
        latitude,
        longitude,
        bar.latitude,
        bar.longitude
      );
      if (distance < minDistance && distance <= CHECK_IN_DISTANCE_THRESHOLD) {
        minDistance = distance;
        nearestBar = bar;
      }
    });

    // if user is near a bar
    if (nearestBar) {
      const barId = nearestBar.id?.toString() || nearestBar.barId?.toString();
      
      // if same bar as before, check if 15 minutes have passed
      if (currentBarRef.current && currentBarRef.current.id === barId) {
        const timeAtLocation = Date.now() - locationStartTimeRef.current;
        
        // if 15 minutes passed and not already checked in, check in
        if (timeAtLocation >= CHECK_IN_TIME_THRESHOLD && !currentCheckIn) {
          performCheckIn(nearestBar, latitude, longitude);
        }
      } else {
        // new bar or first time at this bar
        currentBarRef.current = nearestBar;
        locationStartTimeRef.current = Date.now();
        
        // clear any existing timer
        if (checkInTimerRef.current) {
          clearTimeout(checkInTimerRef.current);
        }
        
        // set timer for 15 minutes
        checkInTimerRef.current = setTimeout(() => {
          if (currentBarRef.current && currentBarRef.current.id === barId) {
            performCheckIn(nearestBar, latitude, longitude);
          }
        }, CHECK_IN_TIME_THRESHOLD);
      }
    } else {
      // user is not near any bar
      // if they were checked in, check them out
      if (currentCheckIn && currentBarRef.current) {
        const distanceFromLastBar = getDistanceFromLocation(
          latitude,
          longitude,
          currentBarRef.current.latitude,
          currentBarRef.current.longitude
        );
        
        // if moved more than threshold away, check out
        if (distanceFromLastBar > CHECK_IN_DISTANCE_THRESHOLD) {
          performCheckOut();
        }
      }
      
      // reset tracking
      currentBarRef.current = null;
      locationStartTimeRef.current = null;
      if (checkInTimerRef.current) {
        clearTimeout(checkInTimerRef.current);
        checkInTimerRef.current = null;
      }
    }
  };

  // perform check-in
  const performCheckIn = async (bar, latitude, longitude) => {
    try {
      const barId = bar.id?.toString() || bar.barId?.toString();
      const barName = bar.name || bar.barName;
      
      const response = await createCheckIn(barId, barName, latitude, longitude);
      setCurrentCheckIn(response.data.checkIn);
    } catch (error) {
      console.error('Error checking in:', error);
    }
  };

  // perform check-out
  const performCheckOut = async () => {
    if (!currentCheckIn) return;
    
    try {
      await checkOut(currentCheckIn._id);
      setCurrentCheckIn(null);
      currentBarRef.current = null;
      locationStartTimeRef.current = null;
    } catch (error) {
      console.error('Error checking out:', error);
    }
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, []);

  return {
    currentCheckIn,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    performCheckOut,
    loadCurrentCheckIn
  };
}

