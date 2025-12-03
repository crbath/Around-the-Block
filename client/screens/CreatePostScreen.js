import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CreatePostScreen({ navigation }) {
  // state for the post text, image uri, and whether we're submitting
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // opens the phone's photo gallery so user can pick an image
  async function pickImage() {
    // first we need to ask permission to access photos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to add an image.');
      return;
    }

    // open the image picker with some options
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // let them crop/edit the image
      aspect: [4, 3], // maintain aspect ratio
      quality: 0.8, // compress it a bit
    });

    // if they didn't cancel, save the image uri
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  }

  // when user clicks the post button, submit everything
  async function handleSubmit() {
    // make sure they at least added text or an image
    if (!text.trim() && !image) {
      Alert.alert('Empty post', 'Please add some text or an image to your post.');
      return;
    }

    setSubmitting(true);
    try {
      // get the current user's username from storage
      const user = await AsyncStorage.getItem('user');
      const username = user ? JSON.parse(user) : 'You';

      // package up all the post data
      const postData = {
        text: text.trim(),
        image: image || null,
        username: username,
      };

      // send it to the backend
      await api.post('/posts', postData);

      // go back to feed after successful post
      navigation.goBack();
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    }
    setSubmitting(false);
  }

  return (
    <View style={styles.container}>
      {/* header with close button and post button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        {/* post button - disabled and grayed out while submitting */}
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.postButton, submitting && styles.postButtonDisabled]}
          disabled={submitting}
        >
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
      </View>

      {/* main content area */}
      <View style={styles.content}>
        {/* text input for the post */}
        <TextInput
          style={styles.textInput}
          placeholder="What's up?"
          placeholderTextColor="#9BA1A6"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          autoFocus
        />

        {/* show image preview if user selected one */}
        {image && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.previewImage} />
            {/* button to remove the image */}
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setImage(null)}
            >
              <Ionicons name="close-circle" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* button to open photo picker */}
        <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
          <Ionicons name="image-outline" size={24} color="#7EA0FF" />
          <Text style={styles.addImageText}>Add Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D17',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#0B0D17',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#7EA0FF',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative', // so we can position the remove button absolutely inside it
    marginBottom: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A1A2E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7EA0FF',
    borderStyle: 'dashed',
  },
  addImageText: {
    color: '#7EA0FF',
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
});

