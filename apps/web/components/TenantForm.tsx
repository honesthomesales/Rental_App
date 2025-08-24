'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TenantsService, PropertiesService } from '@rental-app/api'
import type { Tenant, CreateTenantData, UpdateTenantData, Property } from '@rental-app/api'
import { X, Save, User, Home } from 'lucide-react'
import toast from 'react-hot-toast'

const tenantSchema = z.object({
  property_id: z.string().optional(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  lease_start_date: z.string().optional(),
  lease_end_date: z.string().optional(),
  monthly_rent: z.number().min(0, 'Rent must be positive').optional(),
  security_deposit: z.number().min(0, 'Move in fee must be positive').optional(),
  rent_cadence: z.string().optional(),
  notes: z.string().optional(),
})

type TenantFormData = z.infer<typeof tenantSchema>

interface TenantFormProps {
  tenant?: Tenant
  onSuccess: (tenant: Tenant) => void
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
      
      reset({
        property_id: tenant.property_id || undefined,
        first_name: tenant.first_name,
        last_name: tenant.last_name,
        email: tenant.email || undefined,
        phone: tenant.phone || undefined,
        emergency_contact_name: tenant.emergency_contact_name || undefined,
        emergency_contact_phone: tenant.emergency_contact_phone || undefined,
        lease_start_date: activeLease?.lease_start_date || tenant.lease_start_date || undefined,
        lease_end_date: activeLease?.lease_end_date || tenant.lease_end_date || undefined,
        monthly_rent: activeLease?.rent || tenant.monthly_rent || undefined,
        security_deposit: tenant.security_deposit || undefined,
        rent_cadence: activeLease?.rent_cadence || undefined,
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
    try {
      setLoading(true)
      
      if (tenant) {
        // Update existing tenant
        const response = await TenantsService.update(tenant.id, data)
        
        if (response.success && response.data) {
          onSuccess(response.data)
        } else {
          toast.error('Failed to update tenant')
        }
      } else {
        // Create new tenant
        console.log('Creating new tenant with data:', data)
        
        const createData: CreateTenantData = {
          ...data
        }
        
        console.log('CreateTenantData:', createData)
        
        const response = await TenantsService.create(createData)
        
        console.log('TenantsService.create response:', response)
        
        if (response.success && response.data) {
          onSuccess(response.data)
        } else {
          console.error('Failed to create tenant:', response.error)
          toast.error(`Failed to create tenant: ${response.error || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Error in onSubmit:', error)
      toast.error(`Error saving tenant: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
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
                className="input"
                placeholder="Enter phone number"
              />
            </div>

            {/* Property Assignment */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Property Assignment</h3>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Property (Optional)
              </label>
              <select {...register('property_id')} className="input">
                <option value="">Select a property (optional)</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.address}
                  </option>
                ))}
              </select>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Rent
              </label>
              <input
                {...register('monthly_rent', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="input"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Security Deposit
              </label>
              <input
                {...register('security_deposit', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="input"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rent Cadence
              </label>
              <select {...register('rent_cadence')} className="input">
                <option value="">Select rent cadence</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {/* Emergency Contact */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Emergency Contact</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact Name
              </label>
              <input
                {...register('emergency_contact_name')}
                className="input"
                placeholder="Enter emergency contact name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact Phone
              </label>
              <input
                {...register('emergency_contact_phone')}
                className="input"
                placeholder="Enter emergency contact phone"
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