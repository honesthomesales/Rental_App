'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PropertiesService, TenantsService } from '@rental-app/api'
import type { Property, Tenant } from '@rental-app/api'
import { PropertyForm } from '../../../components/PropertyForm'
import { TenantForm } from '../../../components/TenantForm'
import { RentPaymentForm } from '../../../components/RentPaymentForm'
import { ArrowLeft, Edit, Trash2, Home, MapPin, DollarSign, Calendar, Phone, Mail, Users, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showTenantForm, setShowTenantForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)

  const propertyId = params.id as string
  const searchParams = new URLSearchParams(window.location.search)
  const editParam = searchParams.get('edit')

  useEffect(() => {
    loadProperty()
    loadTenants()
    if (editParam === 'true') {
      setEditing(true)
    }
  }, [propertyId, editParam])

  const loadProperty = async () => {
    try {
      setLoading(true)
      const response = await PropertiesService.getById(propertyId)
      
      if (response.success && response.data) {
        setProperty(response.data)
      } else {
        toast.error('Failed to load property')
        router.push('/')
      }
    } catch (error) {
      toast.error('Error loading property')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const loadTenants = async () => {
    try {
      const response = await TenantsService.getByProperty(propertyId)
      if (response.success && response.data) {
        setTenants(response.data)
      }
    } catch (error) {
      console.error('Failed to load tenants:', error)
    }
  }

  const handleEditSuccess = (updatedProperty: Property) => {
    setProperty(updatedProperty)
    setEditing(false)
    toast.success('Property updated successfully')
  }

  const handleDelete = async () => {
    if (!property) return
    
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return
    }

    try {
      const response = await PropertiesService.delete(property.id)
      
      if (response.success) {
        toast.success('Property deleted successfully')
        router.push('/')
      } else {
        toast.error('Failed to delete property')
      }
    } catch (error) {
      toast.error('Error deleting property')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-4">The property you're looking for doesn't exist.</p>
          <button 
            onClick={() => router.push('/')}
            className="btn btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button 
              onClick={() => setEditing(false)}
              className="btn btn-secondary mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Property Details
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Edit Property</h1>
          </div>
          
          <PropertyForm 
            property={property}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditing(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.push('/')}
            className="btn btn-secondary mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
              <p className="text-gray-600 mt-2">{property.address}</p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setEditing(true)}
                className="btn btn-primary"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button 
                onClick={handleDelete}
                className="btn btn-danger"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Basic Information</h2>
            </div>
            <div className="card-content space-y-4">
              <div className="flex items-center">
                <Home className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Property Type</p>
                  <p className="font-medium">{property.property_type}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{property.city}, {property.state} {property.zip_code}</p>
                </div>
              </div>

              {property.bedrooms && (
                <div>
                  <p className="text-sm text-gray-600">Bedrooms</p>
                  <p className="font-medium">{property.bedrooms}</p>
                </div>
              )}

              {property.bathrooms && (
                <div>
                  <p className="text-sm text-gray-600">Bathrooms</p>
                  <p className="font-medium">{property.bathrooms}</p>
                </div>
              )}

              {property.square_feet && (
                <div>
                  <p className="text-sm text-gray-600">Square Feet</p>
                  <p className="font-medium">{property.square_feet.toLocaleString()}</p>
                </div>
              )}

              {property.year_built && (
                <div>
                  <p className="text-sm text-gray-600">Year Built</p>
                  <p className="font-medium">{property.year_built}</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Information */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Financial Information</h2>
            </div>
            <div className="card-content space-y-4">
              {property.monthly_rent && (
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Monthly Rent</p>
                    <p className="font-medium">${property.monthly_rent.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {property.purchase_price && (
                <div>
                  <p className="text-sm text-gray-600">Purchase Price</p>
                  <p className="font-medium">${property.purchase_price.toLocaleString()}</p>
                </div>
              )}

              {property.current_value && (
                <div>
                  <p className="text-sm text-gray-600">Current Value</p>
                  <p className="font-medium">${property.current_value.toLocaleString()}</p>
                </div>
              )}

              {property.purchase_date && (
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Purchase Date</p>
                    <p className="font-medium">{new Date(property.purchase_date).toLocaleDateString()}</p>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                {property.is_for_rent && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                    For Rent
                  </span>
                )}
                {property.is_for_sale && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                    For Sale
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Insurance Information */}
          {(property.insurance_policy_number || property.insurance_provider) && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Insurance Information</h2>
              </div>
              <div className="card-content space-y-4">
                {property.insurance_policy_number && (
                  <div>
                    <p className="text-sm text-gray-600">Policy Number</p>
                    <p className="font-medium">{property.insurance_policy_number}</p>
                  </div>
                )}

                {property.insurance_provider && (
                  <div>
                    <p className="text-sm text-gray-600">Provider</p>
                    <p className="font-medium">{property.insurance_provider}</p>
                  </div>
                )}

                {property.insurance_expiry_date && (
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Expiry Date</p>
                      <p className="font-medium">{new Date(property.insurance_expiry_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}

                {property.insurance_premium && (
                  <div>
                    <p className="text-sm text-gray-600">Premium</p>
                    <p className="font-medium">${property.insurance_premium.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Owner Information */}
          {(property.owner_name || property.owner_phone || property.owner_email) && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Owner Information</h2>
              </div>
              <div className="card-content space-y-4">
                {property.owner_name && (
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{property.owner_name}</p>
                  </div>
                )}

                {property.owner_phone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{property.owner_phone}</p>
                    </div>
                  </div>
                )}

                {property.owner_email && (
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{property.owner_email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {property.notes && (
          <div className="card mt-8">
            <div className="card-header">
              <h2 className="card-title">Notes</h2>
            </div>
            <div className="card-content">
              <p className="text-gray-700 whitespace-pre-wrap">{property.notes}</p>
            </div>
          </div>
        )}

        {/* Tenants Section */}
        <div className="card mt-8">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="card-title">Tenants</h2>
                <p className="card-description">Manage tenants for this property</p>
              </div>
              <button 
                onClick={() => setShowTenantForm(true)}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Tenant
              </button>
            </div>
          </div>
          <div className="card-content">
            {tenants.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No tenants assigned to this property</p>
                <button 
                  onClick={() => setShowTenantForm(true)}
                  className="btn btn-primary mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Tenant
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {tenants.map((tenant) => (
                  <div key={tenant.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {tenant.first_name} {tenant.last_name}
                        </h3>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          {tenant.email && (
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-2" />
                              {tenant.email}
                            </div>
                          )}
                          {tenant.phone && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-2" />
                              {tenant.phone}
                            </div>
                          )}
                          {tenant.monthly_rent && (
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-2" />
                              Monthly Rent: ${tenant.monthly_rent.toLocaleString()}
                            </div>
                          )}
                          {tenant.last_payment_date && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              Last Payment: {new Date(tenant.last_payment_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        {tenant.late_fees_owed > 0 && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Late Fees: ${tenant.late_fees_owed.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button 
                          onClick={() => {
                            setSelectedTenant(tenant)
                            setShowPaymentForm(true)
                          }}
                          className="btn btn-sm btn-success"
                        >
                          Record Payment
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedTenant(tenant)
                            setShowTenantForm(true)
                          }}
                          className="btn btn-sm btn-secondary"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTenantForm && (
        <TenantForm
          tenant={selectedTenant || undefined}
          onSuccess={(tenant) => {
            setShowTenantForm(false)
            setSelectedTenant(null)
            loadTenants()
            if (!selectedTenant) {
              toast.success('Tenant added successfully')
            } else {
              toast.success('Tenant updated successfully')
            }
          }}
          onCancel={() => {
            setShowTenantForm(false)
            setSelectedTenant(null)
          }}
        />
      )}

      {showPaymentForm && selectedTenant && (
        <RentPaymentForm
          tenant={selectedTenant}
          onSuccess={(tenant) => {
            setShowPaymentForm(false)
            setSelectedTenant(null)
            loadTenants()
          }}
          onCancel={() => {
            setShowPaymentForm(false)
            setSelectedTenant(null)
          }}
        />
      )}
    </div>
  )
} 