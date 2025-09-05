'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PropertiesService } from '@rental-app/api'
import type { CreatePropertyData } from '@rental-app/api'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import AddressGeocoder from '@/components/AddressGeocoder'

export default function NewPropertyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreatePropertyData>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    property_type: 'house',
    status: 'empty',
    bedrooms: undefined,
    bathrooms: undefined,
    square_feet: undefined,
    year_built: undefined,
    purchase_price: undefined,
    purchase_date: '',
    current_value: undefined,
    // monthly_rent removed - rent data comes from RENT_leases
    is_for_sale: false,
    is_for_rent: true,
    insurance_policy_number: '',
    insurance_provider: '',
    insurance_expiry_date: '',
    insurance_premium: undefined,
    owner_name: '',
    owner_phone: '',
    owner_email: '',
    latitude: undefined,
    longitude: undefined,
    notes: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    let parsedValue: any = value

    if (type === 'number') {
      parsedValue = value === '' ? undefined : parseFloat(value)
    } else if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked
    }

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }))
  }

  const handleCoordinatesFound = (latitude: number, longitude: number) => {
    setFormData(prev => ({
      ...prev,
      latitude,
      longitude
    }))
    toast.success('Coordinates found and added!')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await PropertiesService.create(formData)
      
      if (response.success && response.data) {
        toast.success('Property created successfully!')
        router.push('/properties')
      } else {
        console.error('Create error:', response.error)
        toast.error('Failed to create property')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error creating property')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="btn btn-secondary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Add New Property</h1>
                <p className="text-gray-600">Create a new rental property</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="card">
            <div className="card-content">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="label">Property Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="property_type" className="label">Property Type *</label>
                  <select
                    id="property_type"
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleInputChange}
                    className="input"
                    required
                  >
                    <option value="house">House</option>
                    <option value="singlewide">Single Wide</option>
                    <option value="doublewide">Double Wide</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="address" className="label">Address *</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="city" className="label">City *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="state" className="label">State *</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="zip_code" className="label">ZIP Code *</label>
                  <input
                    type="text"
                    id="zip_code"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location Coordinates */}
          <div className="card">
            <div className="card-content">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Location Coordinates (Optional)</h2>
              <p className="text-sm text-gray-600 mb-4">
                Add latitude and longitude coordinates to display this property on the map view.
              </p>
              
              {/* Auto-geocoding section */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Auto-Convert Address to Coordinates</h3>
                <AddressGeocoder
                  address={formData.address}
                  city={formData.city}
                  state={formData.state}
                  zipCode={formData.zip_code}
                  onCoordinatesFound={handleCoordinatesFound}
                  disabled={loading}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="latitude" className="label">Latitude</label>
                  <input
                    type="number"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude || ''}
                    onChange={handleInputChange}
                    className="input"
                    step="any"
                    placeholder="e.g., 40.7128"
                  />
                </div>
                <div>
                  <label htmlFor="longitude" className="label">Longitude</label>
                  <input
                    type="number"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude || ''}
                    onChange={handleInputChange}
                    className="input"
                    step="any"
                    placeholder="e.g., -74.0060"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="card">
            <div className="card-content">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="bedrooms" className="label">Bedrooms</label>
                  <input
                    type="number"
                    id="bedrooms"
                    name="bedrooms"
                    value={formData.bedrooms || ''}
                    onChange={handleInputChange}
                    className="input"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="bathrooms" className="label">Bathrooms</label>
                  <input
                    type="number"
                    id="bathrooms"
                    name="bathrooms"
                    value={formData.bathrooms || ''}
                    onChange={handleInputChange}
                    className="input"
                    min="0"
                    step="0.5"
                  />
                </div>
                <div>
                  <label htmlFor="square_feet" className="label">Square Feet</label>
                  <input
                    type="number"
                    id="square_feet"
                    name="square_feet"
                    value={formData.square_feet || ''}
                    onChange={handleInputChange}
                    className="input"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="year_built" className="label">Year Built</label>
                  <input
                    type="number"
                    id="year_built"
                    name="year_built"
                    value={formData.year_built || ''}
                    onChange={handleInputChange}
                    className="input"
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="card">
            <div className="card-content">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Financial Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly Rent removed - rent data comes from RENT_leases */}
                <div>
                  <label htmlFor="purchase_price" className="label">Purchase Price</label>
                  <input
                    type="number"
                    id="purchase_price"
                    name="purchase_price"
                    value={formData.purchase_price || ''}
                    onChange={handleInputChange}
                    className="input"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="current_value" className="label">Current Value</label>
                  <input
                    type="number"
                    id="current_value"
                    name="current_value"
                    value={formData.current_value || ''}
                    onChange={handleInputChange}
                    className="input"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="purchase_date" className="label">Purchase Date</label>
                  <input
                    type="date"
                    id="purchase_date"
                    name="purchase_date"
                    value={formData.purchase_date}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status and Availability */}
          <div className="card">
            <div className="card-content">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Status & Availability</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="status" className="label">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="empty">Empty</option>
                    <option value="rented">Rented</option>
                    <option value="owner_finance">Owner Finance</option>
                    <option value="lease_purchase">Lease Purchase</option>
                  </select>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_for_rent"
                      checked={formData.is_for_rent}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Available for Rent</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_for_sale"
                      checked={formData.is_for_sale}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Available for Sale</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="card-content">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Information</h2>
              <div>
                <label htmlFor="notes" className="label">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="input"
                  rows={4}
                  placeholder="Any additional notes about the property..."
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
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
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Creating...' : 'Create Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 