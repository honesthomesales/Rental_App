'use client'

import { TenantForm } from '@/components/TenantForm'
import { TenantsService } from '@rental-app/api'
import { toast } from 'react-hot-toast'

export default function NewTenantPage() {
  const handleSuccess = (tenant: unknown) => {
    toast.success('Tenant created successfully!')
    // Redirect to tenants list
    window.location.href = '/tenants'
  }

  const handleCancel = () => {
    window.location.href = '/tenants'
  }

  // Test function for debugging
  const testMinimalTenant = async () => {
    try {
      console.log('Testing minimal tenant creation...');
      const testData = {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com'
      };
      console.log('Test data:', testData);
      const response = await TenantsService.create(testData);
      console.log('Test response:', response);
      if (response.success) {
        toast.success('Test tenant created successfully!');
      } else {
        toast.error(`Test failed: ${response.error}`);
      }
    } catch (error) {
      console.error('Test error:', error);
      toast.error(`Test error: ${error}`);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add New Tenant</h1>
        <p className="text-gray-600 mt-2">Create a new tenant record</p>
      </div>

      {/* Debug Test Button */}
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">🧪 Debug Tools</h3>
        <button
          onClick={testMinimalTenant}
          className="btn btn-secondary"
        >
          Test Minimal Tenant Creation
        </button>
        <p className="text-sm text-yellow-700 mt-2">
          This button tests tenant creation with minimal data to help debug the 400 error.
        </p>
      </div>

      <TenantForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
} 
