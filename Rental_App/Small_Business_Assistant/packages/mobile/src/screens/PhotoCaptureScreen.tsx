import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { apiService } from '../services/apiService';

interface PhotoCaptureScreenProps {
  route?: {
    params?: {
      jobId?: string;
      photoType?: 'before' | 'after';
      onPhotoCaptured?: (photoData: any) => void;
    };
  };
}

interface PhotoData {
  id: string;
  uri: string;
  type: 'before' | 'after';
  description: string;
  timestamp: string;
  jobId?: string;
}

const PhotoCaptureScreen: React.FC<PhotoCaptureScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const routeParams = useRoute();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [flashMode, setFlashMode] = useState(FlashMode.off);
  const [capturedPhotos, setCapturedPhotos] = useState<PhotoData[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState<PhotoData | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoDescription, setPhotoDescription] = useState('');
  
  const cameraRef = useRef<Camera>(null);

  const jobId = route?.params?.jobId || routeParams.params?.jobId;
  const photoType = route?.params?.photoType || routeParams.params?.photoType || 'before';
  const onPhotoCaptured = route?.params?.onPhotoCaptured || routeParams.params?.onPhotoCaptured;

  useEffect(() => {
    requestPermissions();
    loadExistingPhotos();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      
      setHasPermission(cameraStatus === 'granted' && mediaStatus === 'granted');
      
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Camera and media library permissions are required to capture and save photos.'
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setHasPermission(false);
    }
  };

  const loadExistingPhotos = async () => {
    if (!jobId) return;
    
    try {
      const response = await apiService.get(`/jobs/${jobId}/photos`);
      setCapturedPhotos(response.data);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      const newPhoto: PhotoData = {
        id: Date.now().toString(),
        uri: photo.uri,
        type: photoType,
        description: '',
        timestamp: new Date().toISOString(),
        jobId,
      };

      setCurrentPhoto(newPhoto);
      setShowCamera(false);
      setShowPreview(true);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto: PhotoData = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          type: photoType,
          description: '',
          timestamp: new Date().toISOString(),
          jobId,
        };

        setCurrentPhoto(newPhoto);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery.');
    }
  };

  const savePhoto = async () => {
    if (!currentPhoto) return;

    try {
      setLoading(true);

      // Create form data for file upload
      const formData = new FormData();
      formData.append('photo', {
        uri: currentPhoto.uri,
        type: 'image/jpeg',
        name: `photo_${Date.now()}.jpg`,
      } as any);
      formData.append('type', currentPhoto.type);
      formData.append('description', photoDescription);
      formData.append('jobId', jobId || '');

      const response = await apiService.post('/photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Add to local state
      const savedPhoto = { ...currentPhoto, ...response.data };
      setCapturedPhotos(prev => [...prev, savedPhoto]);

      // Call callback if provided
      if (onPhotoCaptured) {
        onPhotoCaptured(savedPhoto);
      }

      // Reset state
      setCurrentPhoto(null);
      setPhotoDescription('');
      setShowPreview(false);

      Alert.alert('Success', 'Photo saved successfully!');
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert('Error', 'Failed to save photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
    try {
      await apiService.delete(`/photos/${photoId}`);
      setCapturedPhotos(prev => prev.filter(photo => photo.id !== photoId));
      Alert.alert('Success', 'Photo deleted successfully!');
    } catch (error) {
      console.error('Error deleting photo:', error);
      Alert.alert('Error', 'Failed to delete photo. Please try again.');
    }
  };

  const renderCamera = () => (
    <Modal visible={showCamera} animationType="slide">
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={cameraType}
          flashMode={flashMode}
        >
          <View style={styles.cameraControls}>
            {/* Top Controls */}
            <View style={styles.cameraTopControls}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => setShowCamera(false)}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => setFlashMode(
                  flashMode === FlashMode.off ? FlashMode.on : FlashMode.off
                )}
              >
                <Ionicons
                  name={flashMode === FlashMode.off ? 'flash-off' : 'flash'}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <View style={styles.cameraBottomControls}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => setCameraType(
                  cameraType === CameraType.back ? CameraType.front : CameraType.back
                )}
              >
                <Ionicons name="camera-reverse" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.captureButton, loading && styles.captureButtonDisabled]}
                onPress={takePicture}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cameraButton}
                onPress={pickImageFromGallery}
              >
                <Ionicons name="images" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </Camera>
      </View>
    </Modal>
  );

  const renderPhotoPreview = () => (
    <Modal visible={showPreview} animationType="slide">
      <View style={styles.previewContainer}>
        <View style={styles.previewHeader}>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => {
              setShowPreview(false);
              setCurrentPhoto(null);
              setPhotoDescription('');
            }}
          >
            <Ionicons name="close" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.previewTitle}>
            {photoType === 'before' ? 'Before Photo' : 'After Photo'}
          </Text>
          <TouchableOpacity
            style={[styles.previewButton, loading && styles.previewButtonDisabled]}
            onPress={savePhoto}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#3b82f6" />
            ) : (
              <Ionicons name="checkmark" size={24} color="#3b82f6" />
            )}
          </TouchableOpacity>
        </View>

        {currentPhoto && (
          <View style={styles.previewContent}>
            <Image source={{ uri: currentPhoto.uri }} style={styles.previewImage} />
            
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Description (optional)</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Add a description for this photo..."
                value={photoDescription}
                onChangeText={setPhotoDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
        )}
      </View>
    </Modal>
  );

  const renderPhotoGallery = () => (
    <ScrollView style={styles.galleryContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.galleryHeader}>
        <Text style={styles.galleryTitle}>Job Photos</Text>
        <TouchableOpacity
          style={styles.addPhotoButton}
          onPress={() => setShowCamera(true)}
        >
          <Ionicons name="camera" size={20} color="white" />
          <Text style={styles.addPhotoButtonText}>Add Photo</Text>
        </TouchableOpacity>
      </View>

      {capturedPhotos.length === 0 ? (
        <View style={styles.emptyGallery}>
          <Ionicons name="camera-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyGalleryTitle}>No photos yet</Text>
          <Text style={styles.emptyGallerySubtitle}>
            Capture before and after photos to document your work
          </Text>
        </View>
      ) : (
        <View style={styles.photoGrid}>
          {capturedPhotos.map((photo) => (
            <View key={photo.id} style={styles.photoItem}>
              <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
              <View style={styles.photoOverlay}>
                <View style={[
                  styles.photoTypeBadge,
                  { backgroundColor: photo.type === 'before' ? '#f59e0b' : '#10b981' }
                ]}>
                  <Text style={styles.photoTypeText}>
                    {photo.type.charAt(0).toUpperCase() + photo.type.slice(1)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deletePhotoButton}
                  onPress={() => deletePhoto(photo.id)}
                >
                  <Ionicons name="trash" size={16} color="white" />
                </TouchableOpacity>
              </View>
              {photo.description && (
                <Text style={styles.photoDescription} numberOfLines={2}>
                  {photo.description}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Requesting permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-off" size={64} color="#ef4444" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          Please enable camera and media library permissions to use this feature.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermissions}
        >
          <Text style={styles.permissionButtonText}>Grant Permissions</Text>
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
        <Text style={styles.headerTitle}>
          {photoType === 'before' ? 'Before Photo' : 'After Photo'}
        </Text>
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={() => setShowCamera(true)}
        >
          <Ionicons name="camera" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Photo Gallery */}
      {renderPhotoGallery()}

      {/* Camera Modal */}
      {renderCamera()}

      {/* Photo Preview Modal */}
      {renderPhotoPreview()}
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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8fafc',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
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
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryContainer: {
    flex: 1,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  galleryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  addPhotoButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyGallery: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyGalleryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyGallerySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  photoItem: {
    width: '48%',
    margin: '1%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  photoThumbnail: {
    width: '100%',
    height: 150,
  },
  photoOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoTypeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  deletePhotoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoDescription: {
    fontSize: 12,
    color: '#6b7280',
    padding: 8,
    lineHeight: 16,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  cameraTopControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cameraBottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  previewButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  previewContent: {
    flex: 1,
    padding: 20,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  descriptionInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default PhotoCaptureScreen; 