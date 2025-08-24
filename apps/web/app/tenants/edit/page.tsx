'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { TenantsService } from '@rental-app/api';
import type { Tenant } from '@rental-app/api';
import { TenantForm } from '@/components/TenantForm';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

function TenantEditContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const id = sp.get('id');
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadTenant();
    }
  }, [id]);

  const loadTenant = async () => {
    try {
      setLoading(true);
      const response = await TenantsService.getById(id);
      
      if (response.success && response.data) {
        setTenant(response.data);
      } else {
        toast.error(response.error || 'Failed to load tenant');
        router.push('/tenants');
      }
    } catch (error) {
      console.error('Error loading tenant:', error);
      toast.error('Error loading tenant');
      router.push('/tenants');
    } finally {
      setLoading(false);
    }
  };

  if (!id) return <div>Missing tenant id.</div>;
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tenant) {
    return <div>Tenant not found.</div>;
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
