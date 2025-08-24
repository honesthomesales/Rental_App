import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Camera,
  Search,
  Filter,
  Grid,
  List,
  Download,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  Users,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Star,
  Tag,
  XCircle
} from 'lucide-react';
import { Photo, Job } from '../../../shared/types';
import { apiService } from '../services/apiService';

interface PhotoFilters {
  search: string;
  category: 'all' | 'before' | 'after';
  jobId: string;
  dateRange: 'all' | 'week' | 'month' | 'quarter' | 'year';
}

const Photos: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [filters, setFilters] = useState<PhotoFilters>({
    search: '',
    category: 'all',
    jobId: '',
    dateRange: 'all'
  });
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [photosResponse, jobsResponse] = await Promise.all([
        apiService.get('/photos'),
        apiService.get('/jobs')
      ]);
      setPhotos(photosResponse.data);
      setJobs(jobsResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof PhotoFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleBulkAction = async (action: 'delete' | 'download') => {
    if (selectedPhotos.length === 0) return;

    try {
      if (action === 'delete') {
        if (window.confirm(`Are you sure you want to delete ${selectedPhotos.length} photo(s)?`)) {
          await Promise.all(
            selectedPhotos.map(id => apiService.delete(`/photos/${id}`))
          );
          setSelectedPhotos([]);
          loadData();
        }
      } else if (action === 'download') {
        // In a real app, this would trigger a bulk download
        selectedPhotos.forEach(id => {
          const photo = photos.find(p => p.id === id);
          if (photo) {
            window.open(photo.url, '_blank');
          }
        });
      }
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
    }
  };

  const deletePhoto = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      try {
        await apiService.delete(`/photos/${id}`);
        loadData();
      } catch (error) {
        console.error('Error deleting photo:', error);
      }
    }
  };

  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = 
      photo.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
      photo.jobTitle?.toLowerCase().includes(filters.search.toLowerCase()) ||
      photo.customerName?.toLowerCase().includes(filters.search.toLowerCase());

    const matchesCategory = filters.category === 'all' || photo.category === filters.category;
    const matchesJob = !filters.jobId || photo.jobId === filters.jobId;

    return matchesSearch && matchesCategory && matchesJob;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'before': return 'bg-red-100 text-red-800';
      case 'after': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const PhotoCard: React.FC<{ photo: Photo }> = ({ photo }) => {
    const job = jobs.find(j => j.id === photo.jobId);
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative group">
          <img
            src={photo.url}
            alt={photo.description || 'Job photo'}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCAxMDBDNjAgODkuNTQ0NyA2OC4wMDAxIDgxIDc4IDgxQzg3Ljk5OTkgODEgOTYgODkuNTQ0NyA5NiAxMEM5NiAxMC40NTUzIDg3Ljk5OTkgMTkgNzggMTlDNjguMDAwMSAxOSA2MCAxMC40NTUzIDYwIDEwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNDAgMTQwQzQwIDEyOS41NDUgNDguMDAwMSAxMjEgNTggMTIxSDk4QzEwNy45OTkgMTIxIDExNiAxMjkuNTQ1IDExNiAxNDBWMTQwSDQwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
              <button
                onClick={() => setSelectedPhoto(photo)}
                className="p-2 bg-white rounded-full text-gray-700 hover:text-gray-900"
                title="View"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.open(photo.url, '_blank')}
                className="p-2 bg-white rounded-full text-gray-700 hover:text-gray-900"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => deletePhoto(photo.id)}
                className="p-2 bg-white rounded-full text-red-600 hover:text-red-700"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="absolute top-2 left-2">
            <input
              type="checkbox"
              checked={selectedPhotos.includes(photo.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedPhotos(prev => [...prev, photo.id]);
                } else {
                  setSelectedPhotos(prev => prev.filter(id => id !== photo.id));
                }
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="absolute top-2 right-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(photo.category)}`}>
              {photo.category}
            </span>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {photo.description || 'Untitled Photo'}
              </h3>
              <p className="text-xs text-gray-500 truncate">
                {photo.jobTitle || 'Unknown Job'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(photo.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-3 h-3" />
              <span>{formatFileSize(photo.fileSize || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PhotoListItem: React.FC<{ photo: Photo }> = ({ photo }) => {
    const job = jobs.find(j => j.id === photo.jobId);
    
    return (
      <div className="flex items-center space-x-4 p-4 border-b border-gray-200 hover:bg-gray-50">
        <div className="flex-shrink-0">
          <input
            type="checkbox"
            checked={selectedPhotos.includes(photo.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedPhotos(prev => [...prev, photo.id]);
              } else {
                setSelectedPhotos(prev => prev.filter(id => id !== photo.id));
              }
            }}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
        <div className="flex-shrink-0">
          <img
            src={photo.url}
            alt={photo.description || 'Job photo'}
            className="w-16 h-16 object-cover rounded"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCAxMDBDNjAgODkuNTQ0NyA2OC4wMDAxIDgxIDc4IDgxQzg3Ljk5OTkgODEgOTYgODkuNTQ0NyA5NiAxMEM5NiAxMC40NTUzIDg3Ljk5OTkgMTkgNzggMTlDNjguMDAwMSAxOSA2MCAxMC40NTUzIDYwIDEwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNDAgMTQwQzQwIDEyOS41NDUgNDguMDAwMSAxMjEgNTggMTIxSDk4QzEwNy45OTkgMTIxIDExNiAxMjkuNTQ1IDExNiAxNDBWMTQwSDQwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {photo.description || 'Untitled Photo'}
            </h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(photo.category)}`}>
              {photo.category}
            </span>
          </div>
          <p className="text-sm text-gray-500 truncate">
            {photo.jobTitle || 'Unknown Job'} • {photo.customerName || 'Unknown Customer'}
          </p>
          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(photo.createdAt)}
            </span>
            <span className="flex items-center">
              <ImageIcon className="w-3 h-3 mr-1" />
              {formatFileSize(photo.fileSize || 0)}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedPhoto(photo)}
            className="text-blue-600 hover:text-blue-900 p-1"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.open(photo.url, '_blank')}
            className="text-gray-600 hover:text-gray-900 p-1"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => deletePhoto(photo.id)}
            className="text-red-600 hover:text-red-900 p-1"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const PhotoModal: React.FC<{ photo: Photo | null; onClose: () => void }> = ({ photo, onClose }) => {
    if (!photo) return null;

    const job = jobs.find(j => j.id === photo.jobId);

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" onClick={onClose}>
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Photo Details</h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <img
                    src={photo.url}
                    alt={photo.description || 'Job photo'}
                    className="w-full h-96 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCAxMDBDNjAgODkuNTQ0NyA2OC4wMDAxIDgxIDc4IDgxQzg3Ljk5OTkgODEgOTYgODkuNTQ0NyA5NiAxMEM5NiAxMC40NTUzIDg3Ljk5OTkgMTkgNzggMTlDNjguMDAwMSAxOSA2MCAxMC40NTUzIDYwIDEwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNDAgMTQwQzQwIDEyOS41NDUgNDguMDAwMSAxMjEgNTggMTIxSDk4QzEwNy45OTkgMTIxIDExNiAxMjkuNTQ1IDExNiAxNDBWMTQwSDQwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                    }}
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Description</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {photo.description || 'No description provided'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Category</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getCategoryColor(photo.category)}`}>
                      {photo.category}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Job Information</h4>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Job:</span> {photo.jobTitle || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Customer:</span> {photo.customerName || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Date:</span> {formatDate(photo.createdAt)}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">File Size:</span> {formatFileSize(photo.fileSize || 0)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 pt-4">
                    <button
                      onClick={() => window.open(photo.url, '_blank')}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>
                    <Link
                      to={`/jobs/${photo.jobId}`}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Job
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getStats = () => {
    const totalPhotos = photos.length;
    const beforePhotos = photos.filter(p => p.category === 'before').length;
    const afterPhotos = photos.filter(p => p.category === 'after').length;
    const totalSize = photos.reduce((sum, p) => sum + (p.fileSize || 0), 0);

    return {
      totalPhotos,
      beforePhotos,
      afterPhotos,
      totalSize
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Photos</h1>
            <p className="text-gray-600">Manage and organize your job photos</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <Link
              to="/photos/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Photos
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Camera className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Photos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPhotos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Tag className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Before Photos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.beforePhotos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Star className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">After Photos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.afterPhotos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ImageIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Size</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatFileSize(stats.totalSize)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search photos..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="before">Before</option>
              <option value="after">After</option>
            </select>
          </div>

          {/* Job Filter */}
          <div>
            <select
              value={filters.jobId}
              onChange={(e) => handleFilterChange('jobId', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Jobs</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${
                viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedPhotos.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedPhotos.length} selected
              </span>
              <button
                onClick={() => handleBulkAction('download')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Photos Grid/List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {viewMode === 'grid' ? (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPhotos.map(photo => (
                <PhotoCard key={photo.id} photo={photo} />
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPhotos.map(photo => (
              <PhotoListItem key={photo.id} photo={photo} />
            ))}
          </div>
        )}

        {filteredPhotos.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Camera className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No photos found</h3>
            <p className="text-gray-500 mb-4">
              {filters.search || filters.category !== 'all' || filters.jobId ? 'Try adjusting your filters.' : 'Get started by uploading your first photo.'}
            </p>
            {!filters.search && filters.category === 'all' && !filters.jobId && (
              <Link
                to="/photos/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload Photos
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Photo Modal */}
      <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
    </div>
  );
};

export default Photos; 