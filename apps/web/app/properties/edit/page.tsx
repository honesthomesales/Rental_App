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

  useEffect(() => {
    if (id) {
      loadProperty();
    }
  }, [id]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      const response = await PropertiesService.getById(id);
      
      if (response.success && response.data) {
        setProperty(response.data);
      } else {
        toast.error(response.error || 'Failed to load property');
        router.push('/properties');
      }
    } catch (error) {
      console.error('Error loading property:', error);
      toast.error('Error loading property');
      router.push('/properties');
    } finally {
      setLoading(false);
    }
  };

  if (!id) return <div>Missing property id.</div>;
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!property) {
    return <div>Property not found.</div>;
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
