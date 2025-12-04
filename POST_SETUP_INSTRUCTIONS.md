# Post Feature Setup Instructions

## ✅ What's Been Implemented

### Backend (server.js)
- ✅ Post schema with MongoDB
- ✅ POST `/posts` - Create a new post
- ✅ GET `/posts` - Get all posts for feed
- ✅ GET `/posts/user/:userId` - Get posts by specific user
- ✅ POST `/posts/:postId/like` - Like/unlike a post
- ✅ DELETE `/posts/:postId` - Delete a post
- ✅ User schema updated with `profilePicUrl` field
- ✅ Login route now returns `userId`

### Frontend
- ✅ Firebase configuration file (`client/utils/firebase.js`)
- ✅ API client updated with post endpoints and auth headers (`client/api/api.js`)
- ✅ CreatePostScreen - New screen for creating posts with image upload
- ✅ FeedScreen - Updated to fetch and display posts from backend
- ✅ ProfileScreen - Shows user's own posts
- ✅ FriendProfileScreen - Shows friend's posts
- ✅ PostCard - Updated to handle new post structure and like functionality
- ✅ Navigation - CreatePostScreen added to FeedStack

## 📋 Setup Steps

### 1. Install Firebase Package

```bash
cd client
npm install firebase
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable **Firebase Storage**
4. Go to Project Settings → General → Your apps
5. Add a web app and copy the config
6. Create a `.env` file in the `client` directory with:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Set Firebase Storage Rules

In Firebase Console → Storage → Rules, set:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /posts/{postId} {
      allow write: if request.auth != null;
      allow read: if true;
    }
    match /profiles/{userId} {
      allow write: if request.auth != null;
      allow read: if true;
    }
  }
}
```

### 4. MongoDB Collection

The `posts` collection will be created automatically when the first post is created. No manual setup needed!

### 5. Update API Base URL

Make sure `client/api/api.js` has the correct backend URL:
```javascript
const BASE_URL = "http://YOUR_IP_ADDRESS:5000";
```

## 🚀 How to Use

1. **Create a Post:**
   - Go to Feed screen
   - Tap the "+" button in the header
   - Write your post content
   - Optionally add an image
   - Tap "Post"

2. **View Posts:**
   - Feed screen shows all posts
   - Profile screen shows your posts
   - Friend profile shows their posts

3. **Like a Post:**
   - Tap the heart icon on any post

4. **Upload Profile Picture:**
   - Go to Profile screen
   - Tap on the profile picture area
   - Select an image from your gallery

## 📝 Post Data Structure

```javascript
{
  userId: ObjectId,
  username: String,
  content: String,
  imageUrl: String (Firebase Storage URL),
  profilePicUrl: String (Firebase Storage URL),
  likes: Number,
  likedBy: [ObjectId],
  createdAt: Date
}
```

## 🔧 Troubleshooting

- **Images not uploading?** Check Firebase Storage rules and configuration
- **Posts not appearing?** Check backend server is running and MongoDB connection
- **Authentication errors?** Make sure token is stored in AsyncStorage after login

## 📦 Dependencies Added

- `firebase` (needs to be installed)
- Uses existing: `expo-image-picker`, `@react-native-async-storage/async-storage`

