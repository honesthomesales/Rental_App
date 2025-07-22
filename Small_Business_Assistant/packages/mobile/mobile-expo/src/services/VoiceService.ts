import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { Platform, Alert } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

export interface VoiceCommand {
  command: string;
  action: () => void;
  description: string;
}

export class VoiceService {
  private isListening = false;
  private commands: VoiceCommand[] = [];
  private onCommandRecognized?: (command: string) => void;

  constructor() {
    this.setupAudio();
  }

  private async setupAudio() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      }
    } catch (error) {
      console.error('Failed to setup audio:', error);
    }
  }

  // Register voice commands
  registerCommands(commands: VoiceCommand[]) {
    this.commands = commands;
    console.log('Voice commands registered:', commands.map(c => c.command));
  }

  // Set callback for recognized commands
  setCommandCallback(callback: (command: string) => void) {
    this.onCommandRecognized = callback;
  }

  // Start listening for voice commands
  async startListening(): Promise<void> {
    if (this.isListening) return;

    try {
      this.isListening = true;
      console.log('Starting voice recognition...');
      console.log('Available commands:', this.commands.map(c => c.command));
      
      if (Platform.OS === 'android') {
        await this.startAndroidSpeechRecognition();
      } else {
        // iOS fallback - show dialog for now
        this.showVoiceCommandDialog();
      }
      
    } catch (error) {
      console.error('Failed to start listening:', error);
      this.isListening = false;
      this.speak("Sorry, I couldn't start listening. Please try again.");
    }
  }

  // Start Android speech recognition using RecognizerIntent
  private async startAndroidSpeechRecognition(): Promise<void> {
    try {
      console.log('Starting Android RecognizerIntent...');
      
      // Create the speech recognition intent
      const intentParams = {
        action: 'android.speech.action.RECOGNIZE_SPEECH',
        packageName: 'com.google.android.googlequicksearchbox',
        className: 'com.google.android.googlequicksearchbox.VoiceSearchActivity',
        flags: 1, // FLAG_ACTIVITY_NEW_TASK
        extra: {
          'android.speech.extra.LANGUAGE_MODEL': 'android.speech.extra.LANGUAGE_MODEL_FREE_FORM',
          'android.speech.extra.LANGUAGE': 'en-US',
          'android.speech.extra.PROMPT': 'Say a command like "dashboard" or "jobs"',
          'android.speech.extra.MAX_RESULTS': 1,
          'android.speech.extra.PARTIAL_RESULTS': false,
        }
      };

      console.log('Launching RecognizerIntent with params:', intentParams);
      
      const result = await IntentLauncher.startActivityAsync('android.speech.action.RECOGNIZE_SPEECH', {
        packageName: 'com.google.android.googlequicksearchbox',
        className: 'com.google.android.googlequicksearchbox.VoiceSearchActivity',
        flags: 1,
        extra: {
          'android.speech.extra.LANGUAGE_MODEL': 'android.speech.extra.LANGUAGE_MODEL_FREE_FORM',
          'android.speech.extra.LANGUAGE': 'en-US',
          'android.speech.extra.PROMPT': 'Say a command like "dashboard" or "jobs"',
          'android.speech.extra.MAX_RESULTS': 1,
          'android.speech.extra.PARTIAL_RESULTS': false,
        }
      });

      console.log('✅ RecognizerIntent result:', result);
      
      // Check if we got a result
      if (result.resultCode === -1) { // RESULT_OK
        console.log('✅ Speech recognition successful!');
        
        // Extract the recognized text from the result
        const recognizedText = this.extractRecognizedText(result);
        
        if (recognizedText) {
          console.log('✅ SUCCESS: Speech recognized:', recognizedText);
          Alert.alert('Success!', `Recognized: "${recognizedText}"`, [{ text: 'OK' }]);
          this.processVoiceCommand(recognizedText);
        } else {
          console.log('❌ No text extracted from result');
          Alert.alert('No Text', 'No text was recognized. Please try again.', [{ text: 'OK' }]);
          this.speak("I didn't hear anything. Please try again.");
        }
      } else if (result.resultCode === 0) { // RESULT_CANCELED
        console.log('❌ Speech recognition cancelled by user');
        Alert.alert('Cancelled', 'Voice recognition was cancelled.', [{ text: 'OK' }]);
        this.speak("Voice recognition cancelled.");
      } else {
        console.log('❌ Speech recognition failed with result code:', result.resultCode);
        Alert.alert('Error', 'Voice recognition failed. Please try again.', [{ text: 'OK' }]);
        this.speak("Sorry, speech recognition failed. Please try again.");
      }
      
    } catch (error) {
      console.error('❌ ERROR: Speech recognition error:', error);
      Alert.alert('Error', `Speech recognition error: ${error}`, [{ text: 'OK' }]);
      this.speak("Sorry, speech recognition failed. Please try again.");
    } finally {
      this.isListening = false;
    }
  }

  // Extract recognized text from the intent result
  private extractRecognizedText(result: any): string | null {
    console.log('Extracting text from result:', JSON.stringify(result, null, 2));
    
    // Try multiple ways to extract the text
    const possiblePaths = [
      'data.getStringArrayListExtra("android.speech.extra.RESULTS")',
      'data.getStringExtra("android.speech.extra.RESULTS")',
      'data.getStringArrayListExtra("android.speech.extra.RESULTS")[0]',
      'extra.getStringArrayListExtra("android.speech.extra.RESULTS")',
      'extra.getStringExtra("android.speech.extra.RESULTS")',
      'extra.getStringArrayListExtra("android.speech.extra.RESULTS")[0]',
    ];

    for (const path of possiblePaths) {
      try {
        // This is a simplified extraction - in reality we need to parse the result properly
        if (result.data && result.data.RESULTS) {
          const results = result.data.RESULTS;
          if (Array.isArray(results) && results.length > 0) {
            return results[0];
          } else if (typeof results === 'string') {
            return results;
          }
        }
      } catch (e) {
        console.log(`Failed to extract from path ${path}:`, e);
      }
    }

    // If we can't extract, show the full result for debugging
    console.log('Full result for debugging:', result);
    return null;
  }

  // Show a dialog to simulate voice recognition (fallback)
  private showVoiceCommandDialog() {
    const availableCommands = this.commands.map(c => c.command);
    
    Alert.alert(
      'Voice Command (Fallback)',
      'Select a command to simulate voice recognition:',
      [
        ...availableCommands.map(command => ({
          text: command,
          onPress: () => {
            console.log('✅ SUCCESS: Simulated speech recognized:', command);
            this.processVoiceCommand(command);
            this.isListening = false;
          }
        })),
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            console.log('❌ Voice recognition cancelled');
            this.isListening = false;
            this.speak("Voice recognition cancelled.");
          }
        }
      ]
    );
  }

  // Stop listening
  async stopListening(): Promise<void> {
    this.isListening = false;
    console.log('Voice listening stopped');
  }

  // Process recognized voice command
  private processVoiceCommand(recognizedText: string): void {
    const normalizedText = recognizedText.toLowerCase().trim();
    console.log('Processing recognized command:', normalizedText);
    console.log('Available commands:', this.commands.map(c => c.command.toLowerCase()));
    
    // Find matching command - try exact match first, then partial match
    let matchedCommand = this.commands.find(command => 
      normalizedText === command.command.toLowerCase()
    );

    if (!matchedCommand) {
      // Try partial match with fuzzy matching
      matchedCommand = this.commands.find(command => 
        normalizedText.includes(command.command.toLowerCase()) ||
        command.command.toLowerCase().includes(normalizedText) ||
        this.calculateSimilarity(normalizedText, command.command.toLowerCase()) > 0.7
      );
    }

    if (matchedCommand) {
      console.log(`✅ Voice command recognized: "${recognizedText}" -> ${matchedCommand.command}`);
      this.speak(`Executing ${matchedCommand.description}`);
      matchedCommand.action();
    } else {
      console.log(`❌ Command not recognized: "${recognizedText}"`);
      console.log('Available commands were:', this.commands.map(c => c.command));
      this.speak("I didn't understand that command. Please try again.");
    }

    // Call callback if set
    if (this.onCommandRecognized) {
      this.onCommandRecognized(recognizedText);
    }
  }

  // Calculate similarity between two strings (for fuzzy matching)
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // Levenshtein distance for fuzzy matching
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Text-to-speech
  async speak(text: string, options?: any): Promise<void> {
    try {
      console.log('Speaking:', text);
      await Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        ...options
      });
    } catch (error) {
      console.error('Failed to speak:', error);
    }
  }

  // Stop speaking
  async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.error('Failed to stop speaking:', error);
    }
  }

  // Get available commands for help
  getAvailableCommands(): VoiceCommand[] {
    return this.commands;
  }

  // Check if currently listening
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  // Cleanup
  cleanup(): void {
    this.stopListening();
    this.stopSpeaking();
  }
}

// Create singleton instance
export const voiceService = new VoiceService(); 