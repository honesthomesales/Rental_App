import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Job, JobStatus, Photo } from '../../../shared/types';
import { apiService } from '../services/apiService';

interface JobDetailScreenProps {
  route?: {
    params?: {
      jobId?: string;
      job?: Job;
    };
  };
}

const JobDetailScreen: React.FC<JobDetailScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const routeParams = useRoute();
  const [job, setJob] = useState<Job | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const jobId = route?.params?.jobId || routeParams.params?.jobId;
  const initialJob = route?.params?.job || routeParams.params?.job;

  useEffect(() => {
    if (initialJob) {
      setJob(initialJob);
      setLoading(false);
    } else if (jobId) {
      loadJobDetails();
    }
  }, [jobId, initialJob]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      const [jobResponse, photosResponse] = await Promise.all([
        apiService.get(`/jobs/${jobId}`),
        apiService.get(`/jobs/${jobId}/photos`),
      ]);
      
      setJob(jobResponse.data);
      setPhotos(photosResponse.data);
    } catch (error) {
      console.error('Error loading job details:', error);
      Alert.alert('Error', 'Failed to load job details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (newStatus: JobStatus) => {
    if (!job) return;

    try {
      setUpdating(true);
      const response = await apiService.patch(`/jobs/${job.id}`, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      
      setJob(response.data);
      setShowStatusModal(false);
      
      Alert.alert('Success', `Job status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating job status:', error);
      Alert.alert('Error', 'Failed to update job status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleVoiceCommand = () => {
    navigation.navigate('VoiceCommand', {
      context: 'job_detail',
      onCommand: (command: string) => {
        if (command.includes('start')) {
          updateJobStatus('in_progress');
        } else if (command.includes('complete') || command.includes('finish')) {
          updateJobStatus('completed');
        } else if (command.includes('photo') || command.includes('picture')) {
          navigation.navigate('PhotoCapture', { jobId: job?.id });
        } else if (command.includes('call') || command.includes('phone')) {
          // Handle phone call
          Alert.alert('Call Customer', `Calling ${job?.customerPhone}`);
        }
      },
    });
  };

  const handlePhotoCapture = () => {
    navigation.navigate('PhotoCapture', { 
      jobId: job?.id,
      onPhotoCaptured: (newPhoto: Photo) => {
        setPhotos(prev => [...prev, newPhoto]);
      },
    });
  };

  const handleCallCustomer = () => {
    if (job?.customerPhone) {
      Alert.alert(
        'Call Customer',
        `Call ${job.customerName} at ${job.customerPhone}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: () => console.log('Calling customer...') },
        ]
      );
    }
  };

  const handleEmailCustomer = () => {
    if (job?.customerEmail) {
      Alert.alert(
        'Email Customer',
        `Send email to ${job.customerEmail}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Email', onPress: () => console.log('Sending email...') },
        ]
      );
    }
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'in_progress':
        return '#3b82f6';
      case 'completed':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'in_progress':
        return 'play-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStatusSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Status</Text>
        <TouchableOpacity
          style={styles.voiceButton}
          onPress={handleVoiceCommand}
        >
          <Ionicons name="mic" size={16} color="#3b82f6" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(job?.status || 'pending') }
        ]}>
          <Ionicons 
            name={getStatusIcon(job?.status || 'pending')} 
            size={16} 
            color="white" 
          />
          <Text style={styles.statusText}>
            {job?.status?.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.updateStatusButton}
          onPress={() => setShowStatusModal(true)}
        >
          <Text style={styles.updateStatusButtonText}>Update Status</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCustomerSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Customer Information</Text>
      
      <View style={styles.customerInfo}>
        <View style={styles.customerRow}>
          <Ionicons name="person" size={20} color="#6b7280" />
          <Text style={styles.customerText}>{job?.customerName}</Text>
        </View>
        
        {job?.customerPhone && (
          <TouchableOpacity
            style={styles.customerRow}
            onPress={handleCallCustomer}
          >
            <Ionicons name="call" size={20} color="#3b82f6" />
            <Text style={styles.customerText}>{job.customerPhone}</Text>
          </TouchableOpacity>
        )}
        
        {job?.customerEmail && (
          <TouchableOpacity
            style={styles.customerRow}
            onPress={handleEmailCustomer}
          >
            <Ionicons name="mail" size={20} color="#3b82f6" />
            <Text style={styles.customerText}>{job.customerEmail}</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.customerRow}>
          <Ionicons name="location" size={20} color="#6b7280" />
          <Text style={styles.customerText}>{job?.address}</Text>
        </View>
      </View>
    </View>
  );

  const renderJobDetails = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Job Details</Text>
      
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Scheduled Date:</Text>
        <Text style={styles.detailValue}>
          {job?.scheduledDate ? formatDate(job.scheduledDate) : 'Not set'}
        </Text>
      </View>
      
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Estimated Cost:</Text>
        <Text style={styles.detailValue}>${job?.estimatedCost}</Text>
      </View>
      
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Priority:</Text>
        <Text style={styles.detailValue}>
          {job?.priority?.charAt(0).toUpperCase() + job?.priority?.slice(1)}
        </Text>
      </View>
      
      {job?.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.detailLabel}>Description:</Text>
          <Text style={styles.descriptionText}>{job.description}</Text>
        </View>
      )}
    </View>
  );

  const renderPhotosSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <TouchableOpacity
          style={styles.addPhotoButton}
          onPress={handlePhotoCapture}
        >
          <Ionicons name="camera" size={16} color="white" />
          <Text style={styles.addPhotoButtonText}>Add Photo</Text>
        </TouchableOpacity>
      </View>
      
      {photos.length === 0 ? (
        <View style={styles.emptyPhotos}>
          <Ionicons name="camera-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyPhotosText}>No photos yet</Text>
          <Text style={styles.emptyPhotosSubtext}>
            Capture before and after photos
          </Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {photos.map((photo) => (
            <TouchableOpacity
              key={photo.id}
              style={styles.photoItem}
              onPress={() => setSelectedPhoto(photo)}
            >
              <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
              <View style={[
                styles.photoTypeBadge,
                { backgroundColor: photo.type === 'before' ? '#f59e0b' : '#10b981' }
              ]}>
                <Text style={styles.photoTypeText}>
                  {photo.type.charAt(0).toUpperCase() + photo.type.slice(1)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderStatusModal = () => (
    <Modal
      visible={showStatusModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowStatusModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Update Job Status</Text>
          
          {(['pending', 'in_progress', 'completed', 'cancelled'] as JobStatus[]).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusOption,
                job?.status === status && styles.statusOptionActive
              ]}
              onPress={() => updateJobStatus(status)}
              disabled={updating}
            >
              <Ionicons
                name={getStatusIcon(status)}
                size={20}
                color={job?.status === status ? 'white' : '#6b7280'}
              />
              <Text style={[
                styles.statusOptionText,
                job?.status === status && styles.statusOptionTextActive
              ]}>
                {status.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowStatusModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderPhotoModal = () => (
    <Modal
      visible={!!selectedPhoto}
      transparent
      animationType="fade"
      onRequestClose={() => setSelectedPhoto(null)}
    >
      <View style={styles.photoModalOverlay}>
        <TouchableOpacity
          style={styles.photoModalClose}
          onPress={() => setSelectedPhoto(null)}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        
        {selectedPhoto && (
          <Image source={{ uri: selectedPhoto.uri }} style={styles.photoModalImage} />
        )}
        
        {selectedPhoto?.description && (
          <View style={styles.photoModalDescription}>
            <Text style={styles.photoModalDescriptionText}>
              {selectedPhoto.description}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>Job Not Found</Text>
        <Text style={styles.errorText}>
          The job you're looking for doesn't exist or has been removed.
        </Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {job.title}
        </Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditJob', { jobId: job.id })}
        >
          <Ionicons name="create" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStatusSection()}
        {renderCustomerSection()}
        {renderJobDetails()}
        {renderPhotosSection()}
      </ScrollView>

      {/* Modals */}
      {renderStatusModal()}
      {renderPhotoModal()}
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
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8fafc',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginHorizontal: 12,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  voiceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  updateStatusButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  updateStatusButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  customerInfo: {
    gap: 12,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },
  descriptionContainer: {
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
    marginTop: 4,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  addPhotoButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyPhotos: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyPhotosText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyPhotosSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  photoItem: {
    marginRight: 12,
    position: 'relative',
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  photoTypeBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  photoTypeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  statusOptionActive: {
    backgroundColor: '#3b82f6',
  },
  statusOptionText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
    marginLeft: 12,
  },
  statusOptionTextActive: {
    color: 'white',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalImage: {
    width: '90%',
    height: '70%',
    borderRadius: 12,
  },
  photoModalDescription: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 8,
  },
  photoModalDescriptionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default JobDetailScreen; 