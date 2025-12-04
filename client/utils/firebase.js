// Firebase Storage helper for uploading images
// This file handles uploading images to Firebase Storage and returning URLs
// Works on iOS, Android, and Web - ready for app store deployment

// Note: You'll need to install firebase package:
// npm install firebase
// Then configure Firebase with your credentials

import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Firebase configuration - works on iOS, Android, and Web
// EXPO_PUBLIC_ prefix makes these available in mobile apps during build
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || ""
};

// Initialize Firebase
let app;
let storage;

try {
  app = initializeApp(firebaseConfig);
  storage = getStorage(app);
} catch (error) {
  console.warn("Firebase not configured. Image uploads will not work until Firebase is set up.");
  console.warn("Error:", error.message);
}

/**
 * Upload an image to Firebase Storage
 * @param {string} imageUri - Local URI of the image (from expo-image-picker)
 * @param {string} folder - Folder name ('posts' or 'profiles')
 * @param {string} userId - User ID for unique naming
 * @returns {Promise<string>} - Download URL of the uploaded image
 */
export async function uploadImageToFirebase(imageUri, folder = 'posts', userId = '') {
  if (!storage) {
    throw new Error("Firebase Storage not initialized. Please configure Firebase first.");
  }

  try {
    // Convert local URI to blob for upload (works in React Native)
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();

    // Create a unique filename
    const timestamp = Date.now();
    const filename = userId 
      ? `${folder}/${userId}_${timestamp}.jpg`
      : `${folder}/${timestamp}.jpg`;

    // Create a reference to the file
    const storageRef = ref(storage, filename);

    // Upload the file
    const uploadTask = uploadBytesResumable(storageRef, blob);

    // Wait for upload to complete
    await new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // You can track upload progress here if needed
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          console.error("Upload error:", error);
          reject(error);
        },
        () => {
          resolve();
        }
      );
    });

    // Get the download URL
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image to Firebase:", error);
    throw error;
  }
}

/**
 * Upload a profile picture to Firebase Storage
 * @param {string} imageUri - Local URI of the image
 * @param {string} userId - User ID
 * @returns {Promise<string>} - Download URL of the uploaded image
 */
export async function uploadProfilePicture(imageUri, userId) {
  return uploadImageToFirebase(imageUri, 'profiles', userId);
}

/**
 * Upload a post image to Firebase Storage
 * @param {string} imageUri - Local URI of the image
 * @param {string} userId - User ID
 * @returns {Promise<string>} - Download URL of the uploaded image
 */
export async function uploadPostImage(imageUri, userId) {
  return uploadImageToFirebase(imageUri, 'posts', userId);
}

