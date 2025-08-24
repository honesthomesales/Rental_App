import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import VoiceEnabledScreen from '../components/VoiceEnabledScreen';
import { VoiceCommand } from '../services/VoiceService';

const DashboardScreen = () => {
  const [selectedJob, setSelectedJob] = useState<number | null>(null);

  const stats = [
    { title: 'Active Jobs', value: '12', color: '#3B82F6' },
    { title: 'Pending Quotes', value: '5', color: '#F59E0B' },
    { title: 'Completed', value: '28', color: '#10B981' },
    { title: 'Revenue', value: '$12.5K', color: '#8B5CF6' },
  ];

  const recentJobs = [
    { id: 1, title: 'Kitchen Remodel', status: 'In Progress', client: 'John Smith' },
    { id: 2, title: 'Bathroom Update', status: 'Pending', client: 'Sarah Johnson' },
    { id: 3, title: 'Deck Installation', status: 'Completed', client: 'Mike Davis' },
  ];

  // Dashboard-specific voice commands
  const dashboardCommands: VoiceCommand[] = [
    {
      command: 'show stats',
      action: () => {
        Alert.alert('Dashboard Stats', 
          `Active Jobs: ${stats[0].value}\nPending Quotes: ${stats[1].value}\nCompleted: ${stats[2].value}\nRevenue: ${stats[3].value}`
        );
      },
      description: 'Show dashboard statistics'
    },
    {
      command: 'recent jobs',
      action: () => {
        const jobList = recentJobs.map(job => `${job.title} - ${job.status}`).join('\n');
        Alert.alert('Recent Jobs', jobList);
      },
      description: 'List recent jobs'
    },
    {
      command: 'select job',
      action: () => {
        if (recentJobs.length > 0) {
          setSelectedJob(recentJobs[0].id);
          Alert.alert('Job Selected', `Selected: ${recentJobs[0].title}`);
        }
      },
      description: 'Select the first recent job'
    },
    {
      command: 'clear selection',
      action: () => {
        setSelectedJob(null);
        Alert.alert('Selection Cleared', 'No job selected');
      },
      description: 'Clear job selection'
    },
    {
      command: 'refresh',
      action: () => {
        Alert.alert('Refreshing', 'Dashboard data refreshed');
      },
      description: 'Refresh dashboard data'
    },
  ];

  const handleVoiceCommand = (command: string) => {
    console.log('Dashboard voice command:', command);
  };

  return (
    <VoiceEnabledScreen 
      commands={dashboardCommands}
      onCommandRecognized={handleVoiceCommand}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.greeting}>Good morning!</Text>
            <Text style={styles.subtitle}>Here's your business overview</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
                <View style={[styles.statIndicator, { backgroundColor: stat.color }]} />
              </View>
            ))}
          </View>

          {/* Recent Jobs */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Jobs</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {recentJobs.map((job) => (
              <TouchableOpacity 
                key={job.id} 
                style={[
                  styles.jobCard,
                  selectedJob === job.id && styles.selectedJobCard
                ]}
                onPress={() => setSelectedJob(job.id)}
              >
                <View style={styles.jobInfo}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <Text style={styles.jobClient}>{job.client}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: job.status === 'Completed' ? '#D1FAE5' : 
                                   job.status === 'In Progress' ? '#DBEAFE' : '#FEF3C7' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: job.status === 'Completed' ? '#065F46' : 
                            job.status === 'In Progress' ? '#1E40AF' : '#92400E' }
                  ]}>
                    {job.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </VoiceEnabledScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'android' ? 120 : 100,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  statIndicator: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  selectedJobCard: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  jobClient: {
    fontSize: 14,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default DashboardScreen; 