// firebase storage helper for uploading images
// handles uploading images to firebase and returning urls that we save in mongodb

import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// firebase config (important: EXPO_PUBLIC_ prefix makes these available in mobile apps)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || ""
};

// initialize firebase
let app;
let storage;

try {
  app = initializeApp(firebaseConfig);
  storage = getStorage(app);
} catch (error) {
  console.warn("Firebase not configured. Image uploads will not work until Firebase is set up.");
  console.warn("Error:", error.message);
}

// main upload function (important: converts local uri to blob, uploads to firebase, returns download url)
export async function uploadImageToFirebase(imageUri, folder = 'posts', userId = '') {
  if (!storage) {
    throw new Error("Firebase Storage not initialized. Please configure Firebase first.");
  }

  try {
    // convert local uri to blob (important: react native needs this format)
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();

    // create unique filename with timestamp (important: prevents file collisions)
    const timestamp = Date.now();
    const filename = userId 
      ? `${folder}/${userId}_${timestamp}.jpg`
      : `${folder}/${timestamp}.jpg`;

    // create storage reference and upload
    const storageRef = ref(storage, filename);
    const uploadTask = uploadBytesResumable(storageRef, blob);

    // wait for upload to complete (important: tracks progress, handles errors)
    await new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
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

    // get download url (important: this is what we save in mongodb, not the file itself)
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image to Firebase:", error);
    throw error;
  }
}

// upload profile picture (wrapper function for profiles folder)
export async function uploadProfilePicture(imageUri, userId) {
  return uploadImageToFirebase(imageUri, 'profiles', userId);
}

// upload post image (wrapper function for posts folder)
export async function uploadPostImage(imageUri, userId) {
  return uploadImageToFirebase(imageUri, 'posts', userId);
}

