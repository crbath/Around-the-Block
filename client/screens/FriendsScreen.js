import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';

// mock data to use when backend isn't available
const MOCK_FRIENDS = [
  { id: '1', username: 'alice', name: 'Alice Johnson' },
  { id: '2', username: 'bob', name: 'Bob Smith' },
  { id: '3', username: 'carol', name: 'Carol Williams' },
];

export default function FriendsScreen({ navigation }) {

  const [friends, setFriends] = useState([]); // friends
  const [loading, setLoading] = useState(true); // whether we're loading data

  // load friends when screen first loads
  useEffect(() => {
    loadFriends();
  }, []);

  // function to fetch friends from backend or use mock data
  async function loadFriends() {
    try {
      // try to get friends from backend API
      const res = await api.get('/friends');
      setFriends(res.data);
    } catch (err) {
      // use mock data if backend fails
      setFriends(MOCK_FRIENDS);
    }
    setLoading(false); // done loading
  }

  // // click add friend button
  function handleAddFriend() {
     console.log('add friend button pressed');
     // TODO: add friend functionality

 }

  // // handle when user clicks on a friend in the list
  // function handleFriendPress(friend) {
  //   console.log('friend clicked:', friend.username);
  //   // TODO: navigate to friend profile

  // }

  // show loading spinner while data is being fetched
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          {/* Back button to return to feed */}
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >

            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Friends</Text>
          {/* Add friend button in header */}
          <TouchableOpacity 
            onPress={handleAddFriend}
            style={styles.addButton}
          >

            <Ionicons name="add" size={28} color="#7EA0FF" />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7EA0FF" />
        </View>
      </View>
    );
  }

  // show friends list
  return (
    <View style={styles.container}>

      <View style={styles.header}>
        {/* back button to return to feed screen */}
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >

          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friends</Text>
        {/* add friend button in top right */}
        <TouchableOpacity 
          onPress={handleAddFriend}
          style={styles.addButton}
        >

          <Ionicons name="add" size={28} color="#7EA0FF" />
        </TouchableOpacity>
      </View>

      <FlatList
        
        data={friends} // Array of friends to display
        keyExtractor={(item) => item.id} // Unique key for each friend
        renderItem={({ item }) => {


          return (
            <TouchableOpacity
              style={styles.friendItem}
              onPress={() => handleFriendPress(item)}
            >
              {/* avatar circle with first letter of username */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.username ? item.username[0].toUpperCase() : '?'}
                </Text>
              </View>
              {/* friend's name and username */}
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{item.name || item.username}</Text>
                <Text style={styles.friendUsername}>@{item.username}</Text>
              </View>
              {/* arrow icon indicating it's clickable */}
              <Ionicons name="chevron-forward" size={20} color="#9BA1A6" />
            </TouchableOpacity>
          );
        }}
      />

      {/* add Friends button at bottom */}
      {friends.length > 0 && (
        <TouchableOpacity style={styles.addButtonBottom} onPress={handleAddFriend}>
          <Ionicons name="person-add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Friends</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D17',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#0B0D17',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A1A2E',
    margin: 12,
    borderRadius: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#7EA0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendUsername: {
    color: '#9BA1A6',
    fontSize: 14,
  },
  addButtonBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7EA0FF',
    margin: 16,
    padding: 14,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
