'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TenantsService, PropertiesService } from '@rental-app/api'
import type { Property } from '@rental-app/api'
import { X, Save, User, Home } from 'lucide-react'
import toast from 'react-hot-toast'
import { RENT_CADENCE_OPTIONS } from '@/lib/rentCadence'

// Define local types to match what we actually receive from the API
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
  properties?: Property;
  leases?: Array<{
    id: string;
    rent: number;
    rent_cadence: string;
    lease_start_date: string;
    lease_end_date: string;
    status: string;
  }>;
}

interface CreateTenantData {
  property_id?: string | null;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  // monthly_rent removed - rent data comes from RENT_leases
  lease_start_date?: string;
  lease_end_date?: string;
  notes?: string;
}

// interface UpdateTenantData extends CreateTenantData {}

const tenantSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  // monthly_rent removed - rent data comes from RENT_leases
  lease_start_date: z.string().optional().or(z.literal('')), // Tenant's preferred dates
  lease_end_date: z.string().optional().or(z.literal('')), // Tenant's preferred dates
  notes: z.string().optional().or(z.literal(''))
})

type TenantFormData = z.infer<typeof tenantSchema>

interface TenantFormProps {
  tenant?: Tenant
  onSuccess: (tenant: unknown) => void // Use any to avoid type conflicts
  onCancel: () => void
}

export function TenantForm({ tenant, onSuccess, onCancel }: TenantFormProps) {
  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
  })

  useEffect(() => {
    loadProperties()
  }, [])

  // Reset form when tenant prop changes
  useEffect(() => {
    if (tenant) {
      console.log('TenantForm: Received tenant data:', tenant)
      console.log('TenantForm: Leases array:', tenant.leases)
      
      // Get lease information from the first active lease
      const activeLease = tenant.leases?.[0]
      console.log('TenantForm: Active lease:', activeLease)
      
      // Determine property_id: use active lease property if available, otherwise tenant's direct property
      const propertyId = (activeLease as any)?.property_id || tenant.property_id || undefined
      console.log('TenantForm: Using property_id:', propertyId)
      
      reset({
        first_name: tenant.first_name,
        last_name: tenant.last_name,
        email: tenant.email || undefined,
        phone: tenant.phone || undefined,
        // Use lease rent if available
        // monthly_rent removed - rent data comes from RENT_leases
        lease_start_date: activeLease?.lease_start_date || tenant.lease_start_date || undefined,
        lease_end_date: activeLease?.lease_end_date || tenant.lease_end_date || undefined,
        notes: tenant.notes || undefined,
      })
    }
  }, [tenant, reset])

  const loadProperties = async () => {
    try {
      const response = await PropertiesService.getAll() // Removed filter
      if (response.success && response.data) {
        setProperties(response.data)
      }
    } catch (error) {
      console.error('Failed to load properties:', error)
    }
  }

  const onSubmit = async (data: TenantFormData) => {
    console.log('🔍 FORM SUBMISSION - Data before Zod validation:', data);
    console.log('🔍 All form fields:', Object.keys(data));
    console.log('🔍 Form values:', Object.entries(data));
    
    try {
      setLoading(true)
      
      // Convert data for API (monthly_rent removed)
      const formData: CreateTenantData = {
        ...data,
        // monthly_rent removed - rent data comes from RENT_leases
        // Don't include property_id in form submission - it's managed through leases
        property_id: undefined
      }
      
      console.log('Form data (ready for API):', formData);
      console.log('🔍 API fields being sent:', Object.keys(formData));
      console.log('🔍 API values being sent:', Object.entries(formData));
      
      if (tenant) {
        // Update existing tenant
        const response = await TenantsService.update(tenant.id, formData)
        
        if (response.success && response.data) {
          onSuccess(response.data)
        } else {
          toast.error('Failed to update tenant')
        }
      } else {
        // Create new tenant
        console.log('Creating new tenant with data:', formData)
        const createData: CreateTenantData = { ...formData }
        console.log('CreateTenantData:', createData)
        const response = await TenantsService.create(createData)
        
        if (response.success && response.data) {
          onSuccess(response.data)
        } else {
          toast.error('Failed to create tenant')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {tenant ? 'Edit Tenant' : 'Add New Tenant'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit((data) => {
          console.log('🔍 FORM SUBMISSION - Data before Zod validation:', data);
          onSubmit(data);
        }, (errors) => {
          console.log('🔍 FORM VALIDATION ERRORS:', errors);
          console.log('🔍 Form errors object:', errors);
          
          // Log all field errors in detail
          Object.keys(errors).forEach(field => {
            console.log(`🔍 ${field} error:`, errors[field as keyof typeof errors]);
          });
        })} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                {...register('first_name')}
                className="input"
                placeholder="Enter first name"
              />
              {errors.first_name && (
                <p className="text-sm text-red-600 mt-1">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                {...register('last_name')}
                className="input"
                placeholder="Enter last name"
              />
              {errors.last_name && (
                <p className="text-sm text-red-600 mt-1">{errors.last_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                className="input"
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                {...register('phone')}
                type="tel"
                className="input"
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
              )}
            </div>

            {/* Monthly Rent removed - rent data comes from RENT_leases */}

            {/* Property Assignment */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Property Assignment</h3>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                {(() => {
                  // Get property info from active lease or tenant's direct property
                  const activeLease = tenant?.leases?.[0]
                  const propertyId = (activeLease as any)?.property_id || tenant?.property_id
                  const property = properties.find(p => p.id === propertyId)
                  return property ? `${property.name} - ${property.address}` : 'No property assigned'
                })()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Property cannot be changed. Create a new lease to change property.
              </p>
            </div>

            {/* Lease Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Lease Information</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lease Start Date
              </label>
              <input
                {...register('lease_start_date')}
                type="date"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lease End Date
              </label>
              <input
                {...register('lease_end_date')}
                type="date"
                className="input"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="input"
                placeholder="Enter any additional notes"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            {/* Debug button - remove after testing */}
            {!tenant && (
              <button
                type="button"
                onClick={async () => {
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
                }}
                className="btn btn-secondary mr-auto"
              >
                🧪 Test Minimal Tenant
              </button>
            )}
            
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {tenant ? 'Update Tenant' : 'Create Tenant'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 
