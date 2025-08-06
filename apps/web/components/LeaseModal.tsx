'use client'

import { useState, useEffect } from 'react'
import { X, Save, User, Home, Calendar, DollarSign, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { TenantsService, PropertiesService, LeasesService } from '@rental-app/api'

interface Lease {
  id: string
  tenant_id: string
  property_id: string
  lease_start_date: string
  lease_end_date: string
  rent: number
  rent_cadence: string
  rent_due_day?: number
  move_in_fee: number
  late_fee_amount: number
  lease_pdf_url?: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
}

interface Tenant {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
}

interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
  monthly_rent?: number
}

interface LeaseModalProps {
  lease?: Lease | null
  onClose: () => void
  onSave: () => void
}

export function LeaseModal({ lease, onClose, onSave }: LeaseModalProps) {
  const [formData, setFormData] = useState({
    tenant_id: '',
    property_id: '',
    lease_start_date: '',
    lease_end_date: '',
    rent: 0,
    rent_cadence: 'monthly',
    rent_due_day: 1,
    move_in_fee: 0,
    late_fee_amount: 50,
    status: 'active',
    notes: ''
  })

  const [tenants, setTenants] = useState<Tenant[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [showTenantSelect, setShowTenantSelect] = useState(false)
  const [showPropertySelect, setShowPropertySelect] = useState(false)
  const [tenantSearch, setTenantSearch] = useState('')
  const [propertySearch, setPropertySearch] = useState('')

  const isEditing = !!lease

  useEffect(() => {
    loadTenants()
    loadProperties()
    
    if (lease) {
      setFormData({
        tenant_id: lease.tenant_id,
        property_id: lease.property_id,
        lease_start_date: lease.lease_start_date,
        lease_end_date: lease.lease_end_date,
        rent: lease.rent,
        rent_cadence: lease.rent_cadence,
        rent_due_day: lease.rent_due_day || 1,
        move_in_fee: lease.move_in_fee,
        late_fee_amount: lease.late_fee_amount,
        status: lease.status,
        notes: lease.notes || ''
      })
    }
  }, [lease])

  const loadTenants = async () => {
    try {
      const response = await TenantsService.getAll()
      if (response.success && response.data) {
        setTenants(response.data)
      }
    } catch (error) {
      console.error('Error loading tenants:', error)
    }
  }

  const loadProperties = async () => {
    try {
      const response = await PropertiesService.getAll()
      if (response.success && response.data) {
        setProperties(response.data)
      }
    } catch (error) {
      console.error('Error loading properties:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.tenant_id || !formData.property_id) {
      toast.error('Please select both a tenant and property')
      return
    }

    if (!formData.lease_start_date || !formData.lease_end_date) {
      toast.error('Please select both start and end dates')
      return
    }

    if (new Date(formData.lease_end_date) <= new Date(formData.lease_start_date)) {
      toast.error('End date must be after start date')
      return
    }

    if (formData.rent <= 0) {
      toast.error('Rent amount must be greater than 0')
      return
    }

    setLoading(true)

    try {
      let response
      if (isEditing && lease) {
        response = await LeasesService.update({
          id: lease.id,
          ...formData
        })
      } else {
        response = await LeasesService.create(formData)
      }

      if (response.success) {
        toast.success(isEditing ? 'Lease updated successfully' : 'Lease created successfully')
        onSave()
      } else {
        toast.error(response.error || 'Failed to save lease')
      }
    } catch (error) {
      console.error('Error saving lease:', error)
      toast.error('Error saving lease')
    } finally {
      setLoading(false)
    }
  }

  const getSelectedTenant = () => {
    return tenants.find(t => t.id === formData.tenant_id)
  }

  const getSelectedProperty = () => {
    return properties.find(p => p.id === formData.property_id)
  }

  const filteredTenants = tenants.filter(tenant =>
    `${tenant.first_name} ${tenant.last_name}`.toLowerCase().includes(tenantSearch.toLowerCase()) ||
    tenant.email?.toLowerCase().includes(tenantSearch.toLowerCase())
  )

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(propertySearch.toLowerCase()) ||
    property.address.toLowerCase().includes(propertySearch.toLowerCase())
  )

  const calculateEndDate = (startDate: string, months: number) => {
    if (!startDate) return ''
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + months)
    return date.toISOString().split('T')[0]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Lease' : 'Create New Lease'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tenant and Property Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tenant Selection */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tenant *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTenantSelect(!showTenantSelect)}
                  className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className={getSelectedTenant() ? 'text-gray-900' : 'text-gray-500'}>
                      {getSelectedTenant() 
                        ? `${getSelectedTenant()?.first_name} ${getSelectedTenant()?.last_name}`
                        : 'Select a tenant'
                      }
                    </span>
                  </div>
                </button>
                
                {showTenantSelect && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="p-3 border-b border-gray-200">
                      <input
                        type="text"
                        placeholder="Search tenants..."
                        value={tenantSearch}
                        onChange={(e) => setTenantSearch(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredTenants.map(tenant => (
                        <button
                          key={tenant.id}
                          type="button"
                          onClick={() => {
                            handleInputChange('tenant_id', tenant.id)
                            setShowTenantSelect(false)
                            setTenantSearch('')
                          }}
                          className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium">{tenant.first_name} {tenant.last_name}</div>
                          {tenant.email && (
                            <div className="text-sm text-gray-500">{tenant.email}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Property Selection */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPropertySelect(!showPropertySelect)}
                  className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <Home className="h-5 w-5 text-gray-400" />
                    <span className={getSelectedProperty() ? 'text-gray-900' : 'text-gray-500'}>
                      {getSelectedProperty() 
                        ? getSelectedProperty()?.name
                        : 'Select a property'
                      }
                    </span>
                  </div>
                </button>
                
                {showPropertySelect && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="p-3 border-b border-gray-200">
                      <input
                        type="text"
                        placeholder="Search properties..."
                        value={propertySearch}
                        onChange={(e) => setPropertySearch(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredProperties.map(property => (
                        <button
                          key={property.id}
                          type="button"
                          onClick={() => {
                            handleInputChange('property_id', property.id)
                            if (property.monthly_rent) {
                              handleInputChange('rent', property.monthly_rent)
                            }
                            setShowPropertySelect(false)
                            setPropertySearch('')
                          }}
                          className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium">{property.name}</div>
                          <div className="text-sm text-gray-500">{property.address}</div>
                          {property.monthly_rent && (
                            <div className="text-sm text-gray-500">
                              ${property.monthly_rent}/month
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lease Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Start Date *
              </label>
              <input
                type="date"
                value={formData.lease_start_date}
                onChange={(e) => {
                  handleInputChange('lease_start_date', e.target.value)
                  // Auto-calculate end date for 12-month lease
                  if (e.target.value) {
                    handleInputChange('lease_end_date', calculateEndDate(e.target.value, 12))
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                End Date *
              </label>
              <input
                type="date"
                value={formData.lease_end_date}
                onChange={(e) => handleInputChange('lease_end_date', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Rent and Cadence */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Rent Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.rent}
                onChange={(e) => handleInputChange('rent', parseFloat(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rent Cadence *
              </label>
              <select
                value={formData.rent_cadence}
                onChange={(e) => handleInputChange('rent_cadence', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="monthly">Monthly</option>
                <option value="bi-weekly">Bi-Weekly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>

          {/* Rent Due Day (for monthly payments only) */}
          {formData.rent_cadence === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Rent Due Day (Day of Month) *
              </label>
              <select
                value={formData.rent_due_day}
                onChange={(e) => handleInputChange('rent_due_day', parseInt(e.target.value) || 1)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Select the day of the month when rent is due (e.g., 1st, 15th, 30th)
              </p>
            </div>
          )}

          {/* Fees */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Move-in Fee
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.move_in_fee}
                onChange={(e) => handleInputChange('move_in_fee', parseFloat(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Late Fee Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.late_fee_amount}
                onChange={(e) => handleInputChange('late_fee_amount', parseFloat(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="50.00"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Additional notes about the lease..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : (isEditing ? 'Update Lease' : 'Create Lease')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 