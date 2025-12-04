import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFriends, addFriend } from '../../api/api';

const MOCK_FRIENDS = [
  { id: '1', username: 'alice', name: 'Alice Johnson' },
  { id: '2', username: 'bob', name: 'Bob Smith' },
  { id: '3', username: 'carol', name: 'Carol Williams' },
];

export default function FriendsScreen({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);

  useEffect(() => { loadFriends(); }, []);

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

  async function handleAddFriend() {
    setModalVisible(true);
  }

  async function handleSubmitAddFriend() {
    if (!usernameInput.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    try {
      setAddingFriend(true);
      const res = await addFriend(usernameInput.trim());
      Alert.alert('Success', res.data.message || 'Friend added successfully!');
      setModalVisible(false);
      setUsernameInput('');
      // Reload friends list
      await loadFriends();
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
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Friend</Text>
            <Text style={styles.modalSubtitle}>Enter a username to add as a friend</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#9BA1A6"
              value={usernameInput}
              onChangeText={setUsernameInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setUsernameInput('');
                }}
                disabled={addingFriend}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmitAddFriend}
                disabled={addingFriend}
              >
                {addingFriend ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Add</Text>
                )}
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
  input: { backgroundColor: '#0B0D17', borderRadius: 10, padding: 12, color: '#FFFFFF', fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modalButton: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  cancelButton: { backgroundColor: '#333' },
  cancelButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  submitButton: { backgroundColor: '#7EA0FF' },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
