'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@rental-app/api'
import { DollarSign, X, Calendar, FileText, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { RENT_CADENCE, LEASE_STATUS, isRentDueDayRequired, getDefaultLateFee, type RentCadence, type LeaseStatus } from '../../../src/lib/rentModel'

interface CreateLeaseFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  properties: Array<{ id: string; name: string; address: string }>
  tenants: Array<{ id: string; first_name: string; last_name: string }>
}

interface NewLease {
  tenant_id: string
  property_id: string
  rent: string
  rent_cadence: RentCadence
  rent_due_day: string
  lease_start_date: string
  lease_end_date: string
  move_in_fee: string
  late_fee_amount: string
  lease_pdf_url: string
  status: LeaseStatus
}

export default function CreateLeaseForm({ isOpen, onClose, onSuccess, properties, tenants }: CreateLeaseFormProps) {
  const [loading, setLoading] = useState(false)
  const [newLease, setNewLease] = useState<NewLease>({
    tenant_id: '',
    property_id: '',
    rent: '',
    rent_cadence: 'monthly',
    rent_due_day: '1',
    lease_start_date: '',
    lease_end_date: '',
    move_in_fee: '',
    late_fee_amount: '',
    lease_pdf_url: '',
    status: 'active'
  })

  // Update late fee amount when cadence changes
  useEffect(() => {
    if (!newLease.late_fee_amount) {
      setNewLease(prev => ({
        ...prev,
        late_fee_amount: getDefaultLateFee(prev.rent_cadence).toString()
      }))
    }
  }, [newLease.rent_cadence, newLease.late_fee_amount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      if (!supabase) {
        toast.error('Database connection error')
        return
      }

      // Validate required fields
      if (!newLease.tenant_id || !newLease.property_id || !newLease.rent || 
          !newLease.lease_start_date || !newLease.lease_end_date) {
        toast.error('Please fill in all required fields')
        return
      }

      // Validate rent due day for monthly cadence
      if (newLease.rent_cadence === 'monthly' && (!newLease.rent_due_day || parseInt(newLease.rent_due_day) < 1 || parseInt(newLease.rent_due_day) > 31)) {
        toast.error('Rent due day must be between 1 and 31 for monthly cadence')
        return
      }

      // Validate numeric fields
      const rent = parseFloat(newLease.rent)
      if (isNaN(rent) || rent < 0) {
        toast.error('Rent amount must be a valid positive number')
        return
      }

      const moveInFee = newLease.move_in_fee ? parseFloat(newLease.move_in_fee) : 0
      if (newLease.move_in_fee && (isNaN(moveInFee) || moveInFee < 0)) {
        toast.error('Move-in fee must be a valid positive number')
        return
      }

      const lateFeeAmount = newLease.late_fee_amount ? parseFloat(newLease.late_fee_amount) : 0
      if (newLease.late_fee_amount && (isNaN(lateFeeAmount) || lateFeeAmount < 0)) {
        toast.error('Late fee amount must be a valid positive number')
        return
      }

      // Check for duplicate tenant-lease combination
      const { data: existingLease } = await supabase
        .from('RENT_leases')
        .select('id')
        .eq('tenant_id', newLease.tenant_id)
        .eq('property_id', newLease.property_id)
        .eq('status', 'active')
        .single()

      if (existingLease) {
        toast.error('This tenant already has an active lease for this property')
        return
      }

      // Call the API route to create lease and generate periods
      const response = await fetch('/api/leases/create-and-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: newLease.tenant_id,
          property_id: newLease.property_id,
          rent: rent,
          rent_cadence: newLease.rent_cadence,
          rent_due_day: newLease.rent_cadence === 'monthly' ? parseInt(newLease.rent_due_day) : null,
          lease_start_date: newLease.lease_start_date,
          lease_end_date: newLease.lease_end_date,
          move_in_fee: moveInFee,
          late_fee_amount: lateFeeAmount,
          lease_pdf_url: newLease.lease_pdf_url || null,
          status: newLease.status
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create lease')
      }

      toast.success('Lease created successfully')
      onSuccess()
      onClose()
      
      // Reset form
      setNewLease({
        tenant_id: '',
        property_id: '',
        rent: '',
        rent_cadence: 'monthly',
        rent_due_day: '1',
        lease_start_date: '',
        lease_end_date: '',
        move_in_fee: '',
        late_fee_amount: '',
        lease_pdf_url: '',
        status: 'active'
      })
    } catch (error) {
      console.error('Error creating lease:', error)
      toast.error(error instanceof Error ? error.message : 'Error creating lease')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create New Lease</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tenant Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tenant *
              </label>
              <select
                value={newLease.tenant_id}
                onChange={(e) => setNewLease({...newLease, tenant_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Select a tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.first_name} {tenant.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Property Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property *
              </label>
              <select
                value={newLease.property_id}
                onChange={(e) => setNewLease({...newLease, property_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Select a property</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.address}
                  </option>
                ))}
              </select>
            </div>

            {/* Rent Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rent Amount *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newLease.rent}
                  onChange={(e) => setNewLease({...newLease, rent: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Rent Cadence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rent Cadence *
              </label>
              <select
                value={newLease.rent_cadence}
                onChange={(e) => {
                  const newCadence = e.target.value as RentCadence
                  setNewLease({
                    ...newLease, 
                    rent_cadence: newCadence,
                    // Set appropriate rent_due_day based on cadence
                    rent_due_day: newCadence === 'monthly' ? '1' : ''
                  })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {RENT_CADENCE.map((cadence) => (
                  <option key={cadence} value={cadence}>
                    {cadence.charAt(0).toUpperCase() + cadence.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Rent Due Day - only for monthly cadence */}
            {isRentDueDayRequired(newLease.rent_cadence) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rent Due Day *
                </label>
                <select
                  value={newLease.rent_due_day}
                  onChange={(e) => setNewLease({...newLease, rent_due_day: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="1">1st of the month</option>
                  <option value="15">15th of the month</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose when rent is due each month
                </p>
              </div>
            )}

            {/* Rent Due Day Info - for weekly/bi-weekly */}
            {!isRentDueDayRequired(newLease.rent_cadence) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rent Due Day
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                  Friday
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {newLease.rent_cadence === 'weekly' ? 'Weekly' : 'Bi-weekly'} rent is always due on Friday
                </p>
              </div>
            )}

            {/* Move-in Fee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Move-in Fee
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newLease.move_in_fee}
                  onChange={(e) => setNewLease({...newLease, move_in_fee: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Late Fee Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Late Fee Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newLease.late_fee_amount}
                  onChange={(e) => setNewLease({...newLease, late_fee_amount: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Overrides cadence default (${getDefaultLateFee(newLease.rent_cadence)})
              </p>
            </div>

            {/* Lease PDF URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lease PDF URL
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="url"
                  value={newLease.lease_pdf_url}
                  onChange={(e) => setNewLease({...newLease, lease_pdf_url: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://example.com/lease.pdf"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={newLease.lease_start_date}
                    onChange={(e) => setNewLease({...newLease, lease_start_date: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={newLease.lease_end_date}
                    onChange={(e) => setNewLease({...newLease, lease_end_date: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={newLease.status}
                onChange={(e) => setNewLease({...newLease, status: e.target.value as LeaseStatus})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {LEASE_STATUS.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Lease'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
