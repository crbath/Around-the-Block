import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';

export default function TriviaScreen({ navigation }) {
  const [gameState, setGameState] = useState('menu');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const decodeHTML = (str = '') => {
    return str
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchQuestions = async (retryCount = 0) => {
    setGameState('loading');
    try {
      const response = await fetch('https://opentdb.com/api.php?amount=10&type=multiple', {
        method: 'GET',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.response_code !== 0) {
        let errorMessage = 'Failed to load questions. ';
        switch (data.response_code) {
          case 1: errorMessage += 'No results found. Try again.'; break;
          case 2: errorMessage += 'Invalid parameter.'; break;
          case 3: errorMessage += 'Token not found.'; break;
          case 4: errorMessage += 'Token empty.'; break;
          default: errorMessage += 'Unknown error occurred.';
        }
        throw new Error(errorMessage);
      }
      if (data.results && data.results.length > 0) {
        const formattedQuestions = data.results.map((q, index) => {
          const question = decodeHTML(q.question);
          const correct = decodeHTML(q.correct_answer);
          const incorrects = q.incorrect_answers.map(a => decodeHTML(a));
          return {
            id: index,
            question,
            correctAnswer: correct,
            allAnswers: shuffleArray([correct, ...incorrects]),
            category: decodeHTML(q.category),
            difficulty: decodeHTML(q.difficulty),
          };
        });
        setQuestions(formattedQuestions);
        setGameState('playing');
      } else {
        throw new Error('No questions received from API');
      }
    } catch (error) {
      if (retryCount === 0 && (error.message.includes('Network') || error.message.includes('Failed to fetch'))) {
        setTimeout(() => fetchQuestions(1), 1000);
        return;
      }
      Alert.alert('Error Loading Questions', error.message || 'Failed to load trivia questions. Please try again.', [
        { text: 'Cancel', onPress: () => setGameState('menu') },
        { text: 'Retry', onPress: () => fetchQuestions(0) },
      ]);
    }
  };

  const handleAnswerPress = (answer) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    if (answer === questions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
    }
    setTimeout(() => { nextQuestion(); }, 2000);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setGameState('finished');
    }
  };

  const resetGame = () => {
    setGameState('menu');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const getAnswerButtonStyle = (answer) => {
    if (!showResult) return styles.answerButton;
    if (answer === questions[currentQuestionIndex].correctAnswer) return [styles.answerButton, styles.correctAnswer];
    else if (answer === selectedAnswer && selectedAnswer !== 'timeout') return [styles.answerButton, styles.incorrectAnswer];
    return [styles.answerButton, styles.disabledAnswer];
  };

  if (gameState === 'menu') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Trivia Challenge</Text>
        <Text style={styles.subtitle}>Test your knowledge with 10 questions!</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>• 10 Multiple Choice Questions</Text>
          <Text style={styles.infoText}>• No time limit - take your time!</Text>
          <Text style={styles.infoText}>• Various categories & difficulties</Text>
        </View>
        <TouchableOpacity style={styles.startButton} onPress={fetchQuestions}>
          <Text style={styles.buttonText}>Start Trivia</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (gameState === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7EA0FF" />
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }

  if (gameState === 'finished') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Game Complete!</Text>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Final Score</Text>
          <Text style={styles.finalScore}>{score}/{questions.length}</Text>
        </View>
        <TouchableOpacity style={styles.startButton} onPress={resetGame}>
          <Text style={styles.buttonText}>Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back to Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (gameState === 'playing' && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Question {currentQuestionIndex + 1} of {questions.length}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }]} />
              </View>
            </View>
          </View>
          <Text style={styles.scoreText}>Score: {score}</Text>
          <View style={styles.questionContainer}><Text style={styles.questionText}>{currentQuestion.question}</Text></View>
          <View style={styles.answersContainer}>
            {currentQuestion.allAnswers.map((answer, index) => (
              <TouchableOpacity key={index} style={getAnswerButtonStyle(answer)} onPress={() => handleAnswerPress(answer)} disabled={selectedAnswer !== null}>
                <Text style={styles.answerText}>{answer}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {showResult && (
            <View style={styles.resultContainer}>
              {selectedAnswer === currentQuestion.correctAnswer ? (
                <Text style={styles.correctText}>Correct!</Text>
              ) : (
                <Text style={styles.incorrectText}>Incorrect</Text>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0D17', padding: 20 },
  scrollContent: { flexGrow: 1, paddingVertical: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0D17' },
  loadingText: { color: '#7EA0FF', fontSize: 18, marginTop: 20 },
  title: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  subtitle: { color: '#ccc', fontSize: 18, marginBottom: 40, textAlign: 'center' },
  infoCard: { backgroundColor: '#1C1C1E', padding: 20, borderRadius: 15, marginBottom: 30, width: '90%' },
  infoText: { color: '#ccc', fontSize: 16, marginVertical: 5 },
  startButton: { backgroundColor: '#7EA0FF', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10, marginVertical: 10, width: '80%', alignItems: 'center' },
  backButton: { backgroundColor: '#2C2C2E', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10, marginVertical: 10, width: '80%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  header: { width: '100%', marginBottom: 20 },
  progressContainer: { width: '100%' },
  progressText: { color: '#ccc', fontSize: 14, marginBottom: 5 },
  progressBar: { height: 4, backgroundColor: '#2C2C2E', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: '#7EA0FF', borderRadius: 2 },
  scoreText: { color: '#7EA0FF', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  questionContainer: { backgroundColor: '#1C1C1E', padding: 20, borderRadius: 15, marginBottom: 30, width: '100%' },
  questionText: { color: '#fff', fontSize: 20, lineHeight: 28 },
  answersContainer: { width: '100%' },
  answerButton: { backgroundColor: '#1C1C1E', padding: 15, borderRadius: 10, marginVertical: 8 },
  answerText: { color: '#fff', fontSize: 16 },
  correctAnswer: { borderWidth: 1, borderColor: '#4CD964' },
  incorrectAnswer: { borderWidth: 1, borderColor: '#FF6B6B' },
  disabledAnswer: { opacity: 0.6 },
  resultContainer: { alignItems: 'center', marginTop: 20 },
  correctText: { color: '#4CD964', fontSize: 18, fontWeight: 'bold' },
  incorrectText: { color: '#FF6B6B', fontSize: 18, fontWeight: 'bold' },
});
