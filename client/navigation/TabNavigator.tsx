import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/Home/HomeScreen';
import ExploreScreen from '../screens/Explore/ExploreScreen';
import MapsScreen from '../screens/Maps/MapsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Map: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: { name: keyof TabParamList | string } }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0B0D17', borderTopColor: '#1A1A2E' },
        tabBarActiveTintColor: '#7EA0FF',
        tabBarInactiveTintColor: '#9BA1A6',
        tabBarIcon: ({ color, size }: { color: string; size: number }) => {
          const name = route.name === 'Home'
            ? 'home'
            : route.name === 'Explore'
            ? 'compass'
            : route.name === 'Map'
            ? 'map'
            : 'person';
          return <Ionicons name={name as any} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Map" component={MapsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
