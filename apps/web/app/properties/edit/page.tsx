'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { PropertiesService } from '@rental-app/api';
import type { Property } from '@rental-app/api';
import { PropertyForm } from '@/components/PropertyForm';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

function PropertyEditContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const id = sp.get('id');
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Early validation - if no ID, redirect immediately
    if (!id) {
      setError('Missing property ID');
      return;
    }
    
    loadProperty(id);
  }, [id]);

  const loadProperty = async (propertyId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await PropertiesService.getById(propertyId);
      
      if (response.success && response.data) {
        setProperty(response.data);
      } else {
        const errorMessage = response.error || 'Failed to load property';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error loading property:', error);
      const errorMessage = 'An unexpected error occurred while loading the property';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Early return for missing ID
  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Property ID</h1>
          <p className="text-gray-600 mb-6">No property ID was provided in the URL.</p>
          <button
            onClick={() => router.push('/properties')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Property</h1>
          <p className="text-gray-600 mb-6">{error || 'Property not found'}</p>
          <button
            onClick={() => router.push('/properties')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  const handleSuccess = (updatedProperty: Property) => {
    toast.success('Property updated successfully');
    router.push('/properties');
  };

  const handleCancel = () => {
    router.push('/properties');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Edit Property: {property.name}</h1>
            <p className="text-gray-600">Update property information</p>
          </div>
          <div className="p-6">
            <PropertyForm
              property={property}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              modal={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PropertyEditPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PropertyEditContent />
    </Suspense>
  );
}
