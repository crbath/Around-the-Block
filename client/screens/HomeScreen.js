import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ActivitiesScreen from './ActivitiesScreen';
import FeedScreen from './FeedScreen';
import MapsScreen from './MapsScreen';
import SelectBarsScreen from './SelectBarsScreen';
import ProfileScreen from './ProfileScreen';

const Tab = createBottomTabNavigator();

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
      <Tab.Screen name="Activities" component={ActivitiesScreen} />
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Maps" component={MapsScreen} />
      <Tab.Screen name="Select Bars" component={SelectBarsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
