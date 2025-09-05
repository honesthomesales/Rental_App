'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { TenantsService } from '@rental-app/api';
import { TenantForm } from '@/components/TenantForm';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// Define local Tenant type to match what we actually receive
interface Tenant {
  id: string;
  property_id?: string | null;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  lease_start_date?: string;
  lease_end_date?: string;
  // monthly_rent removed - rent data comes from RENT_leases
  notes?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  properties?: unknown;
  leases?: Array<{
    id: string;
    rent: number;
    rent_cadence: string;
    lease_start_date: string;
    lease_end_date: string;
    status: string;
  }>;
}

function TenantEditContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const id = sp.get('id');
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Early validation - if no ID, set error immediately
    if (!id) {
      setError('Missing tenant ID');
      return;
    }
    
    loadTenant(id);
  }, [id]);

  const loadTenant = async (tenantId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await TenantsService.getById(tenantId);
      
      if (response.success && response.data) {
        setTenant(response.data as Tenant);
      } else {
        const errorMessage = response.error || 'Failed to load tenant';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error loading tenant:', error);
      const errorMessage = 'An unexpected error occurred while loading the tenant';
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
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Tenant ID</h1>
          <p className="text-gray-600 mb-6">No tenant ID was provided in the URL.</p>
          <button
            onClick={() => router.push('/tenants')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Tenants
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

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Tenant</h1>
          <p className="text-gray-600 mb-6">{error || 'Tenant not found'}</p>
          <button
            onClick={() => router.push('/tenants')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Tenants
          </button>
        </div>
      </div>
    );
  }

  const handleSuccess = (updatedTenant: Tenant) => {
    toast.success('Tenant updated successfully');
    router.push('/tenants');
  };

  const handleCancel = () => {
    router.push('/tenants');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Edit Tenant: {tenant.first_name} {tenant.last_name}</h1>
            <p className="text-gray-600">Update tenant information</p>
          </div>
          <div className="p-6">
            <TenantForm
              tenant={tenant}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TenantEditPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TenantEditContent />
    </Suspense>
  );
}
