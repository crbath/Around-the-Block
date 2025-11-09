import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useMicrophone } from '../hooks/useMicrophone';

export default function MicrophoneButton({ 
  onRecordingComplete, 
  style = {},
  recordButtonText = "Start Recording",
  stopButtonText = "Stop Recording",
  playButtonText = "Play Question",
  resetButtonText = "Ask Ben Another Question"
}) {
  const {
    isRecording,
    isPlaying,
    hasRecording,
    startRecording,
    stopRecording,
    playRecording,
    checkVolumeAndPlay,
    resetRecording
  } = useMicrophone();

  const handleStopRecording = async () => {
    const uri = await stopRecording();
    if (uri && onRecordingComplete) {
      onRecordingComplete(uri);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {!isRecording && !hasRecording && (
        <TouchableOpacity 
          style={styles.recordButton} 
          onPress={startRecording}
        >
          <Text style={styles.buttonText}>{recordButtonText}</Text>
        </TouchableOpacity>
      )}
      
      {isRecording && (
        <View style={styles.recordingContainer}>
          <TouchableOpacity 
            style={styles.stopButton} 
            onPress={handleStopRecording}
          >
            <Text style={styles.buttonText}>{stopButtonText}</Text>
          </TouchableOpacity>
          <Text style={styles.recordingIndicator}>🔴 Recording...</Text>
        </View>
      )}
      
      {hasRecording && (
        <View style={styles.playbackContainer}>
          <TouchableOpacity 
            style={styles.playButton} 
            onPress={checkVolumeAndPlay}
            disabled={isPlaying}
          >
            <Text style={styles.buttonText}>
              {isPlaying ? '🔊 Playing...' : playButtonText}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.resetButton} 
            onPress={resetRecording}
          >
            <Text style={styles.buttonText}>{resetButtonText}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  recordButton: {
    backgroundColor: '#7EA0FF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordingContainer: {
    alignItems: 'center',
  },
  playbackContainer: {
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
