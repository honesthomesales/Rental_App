import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { voiceService, VoiceCommand } from '../services/VoiceService';

interface VoiceEnabledScreenProps {
  children: React.ReactNode;
  commands: VoiceCommand[];
  onCommandRecognized?: (command: string) => void;
  autoStart?: boolean;
}

const VoiceEnabledScreen: React.FC<VoiceEnabledScreenProps> = ({
  children,
  commands,
  onCommandRecognized,
  autoStart = false,
}) => {
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  useEffect(() => {
    // Register screen-specific commands
    voiceService.registerCommands(commands);
    
    if (onCommandRecognized) {
      voiceService.setCommandCallback((command) => {
        onCommandRecognized(command);
        Alert.alert('Voice Command', `Executed: ${command}`, [{ text: 'OK' }]);
      });
    }

    // Auto-start voice if enabled
    if (autoStart) {
      startVoice();
    }

    return () => {
      voiceService.cleanup();
    };
  }, [commands, onCommandRecognized, autoStart]);

  const startVoice = async () => {
    try {
      await voiceService.startListening();
      setIsVoiceActive(true);
      
      // Auto-stop after 30 seconds
      setTimeout(async () => {
        await voiceService.stopListening();
        setIsVoiceActive(false);
      }, 30000);
    } catch (error) {
      console.error('Failed to start voice:', error);
    }
  };

  const stopVoice = async () => {
    try {
      await voiceService.stopListening();
      setIsVoiceActive(false);
    } catch (error) {
      console.error('Failed to stop voice:', error);
    }
  };

  return (
    <View style={styles.container}>
      {children}
      
      {/* Voice status indicator */}
      {isVoiceActive && (
        <View style={styles.voiceIndicator}>
          <View style={styles.voiceDot} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  voiceIndicator: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  voiceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
});

export default VoiceEnabledScreen; 