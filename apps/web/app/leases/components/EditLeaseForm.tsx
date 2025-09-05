'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@rental-app/api'
import { DollarSign, X, Calendar, FileText, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { RENT_CADENCE, LEASE_STATUS, isRentDueDayRequired, getDefaultLateFee, type RentCadence, type LeaseStatus } from '../../../src/lib/rentModel'

interface EditLeaseFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  lease: {
    id: string
    tenant_id: string
    property_id: string | null
    rent: number
    rent_cadence: string
    rent_due_day: number | null
    lease_start_date: string
    lease_end_date: string
    move_in_fee: number | null
    late_fee_amount: number | null
    lease_pdf_url: string | null
    status: string
    RENT_tenants?: {
      first_name: string
      last_name: string
    }
    RENT_properties?: {
      name: string
      address: string
    }
  }
}

interface EditLease {
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

export default function EditLeaseForm({ isOpen, onClose, onSuccess, lease }: EditLeaseFormProps) {
  const [loading, setLoading] = useState(false)
  const [editLease, setEditLease] = useState<EditLease>({
    rent: lease.rent.toString(),
    rent_cadence: lease.rent_cadence as RentCadence,
    rent_due_day: lease.rent_due_day?.toString() || '1',
    lease_start_date: lease.lease_start_date,
    lease_end_date: lease.lease_end_date,
    move_in_fee: lease.move_in_fee?.toString() || '',
    late_fee_amount: lease.late_fee_amount?.toString() || '',
    lease_pdf_url: lease.lease_pdf_url || '',
    status: lease.status as LeaseStatus
  })

  // Track which fields have changed
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set())

  // Update late fee amount when cadence changes
  useEffect(() => {
    if (!editLease.late_fee_amount) {
      setEditLease(prev => ({
        ...prev,
        late_fee_amount: getDefaultLateFee(prev.rent_cadence).toString()
      }))
    }
  }, [editLease.rent_cadence, editLease.late_fee_amount])

