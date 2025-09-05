'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PropertiesService } from '@rental-app/api'
import type { Property, CreatePropertyData, UpdatePropertyData } from '@rental-app/api'
import { X, Save, Home } from 'lucide-react'
import toast from 'react-hot-toast'

const propertySchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  zip_code: z.string().min(5, 'Valid ZIP code is required'),
  property_type: z.enum(['house', 'singlewide', 'doublewide']),
  status: z.enum(['rented', 'empty', 'owner_finance', 'lease_purchase']).default('empty'),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  square_feet: z.number().optional(),
  year_built: z.number().optional(),
  purchase_price: z.number().optional(),
  purchase_date: z.string().optional(),
  current_value: z.number().optional(),
  // monthly_rent removed - rent data comes from RENT_leases
  is_for_sale: z.boolean().default(false),
  is_for_rent: z.boolean().default(true),
  insurance_policy_number: z.string().optional(),
  insurance_provider: z.string().optional(),
  insurance_expiry_date: z.string().optional(),
  insurance_premium: z.number().optional(),
  owner_name: z.string().optional(),
  owner_phone: z.string().optional(),
  owner_email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
})

type PropertyFormData = z.infer<typeof propertySchema>

interface PropertyFormProps {
  property?: Property
  onSuccess?: (property: Property) => void
  onCancel?: () => void
  modal?: boolean
}

