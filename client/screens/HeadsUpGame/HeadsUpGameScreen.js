import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as ScreenOrientation from 'expo-screen-orientation';

const WORD_CATEGORIES = {
  animals: ['Dog', 'Cat', 'Elephant', 'Lion', 'Tiger', 'Giraffe', 'Penguin', 'Dolphin', 'Kangaroo', 'Zebra'],
  food: ['Pizza', 'Burger', 'Sushi', 'Taco', 'Pasta', 'Salad', 'Steak', 'Ice Cream', 'Donut', 'Sandwich'],
  movies: ['Titanic', 'Avatar', 'Inception', 'Frozen', 'Shrek', 'Star Wars', 'Harry Potter', 'Jurassic Park'],
  actions: ['Dancing', 'Swimming', 'Running', 'Singing', 'Cooking', 'Drawing', 'Laughing', 'Sleeping'],
};

const GAME_DURATION = 60; // 60 seconds per round
const TILT_THRESHOLD = 0.6; // Threshold for detecting tilt up/down

export default function HeadsUpGameScreen({ navigation }) {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'finished'
  const [currentWord, setCurrentWord] = useState('');
  const [score, setScore] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [wordList, setWordList] = useState([]);
  const [wordIndex, setWordIndex] = useState(0);
  
  const tiltAnim = useRef(new Animated.Value(0)).current;
  const lastTiltAction = useRef(null);
  const timerRef = useRef(null);
  const subscriptionRef = useRef(null);
  const wordListRef = useRef([]);
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    if (gameState === 'playing') {
      // Lock to landscape when playing
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      startGame();
      return () => {
        stopGame();
        // Unlock orientation when done
        ScreenOrientation.unlockAsync();
      };
    }
  }, [gameState]);

  // Update current word when wordIndex or wordList changes
  useEffect(() => {
    if (wordList.length > 0 && wordIndex < wordList.length) {
      const newWord = wordList[wordIndex];
      setCurrentWord(newWord);
    }
  }, [wordIndex, wordList]);

  const startGame = () => {
    // Generate shuffled word list
    const allWords = [...WORD_CATEGORIES.animals, ...WORD_CATEGORIES.food, ...WORD_CATEGORIES.movies, ...WORD_CATEGORIES.actions];
    const shuffled = allWords.sort(() => Math.random() - 0.5);

    // Store in both state and ref
    wordListRef.current = shuffled;
    setWordList(shuffled);
    setWordIndex(0);
    setScore(0);
    setSkipped(0);
    setTimeLeft(GAME_DURATION);
    
    // Set the current word immediately
    setCurrentWord(shuffled[0]);

    // Start accelerometer
    Accelerometer.setUpdateInterval(100);
    subscriptionRef.current = Accelerometer.addListener(({ x, y, z }) => {
      // When phone is in landscape on forehead:
      // - Phone facing up (correct) = z becomes more positive (closer to 1)
      // - Phone facing down (skip) = z becomes more negative (closer to -1)
      // We use z-axis which measures face-up/face-down orientation
      
      const tiltValue = z;
      Animated.timing(tiltAnim, { toValue: tiltValue, duration: 100, useNativeDriver: false }).start();

      // Detect tilt up/forward (correct) - phone tilts so screen faces more upward
      if (tiltValue > TILT_THRESHOLD && lastTiltAction.current !== 'up') {
        lastTiltAction.current = 'up';
        handleCorrect();
        // Reset after short delay to prevent multiple triggers
        setTimeout(() => { lastTiltAction.current = null; }, 1000);
      }
      // Detect tilt down/backward (skip) - phone tilts so screen faces more downward
      else if (tiltValue < -TILT_THRESHOLD && lastTiltAction.current !== 'down') {
        lastTiltAction.current = 'down';
        handleSkip();
        // Reset after short delay to prevent multiple triggers
        setTimeout(() => { lastTiltAction.current = null; }, 1000);
      }
    });

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopGame();
          setGameState('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopGame = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  };

  const handleCorrect = () => {
    setScore((prev) => prev + 1);
    showFeedback('✓ Correct!', '#4CAF50');
    nextWord();
  };

  const handleSkip = () => {
    setSkipped((prev) => prev + 1);
    showFeedback('↓ Skipped', '#FF9800');
    nextWord();
  };

  const nextWord = () => {
    setWordIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      const currentList = wordListRef.current;
      
      if (nextIndex >= currentList.length) {
        // Reshuffle if we run out
        const reshuffled = [...currentList].sort(() => Math.random() - 0.5);
        wordListRef.current = reshuffled;
        setWordList(reshuffled);
        return 0;
      }
      return nextIndex;
    });
  };

  const showFeedback = (text, color) => {
    setFeedbackText(text);
    feedbackOpacity.setValue(1);
    Animated.sequence([
      Animated.delay(300),
      Animated.timing(feedbackOpacity, { toValue: 0, duration: 500, useNativeDriver: true })
    ]).start();
  };

  const handleStartGame = () => {
    setGameState('playing');
  };

  const handleBackToMenu = () => {
    stopGame();
    setGameState('menu');
  };

  const handlePlayAgain = () => {
    setGameState('playing');
  };

  // Menu Screen
  if (gameState === 'menu') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Heads Up Game</Text>
        <Text style={styles.instructions}>
          Place phone on your forehead{'\n'}
          Tilt DOWN for correct ✓{'\n'}
          Tilt UP to skip ↓{'\n'}
          {GAME_DURATION} seconds to guess as many as you can!
        </Text>
        
        <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
          <Text style={styles.buttonText}>Start Game</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Game Screen
  if (gameState === 'playing') {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.topBar}>
          <Text style={styles.timer}>{timeLeft}s</Text>
          <TouchableOpacity onPress={handleBackToMenu}>
            <Text style={styles.quitText}>Quit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.wordContainer}>
          <Text style={styles.word}>{currentWord || 'Loading...'}</Text>
        </View>

        <View style={styles.scoreBar}>
          <Text style={styles.scoreText}>✓ {score}</Text>
          <Text style={styles.skipText}>↓ {skipped}</Text>
        </View>

        <Animated.View style={[styles.feedback, { opacity: feedbackOpacity }]}>
          <Text style={styles.feedbackText}>{feedbackText}</Text>
        </Animated.View>

        <View style={styles.instructionBar}>
          <Text style={styles.instructionText}>↑ Tilt Down = Correct</Text>
          <Text style={styles.instructionText}>↓ Tilt Up = Skip</Text>
        </View>
      </View>
    );
  }

  // Finished Screen
  if (gameState === 'finished') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Time's Up!</Text>
        <View style={styles.finalScoreContainer}>
          <Text style={styles.finalScoreLabel}>Final Score</Text>
          <Text style={styles.finalScore}>{score}</Text>
          <Text style={styles.finalStats}>Correct: {score} | Skipped: {skipped}</Text>
        </View>
        
        <TouchableOpacity style={styles.startButton} onPress={handlePlayAgain}>
          <Text style={styles.buttonText}>Play Again</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Back to Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0D17',
    padding: 20,
  },
  gameContainer: {
    flex: 1,
    backgroundColor: '#0B0D17',
  },
  title: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  instructions: {
    color: '#ccc',
    fontSize: 18,
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 28,
  },
  startButton: {
    backgroundColor: '#7EA0FF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginVertical: 10,
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  timer: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  quitText: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: '600',
  },
  wordContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  word: {
    color: '#fff',
    fontSize: 56,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scoreBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scoreText: {
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: 'bold',
  },
  skipText: {
    color: '#FF9800',
    fontSize: 24,
    fontWeight: 'bold',
  },
  instructionBar: {
    padding: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: '#7EA0FF',
    fontSize: 16,
    marginVertical: 4,
  },
  feedback: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 15,
  },
  feedbackText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  finalScoreContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  finalScoreLabel: {
    color: '#7EA0FF',
    fontSize: 20,
    marginBottom: 10,
  },
  finalScore: {
    color: '#fff',
    fontSize: 72,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  finalStats: {
    color: '#ccc',
    fontSize: 18,
  },
});
