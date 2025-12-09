import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
// import LocationMonitorService from '../services/LocationMonitorService.js';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import ActivitiesScreen from '../Activities/ActivitiesScreen';
import FeedScreen from '../Feed/FeedScreen';
import FriendsScreen from '../Friends/FriendsScreen';
import MapsScreen from '../Maps/MapsScreen';
import SelectBarsScreen from '../SelectBars/SelectBarsScreen';
import ProfileScreen from '../Profile/ProfileScreen';
import HeadsUpGameScreen from '../HeadsUpGame/HeadsUpGameScreen';
import TriviaScreen from '../Trivia/TriviaScreen';
import TalkingBenMinigameScreen from '../TalkingBenMinigame/TalkingBenMinigameScreen';
import BeerScreen from '../Beer/BeerScreen';
import BarProfileScreen from '../BarProfile/BarProfileScreen';
import PostDetailScreen from '../PostDetail/PostDetailScreen';
import FriendProfileScreen from '../FriendProfile/FriendProfileScreen';
import CreatePostScreen from '../CreatePost/CreatePostScreen';

const Tab = createBottomTabNavigator();
const ActivitiesStack = createNativeStackNavigator();
const FeedStack = createNativeStackNavigator();
const SelectBarsStack = createNativeStackNavigator();

function ActivitiesStackNavigator() {
  return (
    <ActivitiesStack.Navigator screenOptions={{ headerShown: false }}>
      <ActivitiesStack.Screen name="ActivitiesMain" component={ActivitiesScreen} />
      <ActivitiesStack.Screen name="HeadsUpGame" component={HeadsUpGameScreen} />
      <ActivitiesStack.Screen name="Trivia" component={TriviaScreen} />
      <ActivitiesStack.Screen name="TalkingBenMinigame" component={TalkingBenMinigameScreen} />
      <ActivitiesStack.Screen name="Beer" component={BeerScreen} />
    </ActivitiesStack.Navigator>
  );
}

function FeedStackNavigator() {
  return (
    <FeedStack.Navigator screenOptions={{ headerShown: false }}>
      <FeedStack.Screen name="FeedMain" component={FeedScreen} />
      <FeedStack.Screen name="Friends" component={FriendsScreen} />
      <FeedStack.Screen name="PostDetail" component={PostDetailScreen} />
      <FeedStack.Screen name="FriendProfile" component={FriendProfileScreen} />
      <FeedStack.Screen name="CreatePost" component={CreatePostScreen} />
    </FeedStack.Navigator>
  );
}

function SelectBarsStackNavigator() {
  return (
    <SelectBarsStack.Navigator screenOptions={{ headerShown: false }}>
      <SelectBarsStack.Screen name="SelectBarsMain" component={SelectBarsScreen} />
      <SelectBarsStack.Screen name="BarProfile" component={BarProfileScreen} />
    </SelectBarsStack.Navigator>
  );
}

function MapStackNavigator() {
  return (
    <SelectBarsStack.Navigator screenOptions={{ headerShown: false }}>
      <SelectBarsStack.Screen name="MapsMain" component={MapsScreen} />
      <SelectBarsStack.Screen name="BarProfile" component={BarProfileScreen} />
    </SelectBarsStack.Navigator>
  );
}

export default function HomeScreen() {
  // automatic location monitoring removed - check-in/check-out is now manual
  // useEffect(() => {
  //   const startGlobalMonitoring = async () => {
  //     const token = await AsyncStorage.getItem('token');
  //     if (token) {
  //       LocationMonitorService.startMonitoring([]);
  //     }
  //   };
  //   startGlobalMonitoring();
  //   return () => {
  //     // LocationMonitorService.stopMonitoring();
  //   };
  // }, []);

  return (
    <Tab.Navigator
      initialRouteName='Maps'
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1a1a1a' },
        tabBarActiveTintColor: '#7EA0FF',
        tabBarInactiveTintColor: '#fff',
      }}
    >
      <Tab.Screen
        name="Activities"
        component={ActivitiesStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="game-controller-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Feed"
        component={FeedStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper-outline" size={size} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // get the current state
            const state = navigation.getState();
            const feedRoute = state.routes.find(r => r.name === 'Feed');
            
            // if Feed tab is already focused and we're not on FeedMain, reset to FeedMain
            if (feedRoute && feedRoute.state) {
              const feedStackState = feedRoute.state;
              const currentScreen = feedStackState.routes[feedStackState.index]?.name;
              
              // if we're not on FeedMain, reset the FeedStack to FeedMain
              if (currentScreen !== 'FeedMain') {
                e.preventDefault();
                // reset the FeedStack to just FeedMain
                navigation.dispatch(
                  CommonActions.reset({
                    index: state.index,
                    routes: state.routes.map(route => 
                      route.name === 'Feed' 
                        ? { ...route, state: { routes: [{ name: 'FeedMain' }], index: 0 } }
                        : route
                    ),
                  })
                );
              }
            }
          },
        })}
      />
      <Tab.Screen
        name="Maps"
        component={MapStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Select Bars"
        component={SelectBarsStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wine-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
