import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { voiceService, VoiceCommand } from '../services/VoiceService';

interface VoiceControlProps {
  commands: VoiceCommand[];
  onCommandRecognized?: (command: string) => void;
}

const VoiceControl: React.FC<VoiceControlProps> = ({ 
  commands, 
  onCommandRecognized 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // Register commands with the voice service
    voiceService.registerCommands(commands);
    voiceService.setCommandCallback((command) => {
      setLastCommand(command);
      onCommandRecognized?.(command);
    });

    return () => {
      voiceService.cleanup();
    };
  }, [commands, onCommandRecognized]);

  useEffect(() => {
    if (isListening) {
      // Start pulse animation
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
    } else {
      // Stop animation
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  const toggleListening = async () => {
    if (isListening) {
      await voiceService.stopListening();
      setIsListening(false);
    } else {
      await voiceService.startListening();
      setIsListening(true);
      
      // Auto-stop after 10 seconds
      setTimeout(async () => {
        if (isListening) {
          await voiceService.stopListening();
          setIsListening(false);
        }
      }, 10000);
    }
  };

  const showHelp = () => {
    const availableCommands = voiceService.getAvailableCommands();
    const commandList = availableCommands
      .map(cmd => `• "${cmd.command}" - ${cmd.description}`)
      .join('\n');
    
    Alert.alert(
      'Voice Commands',
      `Available commands:\n\n${commandList}\n\nTap the microphone to start listening.\nSpeak clearly and wait for the speech recognition dialog.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Voice status indicator */}
      {isListening && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Listening...</Text>
          {lastCommand && (
            <Text style={styles.lastCommandText}>"{lastCommand}"</Text>
          )}
        </View>
      )}

      {/* Voice control button */}
      <TouchableOpacity
        style={styles.voiceButton}
        onPress={toggleListening}
        onLongPress={showHelp}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.buttonInner,
            {
              transform: [{ scale: pulseAnim }],
              backgroundColor: isListening ? '#EF4444' : '#3B82F6',
            },
          ]}
        >
          <Text style={styles.micIcon}>🎤</Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Help button */}
      <TouchableOpacity
        style={styles.helpButton}
        onPress={showHelp}
        activeOpacity={0.8}
      >
        <Text style={styles.helpIcon}>❓</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 120 : 100,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  statusContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  lastCommandText: {
    color: '#10B981',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  voiceButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIcon: {
    fontSize: 24,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  helpIcon: {
    fontSize: 16,
  },
});

export default VoiceControl; 