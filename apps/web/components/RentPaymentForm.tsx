'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TenantsService } from '@rental-app/api'
import type { Tenant } from '@rental-app/api'
import { X, Save, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  payment_date: z.string().min(1, 'Payment date is required'),
  description: z.string().optional(),
  reference_number: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface RentPaymentFormProps {
  tenant: Tenant
  onSuccess: (tenant: Tenant) => void
  onCancel: () => void
}

export function RentPaymentForm({ tenant, onSuccess, onCancel }: RentPaymentFormProps) {
  const [loading, setLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: tenant.leases?.[0]?.rent || 0, // Use lease rent instead of tenant monthly_rent
      payment_date: new Date().toISOString().split('T')[0],
      description: 'Rent payment',
    }
  })

  const onSubmit = async (data: PaymentFormData) => {
    try {
      setLoading(true)
      
      const response = await TenantsService.recordPayment(tenant.id, {
        amount: data.amount,
        payment_date: data.payment_date,
        description: data.description,
        reference_number: data.reference_number,
      })
      
      if (response.success && response.data) {
        onSuccess(response.data)
        toast.success('Payment recorded successfully')
      } else {
        toast.error('Failed to record payment')
      }
    } catch (error) {
      toast.error('Error recording payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Record Rent Payment
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {tenant.first_name} {tenant.last_name}
            </h3>
            {tenant.properties && (
              <p className="text-sm text-gray-600">
                {tenant.properties.name} - {tenant.properties.address}
              </p>
            )}
            <p className="text-sm text-gray-600">
              Monthly Rent: ${tenant.leases?.[0]?.rent?.toLocaleString() || '0'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('amount', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="input pl-10"
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date *
              </label>
              <input
                {...register('payment_date')}
                type="date"
                className="input"
              />
              {errors.payment_date && (
                <p className="text-sm text-red-600 mt-1">{errors.payment_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                {...register('description')}
                className="input"
                placeholder="e.g., Rent payment for January 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number
              </label>
              <input
                {...register('reference_number')}
                className="input"
                placeholder="e.g., Check #1234, Zelle reference"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
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
                    Record Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 