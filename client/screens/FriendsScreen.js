import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllUsers, getFriends, addFriend, removeFriend } from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FriendsScreen({ navigation }) {
  // state: friends list, all users list, loading, modal visibility, search query, current user id
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  // load friends and user id when screen first loads
  useEffect(() => {
    loadData();
  }, []);

  // reload friends when screen comes into focus (important: updates list after adding/removing)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFriends();
    });
    return unsubscribe;
  }, [navigation]);

  async function loadData() {
    try {
      // get current user id (important: used to filter out self from add friends list)
      const userId = await AsyncStorage.getItem('userId');
      setCurrentUserId(userId);
      
      await loadFriends();
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  }

  // fetch friends from backend
  async function loadFriends() {
    try {
      const res = await getFriends();
      setFriends(res.data || []);
    } catch (err) {
      console.error('Error loading friends:', err);
      setFriends([]);
    }
  }

  // load all users when opening add friend modal (important: only loads when modal opens, not on mount)
  async function loadAllUsers() {
    try {
      const res = await getAllUsers();
      setAllUsers(res.data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      Alert.alert('Error', 'Failed to load users');
    }
  }

  // open add friend modal and load users
  function handleAddFriend() {
    loadAllUsers();
    setShowAddFriendModal(true);
  }

  // close modal and reset search
  function handleCloseModal() {
    setShowAddFriendModal(false);
    setSearchQuery('');
  }

  // add friend (important: reloads friends list after adding)
  async function handleAddFriendPress(user) {
    try {
      await addFriend(user.id);
      Alert.alert('Success', `Added ${user.username} as a friend!`);
      await loadFriends();
      handleCloseModal();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to add friend';
      Alert.alert('Error', errorMsg);
    }
  }

  // remove friend
  async function handleRemoveFriend(userId, username) {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(userId);
              Alert.alert('Success', 'Friend removed');
              await loadFriends(); // Reload friends list
            } catch (error) {
              Alert.alert('Error', 'Failed to remove friend');
            }
          },
        },
      ]
    );
  }

  // filter users: exclude self, exclude existing friends, match search query (important: this is what shows in add friends modal)
  const filteredUsers = allUsers.filter(user => {
    const isNotCurrentUser = user.id !== currentUserId;
    const isNotFriend = !friends.some(friend => friend.id === user.id);
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase());
    return isNotCurrentUser && isNotFriend && matchesSearch;
  });

  // Show loading spinner
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
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7EA0FF" />
        </View>
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

      {friends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#9BA1A6" />
          <Text style={styles.emptyText}>No friends yet</Text>
          <Text style={styles.emptySubtext}>Tap the + button to add friends</Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.friendItem}
              onPress={() => navigation.navigate('FriendProfile', { friend: item })}
            >
              {item.profilePicUrl ? (
                <Image source={{ uri: item.profilePicUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.username ? item.username[0].toUpperCase() : '?'}
                  </Text>
                </View>
              )}
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{item.username}</Text>
                {item.birthday && (
                  <Text style={styles.friendUsername}>Birthday: {item.birthday}</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveFriend(item.id, item.username)}
                style={styles.removeButton}
              >
                <Ionicons name="close-circle" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add Friend Modal */}
      <Modal
        visible={showAddFriendModal}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Friends</Text>
            <View style={styles.closeButton} />
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#9BA1A6"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {filteredUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userItem}
                  onPress={() => handleAddFriendPress(item)}
                >
                  {item.profilePicUrl ? (
                    <Image source={{ uri: item.profilePicUrl }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {item.username ? item.username[0].toUpperCase() : '?'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{item.username}</Text>
                    {item.birthday && (
                      <Text style={styles.friendUsername}>Birthday: {item.birthday}</Text>
                    )}
                  </View>
                  <Ionicons name="person-add" size={24} color="#7EA0FF" />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
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
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A1A2E',
    marginHorizontal: 16,
    marginVertical: 8,
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
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#9BA1A6',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0B0D17',
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    backgroundColor: '#1A1A2E',
    color: '#FFFFFF',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    fontSize: 16,
  },
});
