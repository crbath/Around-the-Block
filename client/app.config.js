import 'dotenv/config';

export default {
  "expo": {
    "name": "client",
    "slug": "client",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "client",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "NSMicrophoneUsageDescription": "This app needs access to microphone for voice recording features in games and activities.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "This app needs access to your location to automatically check you into locations and show your friends where you are.",
        "NSLocationAlwaysUsageDescription": "This app needs access to your location to automatically check you into locations even when the app is in the background.",
        "NSLocationWhenInUseUsageDescription": "This app needs access to your location to automatically check you into locations.",
        "UIBackgroundModes": ["location"]
      },
      "config": {
        "googleMapsApiKey": process.env.GOOGLE_MAPS_API_KEY
      }
    },
    "android": {
      "package": "com.anonymous.client",
      "permissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_BACKGROUND_LOCATION"
      ],
      "config": {
        "googleMapsApiKey": process.env.GOOGLE_MAPS_API_KEY
      },
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false
    },
    "web": {
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "dark": {
            "backgroundColor": "#000000"
          }
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "This app needs access to your location to automatically check you into locations and show your friends where you are.",
          "locationAlwaysPermission": "This app needs access to your location to automatically check you into locations even when the app is in the background.",
          "locationWhenInUsePermission": "This app needs access to your location to automatically check you into locations."
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    }
  }
}