export function PropertyForm({ property, onSuccess, onCancel, modal = true }: PropertyFormProps) {
  const [loading, setLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: property ? {
      name: property.name,
      address: property.address,
      city: property.city,
      state: property.state,
      zip_code: property.zip_code,
      property_type: property.property_type,
      status: property.status,
      bedrooms: property.bedrooms || undefined,
      bathrooms: property.bathrooms || undefined,
      square_feet: property.square_feet || undefined,
      year_built: property.year_built || undefined,
      purchase_price: property.purchase_price || undefined,
      purchase_date: property.purchase_date || undefined,
      current_value: property.current_value || undefined,
      // monthly_rent removed - rent data comes from RENT_leases
      is_for_sale: property.is_for_sale,
      is_for_rent: property.is_for_rent,
      insurance_policy_number: property.insurance_policy_number || undefined,
      insurance_provider: property.insurance_provider || undefined,
      insurance_expiry_date: property.insurance_expiry_date || undefined,
      insurance_premium: property.insurance_premium || undefined,
      owner_name: property.owner_name || undefined,
      owner_phone: property.owner_phone || undefined,
      owner_email: property.owner_email || undefined,
      notes: property.notes || undefined,
    } : {
      status: 'empty',
      is_for_rent: true,
      is_for_sale: false,
    }
  })

  const onSubmit = async (data: PropertyFormData) => {
    try {
      setLoading(true)
      
      console.log('🔍 PropertyForm onSubmit - Form data:', data)
      console.log('🔍 PropertyForm onSubmit - Property ID:', property?.id)
      
      if (property) {
        // Update existing property
        console.log('🔍 PropertyForm onSubmit - Calling PropertiesService.update with:', { id: property.id, data })
        const response = await PropertiesService.update(property.id, data)
        
        console.log('🔍 PropertyForm onSubmit - Update response:', response)
        
        if (response.success && response.data) {
          toast.success('Property updated successfully')
          onSuccess?.(response.data)
        } else {
          console.error('❌ PropertyForm onSubmit - Update failed:', response.error)
          toast.error(response.error || 'Failed to update property')
        }
      } else {
        // Create new property
        const createData: CreatePropertyData = data
        const response = await PropertiesService.create(createData)
        
        if (response.success && response.data) {
          toast.success('Property created successfully')
          reset()
          onSuccess?.(response.data)
        } else {
          toast.error(response.error || 'Failed to create property')
        }
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Name *
              </label>
              <input
                {...register('name')}
                className="input"
                placeholder="Enter property name"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type *
              </label>
              <select {...register('property_type')} className="input">
                <option value="house">House</option>
                <option value="singlewide">Singlewide</option>
                <option value="doublewide">Doublewide</option>
              </select>
              {errors.property_type && (
                <p className="text-sm text-red-600 mt-1">{errors.property_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="rented"
                    {...register('status')}
                    className="form-radio text-primary-600"
                  />
                  <span className="ml-2">Rented</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="empty"
                    {...register('status')}
                    className="form-radio text-primary-600"
                  />
                  <span className="ml-2">Empty</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="owner_finance"
                    {...register('status')}
                    className="form-radio text-primary-600"
                  />
                  <span className="ml-2">Owner Finance</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="lease_purchase"
                    {...register('status')}
                    className="form-radio text-primary-600"
                  />
                  <span className="ml-2">Lease Purchase</span>
                </label>
              </div>
              {errors.status && (
                <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <input
                {...register('address')}
                className="input"
                placeholder="Enter full address"
              />
              {errors.address && (
                <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                {...register('city')}
                className="input"
                placeholder="Enter city"
              />
              {errors.city && (
                <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <input
                {...register('state')}
                className="input"
                placeholder="TX"
                maxLength={2}
              />
              {errors.state && (
                <p className="text-sm text-red-600 mt-1">{errors.state.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ZIP Code *
              </label>
              <input
                {...register('zip_code')}
                className="input"
                placeholder="78701"
              />
              {errors.zip_code && (
                <p className="text-sm text-red-600 mt-1">{errors.zip_code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedrooms
              </label>
              <input
                {...register('bedrooms', { valueAsNumber: true })}
                type="number"
                className="input"
                placeholder="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bathrooms
              </label>
              <input
                {...register('bathrooms', { valueAsNumber: true })}
                type="number"
                step="0.5"
                className="input"
                placeholder="2.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Square Feet
              </label>
              <input
                {...register('square_feet', { valueAsNumber: true })}
                type="number"
                className="input"
                placeholder="2000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year Built
              </label>
              <input
                {...register('year_built', { valueAsNumber: true })}
                type="number"
                className="input"
                placeholder="2020"
              />
            </div>

            {/* Financial Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Financial Information</h3>
            </div>

            {/* Monthly Rent removed - rent data comes from RENT_leases */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Price
              </label>
              <input
                {...register('purchase_price', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="input"
                placeholder="300000.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Date
              </label>
              <input
                {...register('purchase_date')}
                type="date"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Value
              </label>
              <input
                {...register('current_value', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="input"
                placeholder="350000.00"
              />
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Status</h3>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  {...register('is_for_rent')}
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Available for Rent</span>
              </label>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  {...register('is_for_sale')}
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Available for Sale</span>
              </label>
            </div>

            {/* Owner Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Owner Information</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Name
              </label>
              <input
                {...register('owner_name')}
                className="input"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Phone
              </label>
              <input
                {...register('owner_phone')}
                className="input"
                placeholder="(512) 555-0101"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Email
              </label>
              <input
                {...register('owner_email')}
                type="email"
                className="input"
                placeholder="owner@example.com"
              />
              {errors.owner_email && (
                <p className="text-sm text-red-600 mt-1">{errors.owner_email.message}</p>
              )}
            </div>

            {/* Insurance Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Insurance Information</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Insurance Provider
              </label>
              <input
                {...register('insurance_provider')}
                className="input"
                placeholder="State Farm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Policy Number
              </label>
              <input
                {...register('insurance_policy_number')}
                className="input"
                placeholder="POL-001-2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                {...register('insurance_expiry_date')}
                type="date"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Premium
              </label>
              <input
                {...register('insurance_premium', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="input"
                placeholder="1200.00"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                className="input resize-none"
                placeholder="Additional notes about the property..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {property ? 'Update Property' : 'Create Property'}
            </button>
          </div>
        </form>
  )

  if (modal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <Home className="w-6 h-6 text-primary-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">
                {property ? 'Edit Property' : 'Add New Property'}
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {formContent}
        </div>
      </div>
    )
  }

  return formContent
} 
