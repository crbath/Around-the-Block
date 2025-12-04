import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';

const MOCK_FRIENDS = [
  { id: '1', username: 'alice', name: 'Alice Johnson' },
  { id: '2', username: 'bob', name: 'Bob Smith' },
  { id: '3', username: 'carol', name: 'Carol Williams' },
];

export default function FriendsScreen({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadFriends(); }, []);

  async function loadFriends() {
    try {
      const res = await api.get('/friends');
      setFriends(res.data);
    } catch (err) {
      setFriends(MOCK_FRIENDS);
    }
    setLoading(false);
  }

  function handleAddFriend() { console.log('add friend button pressed'); }
  function handleFriendPress(friend) { navigation.navigate('FriendProfile', { friend }); }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Friends</Text>
          <TouchableOpacity onPress={handleAddFriend} style={styles.addButton}>
            <Ionicons name="add" size={28} color="#7EA0FF" />
          </TouchableOpacity>
        </View>
        <View style={styles.center}><ActivityIndicator size="large" color="#7EA0FF" /></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friends</Text>
        <TouchableOpacity onPress={handleAddFriend} style={styles.addButton}>
          <Ionicons name="add" size={28} color="#7EA0FF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.friendItem} onPress={() => handleFriendPress(item)}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{item.username ? item.username[0].toUpperCase() : '?'}</Text></View>
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{item.name || item.username}</Text>
              <Text style={styles.friendUsername}>@{item.username}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9BA1A6" />
          </TouchableOpacity>
        )}
      />

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
  container: { flex: 1, backgroundColor: '#0B0D17' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: '#0B0D17' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  backButton: { padding: 8 },
  addButton: { padding: 8 },
  friendItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#1A1A2E', margin: 12, borderRadius: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#7EA0FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  friendInfo: { flex: 1 },
  friendName: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  friendUsername: { color: '#9BA1A6', fontSize: 14 },
  addButtonBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#7EA0FF', margin: 16, padding: 14, borderRadius: 10 },
  addButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});
