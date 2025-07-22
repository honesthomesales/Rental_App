import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  Dimensions,
  Animated,
} from 'react-native';
import Voice from 'react-native-voice';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

interface Job {
  id: string;
  title: string;
  customerName: string;
  status: string;
  priority: string;
  estimatedDuration?: number;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [todayJobs, setTodayJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const voiceButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setupVoice();
    fetchJobs();
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isListening]);

  const setupVoice = () => {
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechResults = handleVoiceResults;
    Voice.onSpeechError = handleVoiceError;
  };

  const startPulseAnimation = () => {
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
  };

  const stopPulseAnimation = () => {
    pulseAnim.setValue(1);
  };

  const fetchJobs = async () => {
    try {
      const response = await apiService.get('/jobs');
      const allJobs = response.data.data.jobs;
      setJobs(allJobs);
      
      // Filter today's jobs
      const today = new Date().toDateString();
      const todayJobsList = allJobs.filter((job: Job) => {
        const jobDate = new Date(job.createdAt).toDateString();
        return jobDate === today;
      });
      setTodayJobs(todayJobsList);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = async () => {
    try {
      Vibration.vibrate(100);
      await Voice.start('en-US');
      setRecognizedText('');
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
    processVoiceCommand(text);
  };

  const handleVoiceError = (error: any) => {
    console.error('Voice error:', error);
    setIsListening(false);
  };

  const processVoiceCommand = (command: string) => {
    Vibration.vibrate(200);
    
    // Money-making commands
    if (command.includes('create job') || command.includes('new job')) {
      navigation.navigate('CreateJob' as never);
    } else if (command.includes('show jobs') || command.includes('my jobs')) {
      navigation.navigate('JobList' as never);
    } else if (command.includes('start job')) {
      const jobName = command.replace('start job', '').trim();
      startJobByName(jobName);
    } else if (command.includes('complete job')) {
      const jobName = command.replace('complete job', '').trim();
      completeJobByName(jobName);
    } else if (command.includes('take photo')) {
      navigation.navigate('PhotoCapture' as never);
    } else if (command.includes('call customer')) {
      // Find active job and call customer
      const activeJob = jobs.find(job => job.status === 'in_progress');
      if (activeJob) {
        Alert.alert('Call Customer', `Call ${activeJob.customerName}?`);
      }
    } else if (command.includes('logout') || command.includes('sign out')) {
      logout();
    } else {
      Alert.alert('Command Not Recognized', 'Try saying: "Create job", "Show jobs", "Start job", or "Take photo"');
    }
  };

  const startJobByName = (jobName: string) => {
    const job = jobs.find(j => 
      j.title.toLowerCase().includes(jobName) || 
      j.customerName.toLowerCase().includes(jobName)
    );
    
    if (job) {
      navigation.navigate('JobDetail' as never, { jobId: job.id } as never);
    } else {
      Alert.alert('Job Not Found', `Could not find job: ${jobName}`);
    }
  };

  const completeJobByName = (jobName: string) => {
    const job = jobs.find(j => 
      j.title.toLowerCase().includes(jobName) || 
      j.customerName.toLowerCase().includes(jobName)
    );
    
    if (job) {
      Alert.alert('Complete Job', `Mark "${job.title}" as complete?`);
      // TODO: Implement job completion
    } else {
      Alert.alert('Job Not Found', `Could not find job: ${jobName}`);
    }
  };

  const getActiveJobsCount = () => {
    return jobs.filter(job => job.status === 'pending' || job.status === 'in_progress').length;
  };

  const getCompletedTodayCount = () => {
    return todayJobs.filter(job => job.status === 'completed').length;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Time to Make Money!</Text>
        <Text style={styles.userText}>Welcome, {user?.firstName}</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{getActiveJobsCount()}</Text>
          <Text style={styles.statLabel}>Active Jobs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{getCompletedTodayCount()}</Text>
          <Text style={styles.statLabel}>Completed Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>${jobs.length * 150}</Text>
          <Text style={styles.statLabel}>Potential Revenue</Text>
        </View>
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
          style={styles.voiceButton}
          onPress={isListening ? stopListening : startListening}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.voiceButtonInner,
              {
                transform: [{ scale: voiceButtonScale }],
              },
            ]}
          >
            <Icon 
              name={isListening ? 'mic' : 'mic-none'} 
              size={48} 
              color="#fff" 
            />
          </Animated.View>
        </TouchableOpacity>
        
        <Text style={styles.voiceLabel}>
          {isListening ? 'Listening...' : 'Tap to Speak'}
        </Text>
        
        {recognizedText ? (
          <Text style={styles.recognizedText}>"{recognizedText}"</Text>
        ) : null}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.actionsTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreateJob' as never)}
          >
            <Icon name="add" size={24} color="#2563eb" />
            <Text style={styles.actionText}>New Job</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('JobList' as never)}
          >
            <Icon name="work" size={24} color="#059669" />
            <Text style={styles.actionText}>View Jobs</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('PhotoCapture' as never)}
          >
            <Icon name="camera-alt" size={24} color="#dc2626" />
            <Text style={styles.actionText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('VoiceCommand' as never)}
          >
            <Icon name="record-voice-over" size={24} color="#7c3aed" />
            <Text style={styles.actionText}>Voice Help</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Voice Commands Help */}
      <View style={styles.helpContainer}>
        <Text style={styles.helpTitle}>Voice Commands:</Text>
        <Text style={styles.helpText}>"Create job" • "Show jobs" • "Start job" • "Take photo"</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  userText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 5,
    textAlign: 'center',
  },
  voiceContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  pulseCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  voiceButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  voiceButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceLabel: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 15,
    fontWeight: '500',
  },
  recognizedText: {
    fontSize: 14,
    color: '#2563eb',
    marginTop: 10,
    fontStyle: 'italic',
  },
  actionsContainer: {
    marginBottom: 30,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 5,
    textAlign: 'center',
  },
  helpContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  helpText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
});

export default HomeScreen; 