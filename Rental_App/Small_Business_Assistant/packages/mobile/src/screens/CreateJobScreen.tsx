import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Vibration,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import Voice from 'react-native-voice';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface JobFormData {
  title: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedDuration: string;
}

const CreateJobScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [activeField, setActiveField] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    description: '',
    priority: 'medium',
    estimatedDuration: '',
  });

  const setupVoice = () => {
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechResults = handleVoiceResults;
    Voice.onSpeechError = handleVoiceError;
  };

  const startListening = async (field: string) => {
    try {
      setActiveField(field);
      Vibration.vibrate(100);
      await Voice.start('en-US');
    } catch (error) {
      console.error('Voice start error:', error);
      Alert.alert('Error', 'Failed to start voice recognition');
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setActiveField('');
    } catch (error) {
      console.error('Voice stop error:', error);
    }
  };

  const handleVoiceResults = (event: any) => {
    const text = event.value[0];
    Vibration.vibrate(200);
    
    if (activeField) {
      setFormData(prev => ({
        ...prev,
        [activeField]: text,
      }));
    }
  };

  const handleVoiceError = (error: any) => {
    console.error('Voice error:', error);
    setIsListening(false);
    setActiveField('');
  };

  const handleInputChange = (field: keyof JobFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.customerName) {
      Alert.alert('Required Fields', 'Please fill in job title and customer name');
      return;
    }

    setIsSubmitting(true);
    try {
      const jobData = {
        ...formData,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) * 60 : null, // Convert hours to minutes
        userId: user?.id,
      };

      await apiService.post('/jobs', jobData);
      Alert.alert('Success', 'Job created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const VoiceInputField = ({ 
    field, 
    label, 
    placeholder, 
    required = false,
    multiline = false,
    keyboardType = 'default'
  }: {
    field: keyof JobFormData;
    label: string;
    placeholder: string;
    required?: boolean;
    multiline?: boolean;
    keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  }) => (
    <View style={styles.inputContainer}>
      <View style={styles.inputHeader}>
        <Text style={styles.inputLabel}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <TouchableOpacity
          style={[
            styles.voiceButton,
            activeField === field && styles.voiceButtonActive
          ]}
          onPress={() => activeField === field ? stopListening() : startListening(field)}
        >
          <Icon 
            name={activeField === field ? 'mic' : 'mic-none'} 
            size={20} 
            color={activeField === field ? '#fff' : '#2563eb'} 
          />
        </TouchableOpacity>
      </View>
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.textArea,
          activeField === field && styles.inputActive
        ]}
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Create New Job</Text>
        <Text style={styles.subtitle}>Voice input available for all fields</Text>
      </View>

      {/* Voice Button */}
      <View style={styles.voiceContainer}>
        <Animated.View
          style={[
            styles.pulseCircle,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <TouchableOpacity
          style={styles.mainVoiceButton}
          onPress={() => {
            if (isListening) {
              stopListening();
            } else {
              Alert.alert(
                'Voice Input',
                'What would you like to enter?',
                [
                  { text: 'Job Title', onPress: () => startListening('title') },
                  { text: 'Customer Name', onPress: () => startListening('customerName') },
                  { text: 'Phone Number', onPress: () => startListening('customerPhone') },
                  { text: 'Description', onPress: () => startListening('description') },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }
          }}
        >
          <Icon 
            name={isListening ? 'mic' : 'mic-none'} 
            size={32} 
            color="#fff" 
          />
        </TouchableOpacity>
        <Text style={styles.voiceLabel}>
          {isListening ? 'Listening...' : 'Tap for Voice Input'}
        </Text>
      </View>

      {/* Form Fields */}
      <View style={styles.form}>
        <VoiceInputField
          field="title"
          label="Job Title"
          placeholder="e.g., Fix leaky faucet"
          required
        />

        <VoiceInputField
          field="customerName"
          label="Customer Name"
          placeholder="Customer's full name"
          required
        />

        <VoiceInputField
          field="customerPhone"
          label="Phone Number"
          placeholder="(555) 123-4567"
          keyboardType="phone-pad"
        />

        <VoiceInputField
          field="customerEmail"
          label="Email"
          placeholder="customer@example.com"
          keyboardType="email-address"
        />

        <VoiceInputField
          field="description"
          label="Description"
          placeholder="Describe the work to be done..."
          multiline
        />

        {/* Priority Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Priority</Text>
          <View style={styles.priorityButtons}>
            {(['low', 'medium', 'high'] as const).map((priority) => (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.priorityButton,
                  formData.priority === priority && styles.priorityButtonActive
                ]}
                onPress={() => handleInputChange('priority', priority)}
              >
                <Text style={[
                  styles.priorityText,
                  formData.priority === priority && styles.priorityTextActive
                ]}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <VoiceInputField
          field="estimatedDuration"
          label="Estimated Duration (hours)"
          placeholder="2.5"
          keyboardType="numeric"
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Creating...' : 'Create Job'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Voice Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Voice Input Tips:</Text>
        <Text style={styles.tipsText}>
          • Tap the microphone icon next to any field for voice input{'\n'}
          • Speak clearly and at a normal pace{'\n'}
          • Say "period" for punctuation{'\n'}
          • Use the main voice button for quick field selection
        </Text>
      </View>
    </ScrollView>
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  pulseCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  mainVoiceButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  voiceLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 10,
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  required: {
    color: '#ef4444',
  },
  voiceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  voiceButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputActive: {
    borderColor: '#2563eb',
    borderWidth: 2,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  priorityTextActive: {
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  submitButton: {
    flex: 2,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  tipsContainer: {
    margin: 20,
    padding: 15,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
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

export default CreateJobScreen; 