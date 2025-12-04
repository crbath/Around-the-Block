import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFriends, addFriend, getAllUsers } from '../../api/api';

const MOCK_FRIENDS = [
  { id: '1', username: 'alice', name: 'Alice Johnson' },
  { id: '2', username: 'bob', name: 'Bob Smith' },
  { id: '3', username: 'carol', name: 'Carol Williams' },
];

export default function FriendsScreen({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [addingFriend, setAddingFriend] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => { loadFriends(); }, []);

  useEffect(() => {
    if (modalVisible) {
      loadAvailableUsers();
    }
  }, [modalVisible]);

  async function loadFriends() {
    try {
      setLoading(true);
      const res = await getFriends();
      setFriends(res.data || []);
    } catch (err) {
      console.error('Error loading friends:', err);
      // Only use mock data if there's an actual error, not if friends list is empty
      if (err.response?.status === 404 || err.response?.status === 401) {
        setFriends([]);
      } else {
        setFriends(MOCK_FRIENDS);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableUsers() {
    try {
      setLoadingUsers(true);
      const res = await getAllUsers();
      console.log('Available users response:', res.data);
      setAvailableUsers(res.data || []);
    } catch (err) {
      console.error('Error loading available users:', err);
      console.error('Error details:', err.response?.data);
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleAddFriend() {
    setModalVisible(true);
  }

  async function handleAddFriendByUsername(username) {
    if (!username || !username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    try {
      setAddingFriend(true);
      const res = await addFriend(username.trim());
      Alert.alert('Success', res.data.message || 'Friend added successfully!');
      setModalVisible(false);
      // Reload friends list and available users
      await loadFriends();
      await loadAvailableUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add friend';
      Alert.alert('Error', errorMessage);
    } finally {
      setAddingFriend(false);
    }
  }


  function handleFriendPress(friend) { 
    navigation.navigate('FriendProfile', { friend }); 
  }

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

      {/* Add Friend Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Friend</Text>
            <Text style={styles.modalSubtitle}>Select a user to add as a friend</Text>

            {/* Users List */}
            {loadingUsers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#7EA0FF" />
              </View>
            ) : availableUsers.length > 0 ? (
              <View style={styles.usersListContainer}>
                <FlatList
                  data={availableUsers}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.userItem}
                      onPress={() => handleAddFriendByUsername(item.username)}
                      disabled={addingFriend}
                    >
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {item.username ? item.username[0].toUpperCase() : '?'}
                        </Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>@{item.username}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.addIconButton}
                        onPress={() => handleAddFriendByUsername(item.username)}
                        disabled={addingFriend}
                      >
                        <Ionicons name="person-add" size={20} color="#7EA0FF" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  )}
                  style={styles.usersList}
                  nestedScrollEnabled={true}
                />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users available to add</Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                }}
                disabled={addingFriend}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1A1A2E', borderRadius: 20, padding: 24, width: '80%', maxWidth: 400 },
  modalTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { color: '#9BA1A6', fontSize: 14, marginBottom: 20, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  modalButton: { padding: 14, borderRadius: 10, alignItems: 'center', minWidth: 100 },
  cancelButton: { backgroundColor: '#333' },
  cancelButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  usersListContainer: { maxHeight: 300, marginBottom: 20 },
  usersList: { flexGrow: 0 },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#0B0D17', borderRadius: 8, marginBottom: 8 },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  addIconButton: { padding: 8 },
  loadingContainer: { alignItems: 'center', padding: 20 },
  emptyContainer: { alignItems: 'center', padding: 20 },
  emptyText: { color: '#9BA1A6', fontSize: 14, textAlign: 'center' },
});
