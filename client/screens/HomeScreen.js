import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ActivitiesScreen from './ActivitiesScreen';
import FeedScreen from './FeedScreen';
import FriendsScreen from './FriendsScreen';
import MapsScreen from './MapsScreen';
import SelectBarsScreen from './SelectBarsScreen';
import ProfileScreen from './ProfileScreen';
import HeadsUpGameScreen from './HeadsUpGameScreen';
import TriviaScreen from './TriviaScreen';
import TalkingBenMinigameScreen from './TalkingBenMinigameScreen';
import BeerScreen from './BeerScreen';

const Tab = createBottomTabNavigator();
const ActivitiesStack = createNativeStackNavigator();
const FeedStack = createNativeStackNavigator();

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
    </FeedStack.Navigator>
  );
}

export default function HomeScreen() {
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
      <Tab.Screen name="Activities" component={ActivitiesStackNavigator} />
      <Tab.Screen name="Feed" component={FeedStackNavigator} />
      <Tab.Screen name="Maps" component={MapsScreen} />
      <Tab.Screen name="Select Bars" component={SelectBarsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
