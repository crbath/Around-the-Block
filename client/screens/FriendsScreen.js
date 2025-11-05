import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function FriendsScreen() {
  const navigation = useNavigation();

  const [searchQuery, setSearchQuery] = useState('');

  // Dummy data for friends
  const friends = [
    { id: '1', name: 'Colin', lastSeen: 'Kollege Klub', hoursAgo: 12 },
    { id: '2', name: 'Elden', lastSeen: "Monday's", hoursAgo: 8 },
    { id: '3', name: 'Kate', lastSeen: 'Red Rock', hoursAgo: 10 },
  ];

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFriend = ({ item }) => (
    <TouchableOpacity
      style={styles.friendCard}
      onPress={() => navigation.navigate('FriendProfile', { friend: item })}
    >
      <Image
        source={require('../assets/images/talking_ben.png')}
        style={styles.avatar}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.details}>
          Last seen at {item.lastSeen} {item.hoursAgo} hrs ago
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search for a friend"
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredFriends}
        keyExtractor={(item) => item.id}
        renderItem={renderFriend}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D17',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  searchInput: {
    backgroundColor: '#1C1F2E',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  friendCard: {
    flexDirection: 'row',
    backgroundColor: '#1C1F2E',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    marginRight: 15,
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  details: {
    color: '#bbb',
    fontSize: 14,
    marginTop: 2,
  },
});
