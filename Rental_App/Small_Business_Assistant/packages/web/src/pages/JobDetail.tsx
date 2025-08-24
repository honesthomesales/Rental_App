import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Edit,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  Camera,
  Download,
  Trash2,
  Plus,
  Eye
} from 'lucide-react';
import { Job, JobStatus, Photo } from '../../../shared/types';
import { apiService } from '../services/apiService';

const JobDetail: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    if (jobId) {
      loadJobDetails();
    }
  }, [jobId]);

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
    } catch (error) {
      console.error('Error updating job status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const deleteJob = async () => {
    if (!job || !confirm('Are you sure you want to delete this job?')) return;

    try {
      await apiService.delete(`/jobs/${job.id}`);
      navigate('/jobs');
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const deletePhoto = async (photoId: string) => {
    try {
      await apiService.delete(`/photos/${photoId}`);
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <AlertTriangle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const StatusButton: React.FC<{
    status: JobStatus;
    currentStatus: JobStatus;
    onClick: () => void;
    children: React.ReactNode;
  }> = ({ status, currentStatus, onClick, children }) => (
    <button
      onClick={onClick}
      disabled={updating}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
        currentStatus === status
          ? 'bg-blue-50 border-blue-200 text-blue-700'
          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
      } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {getStatusIcon(status)}
      {children}
    </button>
  );

  const PhotoCard: React.FC<{ photo: Photo }> = ({ photo }) => (
    <div className="relative group">
      <img
        src={photo.uri}
        alt={photo.description || `${photo.type} photo`}
        className="w-full h-48 object-cover rounded-lg cursor-pointer"
        onClick={() => {
          setSelectedPhoto(photo);
          setShowPhotoModal(true);
        }}
      />
      
      <div className="absolute top-2 left-2">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          photo.type === 'before' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
        }`}>
          {photo.type.charAt(0).toUpperCase() + photo.type.slice(1)}
        </span>
      </div>
      
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => deletePhoto(photo.id)}
          className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          title="Delete photo"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      {photo.description && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg">
          <p className="text-sm truncate">{photo.description}</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
          <p className="text-gray-600 mb-6">The job you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/jobs"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link
                to="/jobs"
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Job ID: {job.id}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                to={`/jobs/${job.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Job
              </Link>
              
              <button
                onClick={deleteJob}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Job
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Job Details</h2>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                  {getStatusIcon(job.status)}
                  {job.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Scheduled Date</p>
                      <p className="text-sm text-gray-900">{formatDate(job.scheduledDate)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Estimated Cost</p>
                      <p className="text-sm text-gray-900">{formatCurrency(job.estimatedCost)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Priority</p>
                      <p className="text-sm text-gray-900 capitalize">{job.priority}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p className="text-sm text-gray-900">{job.address}</p>
                    </div>
                  </div>
                  
                  {job.description && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                      <p className="text-sm text-gray-900">{job.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Customer Name</p>
                      <p className="text-sm text-gray-900">{job.customerName}</p>
                    </div>
                  </div>
                  
                  {job.customerPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone</p>
                        <a
                          href={`tel:${job.customerPhone}`}
                          className="text-sm text-blue-600 hover:text-blue-500"
                        >
                          {job.customerPhone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {job.customerEmail && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <a
                          href={`mailto:${job.customerEmail}`}
                          className="text-sm text-blue-600 hover:text-blue-500"
                        >
                          {job.customerEmail}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Photos</h2>
                <Link
                  to={`/jobs/${job.id}/photos`}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Add Photos
                </Link>
              </div>
              
              {photos.length === 0 ? (
                <div className="text-center py-12">
                  <Camera className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No photos yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Capture before and after photos to document the work.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {photos.map((photo) => (
                    <PhotoCard key={photo.id} photo={photo} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
              <div className="space-y-3">
                <StatusButton
                  status="pending"
                  currentStatus={job.status}
                  onClick={() => updateJobStatus('pending')}
                >
                  Mark as Pending
                </StatusButton>
                
                <StatusButton
                  status="in_progress"
                  currentStatus={job.status}
                  onClick={() => updateJobStatus('in_progress')}
                >
                  Start Job
                </StatusButton>
                
                <StatusButton
                  status="completed"
                  currentStatus={job.status}
                  onClick={() => updateJobStatus('completed')}
                >
                  Complete Job
                </StatusButton>
                
                <StatusButton
                  status="cancelled"
                  currentStatus={job.status}
                  onClick={() => updateJobStatus('cancelled')}
                >
                  Cancel Job
                </StatusButton>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {job.customerPhone && (
                  <a
                    href={`tel:${job.customerPhone}`}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">Call Customer</span>
                  </a>
                )}
                
                {job.customerEmail && (
                  <a
                    href={`mailto:${job.customerEmail}`}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">Email Customer</span>
                  </a>
                )}
                
                <Link
                  to={`/jobs/${job.id}/invoice`}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">Generate Invoice</span>
                </Link>
              </div>
            </div>

            {/* Job Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Job Created</p>
                    <p className="text-xs text-gray-500">{formatDate(job.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Scheduled</p>
                    <p className="text-xs text-gray-500">{formatDate(job.scheduledDate)}</p>
                  </div>
                </div>
                
                {job.updatedAt !== job.createdAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Updated</p>
                      <p className="text-xs text-gray-500">{formatDate(job.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Modal */}
      {showPhotoModal && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-4xl max-h-full p-4">
            <div className="relative">
              <button
                onClick={() => setShowPhotoModal(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
              >
                <Eye className="w-6 h-6" />
              </button>
              
              <img
                src={selectedPhoto.uri}
                alt={selectedPhoto.description || `${selectedPhoto.type} photo`}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              
              {selectedPhoto.description && (
                <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-4 rounded-lg">
                  <p className="text-sm">{selectedPhoto.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail; 