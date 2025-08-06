'use client'

import { useState } from 'react'
import { X, Edit, Save, FileText, Shield, User, DollarSign, MapPin, Home, Calendar, Building } from 'lucide-react'
import type { Property } from '@rental-app/api'
import { PropertiesService } from '@rental-app/api'
import toast from 'react-hot-toast'

interface PropertyInfoSheetProps {
  property: Property
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

export function PropertyInfoSheet({ property, isOpen, onClose, onUpdate }: PropertyInfoSheetProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    insurance_provider: property.insurance_provider || '',
    insurance_policy_number: property.insurance_policy_number || '',
    insurance_premium: property.insurance_premium || 0,
    insurance_expiry_date: property.insurance_expiry_date || '',
    owner_name: property.owner_name || '',
    owner_phone: property.owner_phone || '',
    owner_email: property.owner_email || '',
    sell_price: property.sell_price || 0,
    interest_rate: property.interest_rate || 0,
    property_tax: property.property_tax || 0,
    purchase_payment: property.purchase_payment || 0,
    map_id: property.map_id || '',
    notes: property.notes || ''
  })

  if (!isOpen) return null

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await PropertiesService.update({
        id: property.id,
        ...formData
      })

      if (response.success) {
        toast.success('Property information updated successfully')
        setIsEditing(false)
        onUpdate?.()
      } else {
        toast.error(response.error || 'Failed to update property')
      }
    } catch (error) {
      console.error('Error updating property:', error)
      toast.error('Error updating property')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString()
  }

  const formatPercentage = (rate: number | undefined) => {
    if (rate === undefined || rate === null) return '0%'
    return `${rate.toFixed(2)}%`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Property Information Sheet</h2>
              <p className="text-sm text-gray-600">{property.name} - {property.address}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Property Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Home className="w-5 h-5 mr-2 text-blue-600" />
              Basic Property Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Property Name</label>
                <p className="mt-1 text-sm text-gray-900">{property.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="mt-1 text-sm text-gray-900">{property.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City, State, ZIP</label>
                <p className="mt-1 text-sm text-gray-900">{property.city}, {property.state} {property.zip_code}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Property Type</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{property.property_type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  property.status === 'rented' ? 'bg-green-100 text-green-800' :
                  property.status === 'empty' ? 'bg-gray-100 text-gray-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {property.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Monthly Rent</label>
                <p className="mt-1 text-sm text-gray-900">{formatCurrency(property.monthly_rent)}</p>
              </div>
            </div>
          </div>

          {/* Insurance Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              Insurance Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Insurance Provider</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.insurance_provider}
                    onChange={(e) => handleInputChange('insurance_provider', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{property.insurance_provider || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Policy Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.insurance_policy_number}
                    onChange={(e) => handleInputChange('insurance_policy_number', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{property.insurance_policy_number || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Premium</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={formData.insurance_premium}
                    onChange={(e) => handleInputChange('insurance_premium', parseFloat(e.target.value) || 0)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{formatCurrency(property.insurance_premium)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.insurance_expiry_date}
                    onChange={(e) => handleInputChange('insurance_expiry_date', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{formatDate(property.insurance_expiry_date)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-green-600" />
              Owner Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Owner Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.owner_name}
                    onChange={(e) => handleInputChange('owner_name', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{property.owner_name || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Owner Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.owner_phone}
                    onChange={(e) => handleInputChange('owner_phone', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{property.owner_phone || 'Not set'}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Owner Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.owner_email}
                    onChange={(e) => handleInputChange('owner_email', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{property.owner_email || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-yellow-600" />
              Financial Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Purchase Price</label>
                <p className="mt-1 text-sm text-gray-900">{formatCurrency(property.purchase_price)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Purchase Payment</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_payment}
                    onChange={(e) => handleInputChange('purchase_payment', parseFloat(e.target.value) || 0)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{formatCurrency(property.purchase_payment)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sell Price</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sell_price}
                    onChange={(e) => handleInputChange('sell_price', parseFloat(e.target.value) || 0)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{formatCurrency(property.sell_price)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Interest Rate</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={formData.interest_rate}
                    onChange={(e) => handleInputChange('interest_rate', parseFloat(e.target.value) || 0)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{formatPercentage(property.interest_rate)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Property Tax</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={formData.property_tax}
                    onChange={(e) => handleInputChange('property_tax', parseFloat(e.target.value) || 0)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{formatCurrency(property.property_tax)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Value</label>
                <p className="mt-1 text-sm text-gray-900">{formatCurrency(property.current_value)}</p>
              </div>
            </div>
          </div>

          {/* Mapping Information */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-purple-600" />
              Mapping Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Map ID</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.map_id}
                    onChange={(e) => handleInputChange('map_id', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{property.map_id || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Coordinates</label>
                <p className="mt-1 text-sm text-gray-900">
                  {property.latitude && property.longitude 
                    ? `${property.latitude.toFixed(6)}, ${property.longitude.toFixed(6)}`
                    : 'Not set'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-gray-600" />
              Notes
            </h3>
            <div>
              {isEditing ? (
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                  placeholder="Add notes about this property..."
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {property.notes || 'No notes available'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 