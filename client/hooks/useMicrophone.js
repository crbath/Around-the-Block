import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';

export const useMicrophone = () => {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingUri, setRecordingUri] = useState(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [micLevel, setMicLevel] = useState(0);

  useEffect(() => {
    // Configure audio mode for recording with better settings
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });

    // Cleanup function
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      if (permissionResponse.status !== 'granted') {
        console.log('Requesting permission..');
        const permission = await requestPermission();
        if (permission.status !== 'granted') {
          Alert.alert('Permission Required', 'Sorry, we need microphone permissions to make this work!');
          return false;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      console.log('Starting recording..');
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 1, // Mono for better volume
          bitRate: 256000, // Higher bitrate
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
          sampleRate: 44100,
          numberOfChannels: 1, // Mono for better volume
          bitRate: 256000, // Higher bitrate
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };
      
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started');
      return true;
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
      return false;
    }
  };

  const startRecordingWithGainCheck = async () => {
    try {
      if (permissionResponse.status !== 'granted') {
        console.log('Requesting permission..');
        const permission = await requestPermission();
        if (permission.status !== 'granted') {
          Alert.alert('Permission Required', 'Sorry, we need microphone permissions to make this work!');
          return false;
        }
      }

      // Set audio mode with optimal settings for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false, // Don't duck during recording
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      console.log('Starting recording with enhanced settings..');
      
      // Try HIGH_QUALITY preset first, then custom if that fails
      let recordingOptions;
      
      try {
        // First try the built-in high quality preset
        recordingOptions = Audio.RecordingOptionsPresets.HIGH_QUALITY;
      } catch (presetError) {
        // Fallback to custom options
        recordingOptions = {
          android: {
            extension: '.m4a',
            outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
            audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
            sampleRate: 44100,
            numberOfChannels: 1, // Mono for better volume
            bitRate: 256000, // Higher bitrate
          },
          ios: {
            extension: '.m4a',
            outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
            audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
            sampleRate: 44100,
            numberOfChannels: 1, // Mono for better volume
            bitRate: 256000, // Higher bitrate
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
        };
      }
      
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      
      // Monitor recording levels
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.metering !== undefined) {
          setMicLevel(status.metering);
          // Alert if recording level is too low
          if (status.metering < -40) {
            console.log('Low microphone input detected. Speak louder or move closer.');
          }
        }
      });
      
      setRecording(recording);
      setIsRecording(true);
      console.log('Recording started with monitoring');
      
      // Show recording tip
      Alert.alert(
        'Recording Started!', 
        'Speak clearly and close to the microphone for best results. The recording will be louder if you speak directly into the mic.',
        [{ text: 'Got it!' }]
      );
      
      return true;
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Recording Error', `Failed to start recording: ${err.message}`);
      return false;
    }
  };

  const stopRecording = async () => {
    if (!recording) return null;

    try {
      console.log('Stopping recording..');
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);
      setRecordingUri(uri);
      
      // Load the sound for playback with volume settings
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: false,
          volume: 1.0,
          isMuted: false,
        }
      );
      setSound(sound);
      setRecording(null);
      
      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
      return null;
    }
  };

  const playRecording = async () => {
    if (sound) {
      try {
        setIsPlaying(true);
        
        // Set the volume to maximum before playing
        await sound.setVolumeAsync(1.0);
        await sound.replayAsync();
        
        // Listen for playback completion
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      } catch (error) {
        console.error('Error playing recording:', error);
        setIsPlaying(false);
      }
    }
  };

  const checkVolumeAndPlay = async () => {
    if (sound) {
      try {
        // Check if device is muted or volume is low
        const status = await sound.getStatusAsync();
        
        setIsPlaying(true);
        
        // Ensure audio mode is set for playback with maximum volume
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });
        
        // Set the volume to maximum and ensure proper playback
        await sound.setVolumeAsync(1.0);
        await sound.setStatusAsync({ 
          shouldPlay: true,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true 
        });
        
        // Listen for playback completion
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
            // Reset audio mode back to recording after playback
            Audio.setAudioModeAsync({
              allowsRecordingIOS: true,
              playsInSilentModeIOS: true,
              shouldDuckAndroid: true,
              playThroughEarpieceAndroid: false,
              staysActiveInBackground: false,
            });
          }
        });
      } catch (error) {
        console.error('Error playing recording:', error);
        setIsPlaying(false);
        Alert.alert(
          'Playback Issue', 
          'Make sure your device volume is up and not in silent mode. You can also try using headphones for better audio quality.'
        );
      }
    }
  };

  const resetRecording = () => {
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
    setRecordingUri(null);
    setIsRecording(false);
  };

  return {
    isRecording,
    isPlaying,
    hasRecording: !!sound,
    recordingUri,
    startRecording,
    startRecordingWithGainCheck,
    stopRecording,
    playRecording,
    checkVolumeAndPlay,
    resetRecording,
    cleanupAllAudio,
    permissionGranted: permissionResponse?.status === 'granted'
  };
};