  // Track field changes
  const handleFieldChange = (field: string, value: any) => {
    setEditLease(prev => ({ ...prev, [field]: value }))
    
    // Check if this field affects future periods
    const rentAffectingFields = ['rent', 'rent_cadence', 'rent_due_day']
    if (rentAffectingFields.includes(field)) {
      setChangedFields(prev => new Set(Array.from(prev).concat(field)))
    } else {
      setChangedFields(prev => {
        const newSet = new Set(prev)
        newSet.delete(field)
        return newSet
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      if (!supabase) {
        toast.error('Database connection error')
        return
      }

      // Validate required fields
      if (!editLease.rent || !editLease.lease_start_date || !editLease.lease_end_date) {
        toast.error('Please fill in all required fields')
        return
      }

      // Validate rent due day for monthly cadence
      if (editLease.rent_cadence === 'monthly' && (!editLease.rent_due_day || parseInt(editLease.rent_due_day) < 1 || parseInt(editLease.rent_due_day) > 31)) {
        toast.error('Rent due day must be between 1 and 31 for monthly cadence')
        return
      }

      // Validate numeric fields
      const rent = parseFloat(editLease.rent)
      if (isNaN(rent) || rent < 0) {
        toast.error('Rent amount must be a valid positive number')
        return
      }

      const moveInFee = editLease.move_in_fee ? parseFloat(editLease.move_in_fee) : 0
      if (editLease.move_in_fee && (isNaN(moveInFee) || moveInFee < 0)) {
        toast.error('Move-in fee must be a valid positive number')
        return
      }

      const lateFeeAmount = editLease.late_fee_amount ? parseFloat(editLease.late_fee_amount) : 0
      if (editLease.late_fee_amount && (isNaN(lateFeeAmount) || lateFeeAmount < 0)) {
        toast.error('Late fee amount must be a valid positive number')
        return
      }

      // Check if rent-affecting fields have changed
      const rentFieldsChanged = ['rent', 'rent_cadence', 'rent_due_day'].some(field => changedFields.has(field))
      
      if (rentFieldsChanged) {
        const confirmRegenerate = confirm(
          'This updates future periods; past periods stay unchanged. Continue?'
        )
        if (!confirmRegenerate) {
          return
        }
      }

      // Update the lease
      const { error: updateError } = await supabase
        .from('RENT_leases')
        .update({
          rent: rent,
          rent_cadence: editLease.rent_cadence,
          rent_due_day: editLease.rent_cadence === 'monthly' ? parseInt(editLease.rent_due_day) : null,
          lease_start_date: editLease.lease_start_date,
          lease_end_date: editLease.lease_end_date,
          move_in_fee: moveInFee,
          late_fee_amount: lateFeeAmount,
          lease_pdf_url: editLease.lease_pdf_url || null,
          status: editLease.status
        })
        .eq('id', lease.id)

      if (updateError) {
        console.error('Error updating lease:', updateError)
        toast.error('Error updating lease')
        return
      }

      // Regenerate periods if rent-affecting fields changed
      if (rentFieldsChanged) {
        const { error: periodsError } = await (supabase as any).rpc('rent_generate_periods', {
          p_lease_id: lease.id
        })

        if (periodsError) {
          console.error('Error regenerating periods:', periodsError)
          toast.error('Lease updated but period regeneration failed')
        } else {
          toast.success('Lease updated and periods regenerated')
        }
      } else {
        toast.success('Lease updated successfully')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating lease:', error)
      toast.error(error instanceof Error ? error.message : 'Error updating lease')
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
            <h3 className="text-lg font-medium text-gray-900">
              Edit Lease - {lease.RENT_tenants?.first_name} {lease.RENT_tenants?.last_name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Property Display (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                {lease.RENT_properties?.name} - {lease.RENT_properties?.address}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Property cannot be changed. Create a new lease to change property.
              </p>
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
                  value={editLease.rent}
                  onChange={(e) => handleFieldChange('rent', e.target.value)}
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
                value={editLease.rent_cadence}
                onChange={(e) => {
                  const newCadence = e.target.value as RentCadence
                  handleFieldChange('rent_cadence', newCadence)
                  // Set appropriate rent_due_day based on cadence
                  handleFieldChange('rent_due_day', newCadence === 'monthly' ? '1' : '')
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
            {isRentDueDayRequired(editLease.rent_cadence) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rent Due Day *
                </label>
                <select
                  value={editLease.rent_due_day}
                  onChange={(e) => handleFieldChange('rent_due_day', e.target.value)}
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
            {!isRentDueDayRequired(editLease.rent_cadence) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rent Due Day
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                  Friday
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {editLease.rent_cadence === 'weekly' ? 'Weekly' : 'Bi-weekly'} rent is always due on Friday
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
                  value={editLease.move_in_fee}
                  onChange={(e) => handleFieldChange('move_in_fee', e.target.value)}
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
                  value={editLease.late_fee_amount}
                  onChange={(e) => handleFieldChange('late_fee_amount', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Overrides cadence default (${getDefaultLateFee(editLease.rent_cadence)})
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
                  value={editLease.lease_pdf_url}
                  onChange={(e) => handleFieldChange('lease_pdf_url', e.target.value)}
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
                    value={editLease.lease_start_date}
                    onChange={(e) => handleFieldChange('lease_start_date', e.target.value)}
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
                    value={editLease.lease_end_date}
                    onChange={(e) => handleFieldChange('lease_end_date', e.target.value)}
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
                value={editLease.status}
                onChange={(e) => handleFieldChange('status', e.target.value as LeaseStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {LEASE_STATUS.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Warning for rent field changes */}
            {changedFields.size > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Warning:</strong> Changes to rent amount, cadence, or due day will regenerate future rent periods. Past periods will remain unchanged.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                {loading ? 'Updating...' : 'Update Lease'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
