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

class LocationMonitorService {
  constructor() {
    this.locationWatchRef = null;
    this.checkInTimerRef = null;
    this.currentBarRef = null;
    this.locationStartTimeRef = null;
    this.currentCheckIn = null;
    this.bars = [];
    this.isMonitoring = false;
    this.listeners = [];
    
    this.CHECK_IN_DISTANCE_THRESHOLD = 100; // meters
    this.CHECK_IN_TIME_THRESHOLD = 15 * 60 * 1000; // 15 minutes
  }

  // subscribe to check-in status changes
  subscribe(listener) {
    this.listeners.push(listener);
    // immediately notify with current state
    if (this.currentCheckIn) {
      listener(this.currentCheckIn);
    }
    // return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // notify all listeners of check-in status change
  notifyListeners(checkIn) {
    this.currentCheckIn = checkIn;
    this.listeners.forEach(listener => listener(checkIn));
  }

  // load current check-in from server
  async loadCurrentCheckIn() {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const response = await getUserCheckIn(userId);
        if (response.data) {
          this.notifyListeners(response.data);
        } else {
          this.notifyListeners(null);
        }
      }
    } catch (error) {
      console.error('Error loading check-in:', error);
      this.notifyListeners(null);
    }
  }

  // start monitoring location (works in background)
  async startMonitoring(bars = []) {
    if (this.isMonitoring) return;

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

      this.bars = bars;
      this.isMonitoring = true;

      // load current check-in first
      await this.loadCurrentCheckIn();

      // watch location changes (works in background if permission granted)
      this.locationWatchRef = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 60000, // check every 60 seconds (less frequent for battery)
          distanceInterval: 50, // or every 50 meters
          mayShowUserSettingsDialog: true,
        },
        (location) => {
          this.handleLocationUpdate(location.coords);
        }
      );
    } catch (error) {
      console.error('Error starting location monitoring:', error);
      this.isMonitoring = false;
    }
  }

  // update bars list
  updateBars(bars) {
    this.bars = bars;
  }

  // stop monitoring location
  stopMonitoring() {
    if (this.locationWatchRef) {
      this.locationWatchRef.remove();
      this.locationWatchRef = null;
    }
    if (this.checkInTimerRef) {
      clearTimeout(this.checkInTimerRef);
      this.checkInTimerRef = null;
    }
    this.isMonitoring = false;
    this.currentBarRef = null;
    this.locationStartTimeRef = null;
  }

  // handle location updates
  handleLocationUpdate(coords) {
    const { latitude, longitude } = coords;

    // find nearest bar
    let nearestBar = null;
    let minDistance = Infinity;

    this.bars.forEach(bar => {
      const distance = getDistanceFromLocation(
        latitude,
        longitude,
        bar.latitude,
        bar.longitude
      );
      if (distance < minDistance && distance <= this.CHECK_IN_DISTANCE_THRESHOLD) {
        minDistance = distance;
        nearestBar = bar;
      }
    });

    // if user is near a bar
    if (nearestBar) {
      const barId = nearestBar.id?.toString() || nearestBar.barId?.toString();
      
      // if same bar as before, check if 15 minutes have passed
      if (this.currentBarRef && this.currentBarRef.id === barId) {
        const timeAtLocation = Date.now() - this.locationStartTimeRef;
        
        // if 15 minutes passed and not already checked in, check in
        if (timeAtLocation >= this.CHECK_IN_TIME_THRESHOLD && !this.currentCheckIn) {
          this.performCheckIn(nearestBar, latitude, longitude);
        }
      } else {
        // new bar or first time at this bar
        this.currentBarRef = nearestBar;
        this.locationStartTimeRef = Date.now();
        
        // clear any existing timer
        if (this.checkInTimerRef) {
          clearTimeout(this.checkInTimerRef);
        }
        
        // set timer for 15 minutes
        this.checkInTimerRef = setTimeout(() => {
          if (this.currentBarRef && this.currentBarRef.id === barId) {
            this.performCheckIn(nearestBar, latitude, longitude);
          }
        }, this.CHECK_IN_TIME_THRESHOLD);
      }
    } else {
      // user is not near any bar
      // if they were checked in, check them out
      if (this.currentCheckIn && this.currentBarRef) {
        const distanceFromLastBar = getDistanceFromLocation(
          latitude,
          longitude,
          this.currentBarRef.latitude,
          this.currentBarRef.longitude
        );
        
        // if moved more than threshold away, check out
        if (distanceFromLastBar > this.CHECK_IN_DISTANCE_THRESHOLD) {
          this.performCheckOut();
        }
      }
      
      // reset tracking
      this.currentBarRef = null;
      this.locationStartTimeRef = null;
      if (this.checkInTimerRef) {
        clearTimeout(this.checkInTimerRef);
        this.checkInTimerRef = null;
      }
    }
  }

  // perform check-in
  async performCheckIn(bar, latitude, longitude) {
    try {
      const barId = bar.id?.toString() || bar.barId?.toString();
      const barName = bar.name || bar.barName;
      
      const response = await createCheckIn(barId, barName, latitude, longitude);
      this.notifyListeners(response.data.checkIn);
    } catch (error) {
      console.error('Error checking in:', error);
    }
  }

  // perform check-out
  async performCheckOut() {
    if (!this.currentCheckIn) return;
    
    try {
      await checkOut(this.currentCheckIn._id);
      this.notifyListeners(null);
      this.currentBarRef = null;
      this.locationStartTimeRef = null;
    } catch (error) {
      console.error('Error checking out:', error);
    }
  }

  // get current check-in
  getCurrentCheckIn() {
    return this.currentCheckIn;
  }
}

// export singleton instance
export default new LocationMonitorService();

