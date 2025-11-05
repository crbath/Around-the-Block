import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function FriendProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { friend } = route.params || {};

  // Temporary fallback (in case navigation data is missing)
  const friendData = friend || {
    name: 'Colin',
    age: 21,
    friendsCount: 67,
    image: require('../assets/images/talking_ben.png'),
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Profile section */}
      <View style={styles.profileSection}>
        <Image source={friendData.image} style={styles.profileImage} />
        <Text style={styles.name}>{friendData.name}</Text>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Age: {friendData.age}</Text>
          <Text style={styles.infoText}>{friendData.friendsCount} friends</Text>
        </View>
      </View>

      {/* Memories section */}
      <View style={styles.memoriesContainer}>
        <Text style={styles.memoriesText}>No memories...{'\n'}yet.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D17',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  infoContainer: {
    backgroundColor: '#1C1F2E',
    borderRadius: 12,
    padding: 10,
    width: '80%',
    alignItems: 'center',
  },
  infoText: {
    color: '#ccc',
    fontSize: 16,
    marginVertical: 3,
  },
  memoriesContainer: {
    backgroundColor: '#1C1F2E',
    borderRadius: 15,
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memoriesText: {
    color: '#aaa',
    fontSize: 18,
    textAlign: 'center',
  },
});
