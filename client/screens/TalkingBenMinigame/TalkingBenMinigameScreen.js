import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Audio } from 'expo-av';

export default function TalkingBenMinigameScreen({ navigation }) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [benResponse, setBenResponse] = useState(null);

  const benResponses = ['YES', 'NO', 'EUGHHH', 'HEHEHE'];

  const getBenResponse = () => {
    let response;
    if (!benResponse){
      const randomIndex = Math.floor(Math.random() * benResponses.length);
      response = benResponses[randomIndex];
    } else {
      response = benResponse;
    }
    
    setBenResponse(response);
    
    Alert.alert(
      '\ud83d\udc36 Talking Ben Says:',
      `"${response}"`,
      [{ text: 'Dismiss', onPress: () => console.log('Ben response dismissed') }],
    );
  };

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
    });

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
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Microphone permission required');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', `Recording failed: ${err.message}`);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    
    const uri = recording.getURI();
    const { sound } = await Audio.Sound.createAsync({ uri });
    setSound(sound);
    setRecording(null);
    
    Alert.alert('Recording Complete!');
  };

  const playRecording = async () => {
    if (!sound) return;
    
    try {
      setIsPlaying(true);
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
      });
      await sound.setVolumeAsync(1.0);
      await sound.replayAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing recording:', error);
      Alert.alert('Playback Error', error.message);
      setIsPlaying(false);
    }
  };

  const resetRecording = () => {
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
    setIsRecording(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Talking Ben Minigame</Text>
      <Image source={require('../../assets/images/talking_ben.png')} style={styles.benImage} />
      <Text style={styles.subtitle}>Talk to Ben and hear him respond!</Text>
      
      <View style={styles.microphoneContainer}>
        {!isRecording && !sound && (
          <TouchableOpacity 
            style={styles.micButton} 
            onPress={startRecording}
          >
            <Text style={styles.micButtonText}>Ask Talking Ben A Question</Text>
          </TouchableOpacity>
        )}
        
        {isRecording && (
          <TouchableOpacity 
            style={[styles.micButton, styles.stopButton]} 
            onPress={stopRecording}
          >
            <Text style={styles.micButtonText}>Stop Recording</Text>
          </TouchableOpacity>
        )}
        
        {sound && (
          <View style={styles.playbackContainer}>
            <TouchableOpacity 
              style={styles.playButton} 
              onPress={playRecording}
              disabled={isPlaying}
            >
              <Text style={styles.buttonText}>
                {isPlaying ? 'Playing...' : 'Play Question'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.benResponseButton} 
              onPress={getBenResponse}
            >
              <Text style={styles.buttonText}>Get Ben's Response</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={() => {
                resetRecording();
                setBenResponse(null);
              }}
            >
              <Text style={styles.buttonText}>Record Another Question</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {isRecording && (
          <Text style={styles.recordingIndicator}>Recording...</Text>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0D17',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  benImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  subtitle: {
    color: '#ccc',
    fontSize: 18,
    marginBottom: 40,
  },
  backButton: {
    backgroundColor: '#2C2C2E',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  microphoneContainer: {
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  micButton: {
    backgroundColor: '#7EA0FF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginVertical: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#FF6B6B',
  },
  micButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playbackContainer: {
    alignItems: 'center',
    width: '100%',
  },
  playButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginVertical: 5,
    minWidth: 200,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#95A5A6',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginVertical: 5,
    minWidth: 150,
    alignItems: 'center',
  },
  benResponseButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginVertical: 5,
    minWidth: 200,
    alignItems: 'center',
  },
  recordingIndicator: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
});
