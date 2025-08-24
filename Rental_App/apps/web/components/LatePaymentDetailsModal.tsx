'use client'

import { useState, useEffect } from 'react'
import { type LateTenant } from '@rental-app/api'

// Extended interface for the local data structure
interface ExtendedLateTenant extends LateTenant {
  property_name: string
  property_address: string
  rent: number
  total_owed: number
  late_periods: number
  lease_start_date: string
  rent_cadence: string
  late_payment_info: any
}

interface PaymentPeriod {
  expectedDate: Date
  isLate: boolean
  daysLate: number
  lateFees: number
  totalPaid: number
  outstanding: number
  editedLateFees?: number
  editedPaymentDate?: string
  editedPaymentAmount?: number
}

interface LatePaymentDetailsModalProps {
  tenant: ExtendedLateTenant
  onClose: () => void
  onSave: (updatedData: any) => void
}

export default function LatePaymentDetailsModal({ tenant, onClose, onSave }: LatePaymentDetailsModalProps) {
  const [paymentPeriods, setPaymentPeriods] = useState<PaymentPeriod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tenant.late_payment_info?.payPeriods) {
      const periods = tenant.late_payment_info.payPeriods.map((period: any) => ({
        ...period,
        editedLateFees: period.lateFees,
        editedPaymentDate: '',
        editedPaymentAmount: 0
      }))
      setPaymentPeriods(periods)
    }
    setLoading(false)
  }, [tenant])

  const handleLateFeeChange = (index: number, value: number) => {
    const updatedPeriods = [...paymentPeriods]
    updatedPeriods[index].editedLateFees = Math.max(0, value)
    setPaymentPeriods(updatedPeriods)
  }

  const handlePaymentDateChange = (index: number, value: string) => {
    const updatedPeriods = [...paymentPeriods]
    updatedPeriods[index].editedPaymentDate = value
    setPaymentPeriods(updatedPeriods)
  }

  const handlePaymentAmountChange = (index: number, value: number) => {
    const updatedPeriods = [...paymentPeriods]
    updatedPeriods[index].editedPaymentAmount = Math.max(0, value)
    setPaymentPeriods(updatedPeriods)
  }

  const calculateUpdatedTotal = () => {
    return paymentPeriods.reduce((total, period) => {
      const lateFees = period.editedLateFees || period.lateFees
      const paymentAmount = period.editedPaymentAmount || 0
      const outstanding = Math.max(0, period.outstanding - paymentAmount)
      return total + lateFees + outstanding
    }, 0)
  }

  const handleSave = () => {
    const updatedData = {
      tenantId: tenant.id,
      paymentPeriods: paymentPeriods.map(period => ({
        expectedDate: period.expectedDate,
        originalLateFees: period.lateFees,
        updatedLateFees: period.editedLateFees,
        originalOutstanding: period.outstanding,
        paymentDate: period.editedPaymentDate,
        paymentAmount: period.editedPaymentAmount,
        newOutstanding: Math.max(0, period.outstanding - (period.editedPaymentAmount || 0))
      })),
      totalUpdated: calculateUpdatedTotal()
    }
    onSave(updatedData)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Late Payment Details - {tenant.first_name} {tenant.last_name}
            </h2>
            <p className="text-sm text-gray-600">{tenant.property_address}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Tenant Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Monthly Rent</h3>
              <p className="text-lg font-semibold text-gray-900">${tenant.rent.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Current Total Owed</h3>
              <p className="text-lg font-semibold text-red-600">${tenant.total_owed.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Updated Total</h3>
              <p className="text-lg font-semibold text-blue-600">${calculateUpdatedTotal().toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Late Periods</h3>
              <p className="text-lg font-semibold text-gray-900">{tenant.late_periods}</p>
            </div>
          </div>

          {/* Payment Periods Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Payment Periods</h3>
              <p className="text-sm text-gray-600">Edit late fees and record payments for each period</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expected Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Late
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Late Fees
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Outstanding
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      New Outstanding
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentPeriods.map((period, index) => (
                    <tr key={index} className={period.isLate ? 'bg-red-50' : 'bg-green-50'}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {period.expectedDate.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {period.daysLate}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={period.editedLateFees || period.lateFees}
                          onChange={(e) => handleLateFeeChange(index, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        ${period.outstanding.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="date"
                          value={period.editedPaymentDate || ''}
                          onChange={(e) => handlePaymentDateChange(index, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={period.editedPaymentAmount || 0}
                          onChange={(e) => handlePaymentAmountChange(index, parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                        ${Math.max(0, period.outstanding - (period.editedPaymentAmount || 0)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary of Changes */}
          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Summary of Changes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Original Total:</span>
                <span className="ml-2 font-semibold">${tenant.total_owed.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-blue-700">Updated Total:</span>
                <span className="ml-2 font-semibold">${calculateUpdatedTotal().toLocaleString()}</span>
              </div>
              <div>
                <span className="text-blue-700">Difference:</span>
                <span className={`ml-2 font-semibold ${calculateUpdatedTotal() < tenant.total_owed ? 'text-green-600' : 'text-red-600'}`}>
                  ${(calculateUpdatedTotal() - tenant.total_owed).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
} 