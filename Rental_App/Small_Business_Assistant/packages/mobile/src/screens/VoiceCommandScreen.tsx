import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Vibration,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Voice from 'react-native-voice';
import Icon from 'react-native-vector-icons/MaterialIcons';

const VoiceCommandScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [feedback, setFeedback] = useState('');
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setupVoice();
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      startAnimations();
    } else {
      stopAnimations();
    }
  }, [isListening]);

  const setupVoice = () => {
    Voice._onSpeechStart = () => setIsListening(true);
    Voice._onSpeechEnd = () => setIsListening(false);
    Voice._onSpeechResults = handleVoiceResults;
    Voice._onSpeechError = handleVoiceError;
  };

  const startAnimations = () => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Wave animation
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopAnimations = () => {
    pulseAnim.setValue(1);
    waveAnim.setValue(0);
  };

  const startListening = async () => {
    try {
      Vibration.vibrate(100);
      setRecognizedText('');
      setFeedback('');
      await Voice.start('en-US');
    } catch (error) {
      console.error('Voice start error:', error);
      Alert.alert('Error', 'Failed to start voice recognition');
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (error) {
      console.error('Voice stop error:', error);
    }
  };

  const handleVoiceResults = (event: any) => {
    const text = event.value[0].toLowerCase();
    setRecognizedText(text);
    Vibration.vibrate(200);
    processVoiceCommand(text);
  };

  const handleVoiceError = (error: any) => {
    console.error('Voice error:', error);
    setIsListening(false);
    setFeedback('Voice recognition failed. Please try again.');
  };

  const processVoiceCommand = (command: string) => {
    let response = '';
    
    if (command.includes('create job') || command.includes('new job')) {
      response = 'Creating new job...';
      setTimeout(() => navigation.navigate('CreateJob' as any), 1000);
    } else if (command.includes('show jobs') || command.includes('my jobs')) {
      response = 'Showing your jobs...';
      setTimeout(() => navigation.navigate('JobList' as any), 1000);
    } else if (command.includes('take photo')) {
      response = 'Opening camera...';
      setTimeout(() => navigation.navigate('PhotoCapture' as any), 1000);
    } else if (command.includes('go home') || command.includes('home')) {
      response = 'Going to home screen...';
      setTimeout(() => navigation.navigate('Home' as any), 1000);
    } else if (command.includes('help') || command.includes('commands')) {
      response = 'Here are available commands...';
    } else if (command.includes('start job')) {
      const jobName = command.replace('start job', '').trim();
      response = `Starting job: ${jobName}`;
    } else if (command.includes('complete job')) {
      const jobName = command.replace('complete job', '').trim();
      response = `Completing job: ${jobName}`;
    } else if (command.includes('call customer')) {
      response = 'Calling customer...';
    } else {
      response = 'Command not recognized. Try saying "help" for available commands.';
    }
    
    setFeedback(response);
  };

  const voiceCommands = [
    { command: 'Create job', description: 'Start a new job' },
    { command: 'Show jobs', description: 'View all your jobs' },
    { command: 'Take photo', description: 'Capture job photos' },
    { command: 'Start job [name]', description: 'Begin working on a job' },
    { command: 'Complete job [name]', description: 'Mark job as finished' },
    { command: 'Call customer', description: 'Call the current customer' },
    { command: 'Go home', description: 'Return to home screen' },
    { command: 'Help', description: 'Show available commands' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Voice Commands</Text>
        <Text style={styles.subtitle}>Speak naturally to control the app</Text>
      </View>

      {/* Voice Button */}
      <View style={styles.voiceContainer}>
        {/* Wave animation */}
        <Animated.View
          style={[
            styles.wave,
            {
              transform: [{ scale: waveAnim }],
              opacity: waveAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0],
              }),
            },
          ]}
        />
        
        {/* Pulse animation */}
        <Animated.View
          style={[
            styles.pulse,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        
        <TouchableOpacity
          style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
          onPress={isListening ? stopListening : startListening}
          activeOpacity={0.8}
        >
          <Icon 
            name={isListening ? 'mic' : 'mic-none'} 
            size={48} 
            color={isListening ? '#fff' : '#2563eb'} 
          />
        </TouchableOpacity>
        
        <Text style={styles.voiceLabel}>
          {isListening ? 'Listening...' : 'Tap to Speak'}
        </Text>
      </View>

      {/* Recognized Text */}
      {recognizedText ? (
        <View style={styles.recognizedContainer}>
          <Text style={styles.recognizedLabel}>You said:</Text>
          <Text style={styles.recognizedText}>"{recognizedText}"</Text>
        </View>
      ) : null}

      {/* Feedback */}
      {feedback ? (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackLabel}>Response:</Text>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      ) : null}

      {/* Command List */}
      <ScrollView style={styles.commandsContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.commandsTitle}>Available Commands</Text>
        {voiceCommands.map((item, index) => (
          <View key={index} style={styles.commandItem}>
            <View style={styles.commandHeader}>
              <Icon name="record-voice-over" size={20} color="#2563eb" />
              <Text style={styles.commandText}>{item.command}</Text>
            </View>
            <Text style={styles.commandDescription}>{item.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Voice Tips:</Text>
        <Text style={styles.tipsText}>
          • Speak clearly and at a normal pace{'\n'}
          • Wait for the "Listening..." indicator{'\n'}
          • Use natural language like "Create a new job"{'\n'}
          • Say "Help" to see all available commands
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  voiceContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  wave: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  pulse: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
  },
  voiceButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  voiceButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  voiceLabel: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 20,
    fontWeight: '500',
  },
  recognizedContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  recognizedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  recognizedText: {
    fontSize: 16,
    color: '#1e293b',
    fontStyle: 'italic',
  },
  feedbackContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 16,
    color: '#1e293b',
  },
  commandsContainer: {
    flex: 1,
    padding: 16,
  },
  commandsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  commandItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  commandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commandText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  commandDescription: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 28,
  },
  tipsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
});

export default VoiceCommandScreen; 