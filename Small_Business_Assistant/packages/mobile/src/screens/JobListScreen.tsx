import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Vibration,
  Animated,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import Voice from 'react-native-voice';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Job {
  id: string;
  title: string;
  customerName: string;
  status: string;
  priority: string;
  estimatedDuration?: number;
  createdAt: string;
}

const JobListScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    React.useCallback(() => {
      fetchJobs();
    }, [])
  );

  useEffect(() => {
    setupVoice();
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
    Voice._onSpeechStart = () => setIsListening(true);
    Voice._onSpeechEnd = () => setIsListening(false);
    Voice._onSpeechResults = handleVoiceResults;
    Voice._onSpeechError = handleVoiceError;
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
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
      const jobsData = response.data.data.jobs;
      setJobs(jobsData);
      setFilteredJobs(jobsData);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      Alert.alert('Error', 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  const startListening = async () => {
    try {
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
    } catch (error) {
      console.error('Voice stop error:', error);
    }
  };

  const handleVoiceResults = (event: any) => {
    const command = event.value[0].toLowerCase();
    Vibration.vibrate(200);
    processVoiceCommand(command);
  };

  const handleVoiceError = (error: any) => {
    console.error('Voice error:', error);
    setIsListening(false);
  };

  const processVoiceCommand = (command: string) => {
         if (command.includes('create job') || command.includes('new job')) {
       navigation.navigate('CreateJob' as any);
     } else if (command.includes('show all') || command.includes('all jobs')) {
      setActiveFilter('all');
      setFilteredJobs(jobs);
    } else if (command.includes('pending') || command.includes('show pending')) {
      setActiveFilter('pending');
      setFilteredJobs(jobs.filter(job => job.status === 'pending'));
    } else if (command.includes('in progress') || command.includes('active')) {
      setActiveFilter('in_progress');
      setFilteredJobs(jobs.filter(job => job.status === 'in_progress'));
    } else if (command.includes('completed') || command.includes('done')) {
      setActiveFilter('completed');
      setFilteredJobs(jobs.filter(job => job.status === 'completed'));
    } else if (command.includes('start job')) {
      const jobName = command.replace('start job', '').trim();
      startJobByName(jobName);
    } else if (command.includes('job details') || command.includes('view job')) {
      const jobName = command.replace(/job details|view job/g, '').trim();
      viewJobByName(jobName);
    } else {
      Alert.alert('Voice Commands', 
        'Try saying:\n• "Create job"\n• "Show all"\n• "Show pending"\n• "Start job [name]"\n• "View job [name]"'
      );
    }
  };

  const startJobByName = (jobName: string) => {
    const job = jobs.find(j => 
      j.title.toLowerCase().includes(jobName) || 
      j.customerName.toLowerCase().includes(jobName)
    );
    
    if (job) {
      Alert.alert('Start Job', `Start "${job.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: () => updateJobStatus(job.id, 'in_progress') }
      ]);
    } else {
      Alert.alert('Job Not Found', `Could not find job: ${jobName}`);
    }
  };

  const viewJobByName = (jobName: string) => {
    const job = jobs.find(j => 
      j.title.toLowerCase().includes(jobName) || 
      j.customerName.toLowerCase().includes(jobName)
    );
    
         if (job) {
       navigation.navigate('JobDetail' as any, { jobId: job.id } as any);
     } else {
      Alert.alert('Job Not Found', `Could not find job: ${jobName}`);
    }
  };

  const updateJobStatus = async (jobId: string, status: string) => {
    try {
      await apiService.put(`/jobs/${jobId}`, { status });
      fetchJobs(); // Refresh the list
    } catch (error) {
      Alert.alert('Error', 'Failed to update job status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Not set';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderJobCard = ({ item }: { item: Job }) => (
    <TouchableOpacity
             style={styles.jobCard}
       onPress={() => navigation.navigate('JobDetail' as any, { jobId: item.id } as any)}
       activeOpacity={0.7}
    >
      <View style={styles.jobHeader}>
        <View style={styles.jobTitleContainer}>
          <Text style={styles.jobTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.customerName}>{item.customerName}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
              {item.priority}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.jobDetails}>
        <View style={styles.detailRow}>
          <Icon name="schedule" size={16} color="#64748b" />
          <Text style={styles.detailText}>Est: {formatDuration(item.estimatedDuration)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="event" size={16} color="#64748b" />
          <Text style={styles.detailText}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.jobActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.startButton]}
          onPress={() => updateJobStatus(item.id, 'in_progress')}
        >
          <Icon name="play-arrow" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Start</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.completeButton]}
          onPress={() => updateJobStatus(item.id, 'completed')}
        >
          <Icon name="check" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Complete</Text>
        </TouchableOpacity>
        
                 <TouchableOpacity
           style={[styles.actionButton, styles.detailsButton]}
           onPress={() => navigation.navigate('JobDetail' as any, { jobId: item.id } as any)}
         >
          <Icon name="visibility" size={20} color="#2563eb" />
          <Text style={[styles.actionButtonText, { color: '#2563eb' }]}>Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (filter: string, label: string, count: number) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => {
        setActiveFilter(filter);
        if (filter === 'all') {
          setFilteredJobs(jobs);
        } else {
          setFilteredJobs(jobs.filter(job => job.status === filter));
        }
      }}
    >
      <Text style={[
        styles.filterButtonText,
        activeFilter === filter && styles.filterButtonTextActive
      ]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading jobs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Voice Button */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>My Jobs</Text>
          <Text style={styles.subtitle}>{filteredJobs.length} jobs found</Text>
        </View>
        <TouchableOpacity
          style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
          onPress={isListening ? stopListening : startListening}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Icon 
              name={isListening ? 'mic' : 'mic-none'} 
              size={24} 
              color={isListening ? '#fff' : '#2563eb'} 
            />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderFilterButton('all', 'All', jobs.length)}
          {renderFilterButton('pending', 'Pending', jobs.filter(j => j.status === 'pending').length)}
          {renderFilterButton('in_progress', 'Active', jobs.filter(j => j.status === 'in_progress').length)}
          {renderFilterButton('completed', 'Done', jobs.filter(j => j.status === 'completed').length)}
        </ScrollView>
      </View>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="work-off" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No jobs found</Text>
          <Text style={styles.emptySubtitle}>
            {activeFilter === 'all' 
              ? 'Create your first job to get started' 
              : `No ${activeFilter.replace('_', ' ')} jobs`
            }
          </Text>
          {activeFilter === 'all' && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateJob' as never)}
            >
              <Icon name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Job</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          renderItem={renderJobCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateJob' as never)}
      >
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#64748b',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  jobDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
  },
  jobActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  startButton: {
    backgroundColor: '#10b981',
  },
  completeButton: {
    backgroundColor: '#3b82f6',
  },
  detailsButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default JobListScreen; 