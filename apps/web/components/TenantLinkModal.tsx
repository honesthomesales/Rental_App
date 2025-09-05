'use client'

import { useState, useEffect } from 'react'
import { TenantsService, PropertiesService, LeasesService } from '@rental-app/api'
import type { Tenant, Property } from '@rental-app/api'
import { X, Users, Home, Link, Unlink } from 'lucide-react'
import toast from 'react-hot-toast'

interface TenantLinkModalProps {
  propertyId: string
  propertyName: string
  onClose: () => void
  onSuccess: () => void
}

export function TenantLinkModal({ propertyId, propertyName, onClose, onSuccess }: TenantLinkModalProps) {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState<string | null>(null)
  const [unlinking, setUnlinking] = useState<string | null>(null)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
  const [rentCadence, setRentCadence] = useState('monthly') // Add rent cadence state

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    try {
      setLoading(true)
      const response = await TenantsService.getAll()
      
      if (response.success && response.data) {
        setTenants(response.data)
      } else {
        toast.error('Failed to load tenants')
      }
    } catch (error) {
      toast.error('Error loading tenants')
    } finally {
      setLoading(false)
    }
  }

  const handleLinkTenant = async (tenantId: string) => {
    try {
      setLinking(tenantId)
      
      // First, link the tenant to the property
      const tenantResponse = await TenantsService.update(tenantId, {
        property_id: propertyId
      })
      
      if (tenantResponse.success) {
        // Get the tenant data to create a lease
        const tenant = tenants.find(t => t.id === tenantId)
        
        if (tenant) {
          // Create a lease record for this tenant-property relationship
          try {
            const leaseData = {
              tenant_id: tenantId,
              property_id: propertyId,
              lease_start_date: tenant.lease_start_date || new Date().toISOString().split('T')[0],
              lease_end_date: tenant.lease_end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              rent: 0, // Rent will be set when creating the lease
              rent_cadence: rentCadence, // Use selected rent cadence from dropdown
              move_in_fee: 0,
              late_fee_amount: 50,
              status: 'active'
            }
            
            await LeasesService.create(leaseData)
          } catch (leaseError) {
            console.warn('Failed to create lease record:', leaseError)
            // Continue with property status update even if lease creation fails
          }
        }
        
        // Then, update the property status to 'rented' if it's currently 'empty'
        const propertyResponse = await PropertiesService.getById(propertyId)
        if (propertyResponse.success && propertyResponse.data) {
          const property = propertyResponse.data
          if (property.status === 'empty') {
            await PropertiesService.update(propertyId, {
              status: 'rented',
              notes: `${property.notes || ''}\n\n[${new Date().toLocaleDateString()}] Property status changed to 'rented' - tenant linked.`
            })
          }
        }
        
        toast.success('Tenant linked to property successfully! Property status updated to rented.')
        onSuccess()
        loadTenants() // Reload to update the list
      } else {
        toast.error(tenantResponse.error || 'Failed to link tenant')
      }
    } catch (error) {
      toast.error('Error linking tenant')
    } finally {
      setLinking(null)
    }
  }

  const handleUnlinkTenant = async (tenantId: string) => {
    try {
      setUnlinking(tenantId)
      
      // First, unlink the tenant from the property
      const tenantResponse = await TenantsService.update(tenantId, {
        property_id: null  // Changed from undefined to null
      })
      
      if (tenantResponse.success) {
        // Check if this was the last tenant for this property
        const remainingTenants = tenants.filter(t => t.property_id === propertyId && t.id !== tenantId)
        
        // If no more tenants, set property status to 'empty'
        if (remainingTenants.length === 0) {
          const propertyResponse = await PropertiesService.getById(propertyId)
          if (propertyResponse.success && propertyResponse.data) {
            const property = propertyResponse.data
            await PropertiesService.update(propertyId, {
              status: 'empty',
              notes: `${property.notes || ''}\n\n[${new Date().toLocaleDateString()}] Property status changed to 'empty' - all tenants unlinked.`
            })
          }
        }
        
        toast.success('Tenant unlinked from property successfully!')
        onSuccess()
        loadTenants() // Reload to update the list
      } else {
        toast.error(tenantResponse.error || 'Failed to unlink tenant')
      }
    } catch (error) {
      toast.error('Error unlinking tenant')
    } finally {
      setUnlinking(null)
    }
  }

  const linkedTenants = tenants.filter(tenant => tenant.property_id === propertyId)
  const unlinkedTenants = tenants.filter(tenant => !tenant.property_id)

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Link Tenants to Property
            </h2>
            <p className="text-gray-600 mt-1">{propertyName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Linked Tenants */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Currently Linked Tenants ({linkedTenants.length})
            </h3>
            
            {linkedTenants.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No tenants currently linked to this property</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {linkedTenants.map((tenant) => (
                  <div key={tenant.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {tenant.first_name} {tenant.last_name}
                        </h4>
                        {tenant.email && (
                          <p className="text-sm text-gray-600">{tenant.email}</p>
                        )}
                        {tenant.phone && (
                          <p className="text-sm text-gray-600">{tenant.phone}</p>
                        )}
                        {/* Rent amount removed - comes from lease data */}
                      </div>
                      <button
                        onClick={() => handleUnlinkTenant(tenant.id)}
                        disabled={unlinking === tenant.id}
                        className="btn btn-sm btn-danger"
                      >
                        {unlinking === tenant.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <Unlink className="w-4 h-4 mr-1" />
                            Unlink
                          </>
                        )}
                      </button>
                    </div>
                    {/* Removed monthly_rent display since field no longer exists */}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Tenants */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Home className="w-5 h-5 mr-2" />
              Available Tenants ({unlinkedTenants.length})
            </h3>
            
            {unlinkedTenants.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Home className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">All tenants are already linked to properties</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unlinkedTenants.map((tenant) => (
                  <div key={tenant.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {tenant.first_name} {tenant.last_name}
                        </h4>
                        {tenant.email && (
                          <p className="text-sm text-gray-600">{tenant.email}</p>
                        )}
                        {tenant.phone && (
                          <p className="text-sm text-gray-600">{tenant.phone}</p>
                        )}
                        {/* Rent amount removed - comes from lease data */}
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <select
                          value={rentCadence}
                          onChange={(e) => setRentCadence(e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="bi-weekly">Bi-weekly</option>
                          <option value="weekly">Weekly</option>
                        </select>
                        <button
                          onClick={() => handleLinkTenant(tenant.id)}
                          disabled={linking === tenant.id}
                          className="btn btn-sm btn-primary"
                        >
                          {linking === tenant.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Link className="w-4 h-4 mr-1" />
                              Link
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
} 