'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TransactionsService, PropertiesService, TenantsService } from '@rental-app/api'
import type { Transaction, Property, Tenant, CreateTransactionData, UpdateTransactionData } from '@rental-app/api'
import { X, Save, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

const transactionSchema = z.object({
  transaction_type: z.enum(['rent_payment', 'loan_payment', 'property_sale', 'property_purchase', 'expense', 'income']),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  transaction_date: z.string().min(1, 'Transaction date is required'),
  payment_status: z.enum(['pending', 'completed', 'failed', 'cancelled']).default('completed'),
  property_id: z.string().optional(),
  tenant_id: z.string().optional(),
  loan_id: z.string().optional(),
  bank_account_id: z.string().optional(),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
})

type TransactionFormData = z.infer<typeof transactionSchema>

interface TransactionFormProps {
  transaction?: Transaction
  onSuccess?: (transaction: Transaction) => void
  onCancel: () => void
}

export function TransactionForm({ transaction, onSuccess, onCancel }: TransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([])
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction ? {
      transaction_type: transaction.transaction_type,
      amount: transaction.amount,
      description: transaction.description || '',
      transaction_date: transaction.transaction_date,
      payment_status: transaction.payment_status,
      property_id: transaction.property_id || '',
      tenant_id: transaction.tenant_id || '',
      loan_id: transaction.loan_id || '',
      bank_account_id: transaction.bank_account_id || '',
      reference_number: transaction.reference_number || '',
      notes: transaction.notes || '',
    } : {
      transaction_type: 'rent_payment',
      payment_status: 'completed',
      transaction_date: new Date().toISOString().split('T')[0],
    }
  })

  const watchedPropertyId = watch('property_id')
  const watchedTransactionType = watch('transaction_type')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Filter tenants based on selected property
    if (watchedPropertyId) {
      const filtered = tenants.filter(tenant => tenant.property_id === watchedPropertyId)
      setFilteredTenants(filtered)
    } else {
      setFilteredTenants(tenants)
    }
  }, [watchedPropertyId, tenants])

  const loadData = async () => {
    try {
      const [propertiesRes, tenantsRes] = await Promise.all([
        PropertiesService.getAll(),
        TenantsService.getAll()
      ])
      
      if (propertiesRes.success && propertiesRes.data) {
        setProperties(propertiesRes.data)
      }
      
      if (tenantsRes.success && tenantsRes.data) {
        setTenants(tenantsRes.data)
        setFilteredTenants(tenantsRes.data)
      }
    } catch (error) {
      toast.error('Error loading data')
    }
  }

  const onSubmit = async (data: TransactionFormData) => {
    try {
      setLoading(true)
      
      if (transaction) {
        // Update existing transaction
        const updateData: UpdateTransactionData = {
          id: transaction.id,
          ...data
        }
        const response = await TransactionsService.update(transaction.id, updateData)
        
        if (response.success && response.data) {
          toast.success('Transaction updated successfully')
          onSuccess?.(response.data)
        } else {
          toast.error(response.error || 'Failed to update transaction')
        }
      } else {
        // Create new transaction
        const createData: CreateTransactionData = data
        const response = await TransactionsService.create(createData)
        
        if (response.success && response.data) {
          toast.success('Transaction created successfully')
          reset()
          onSuccess?.(response.data)
        } else {
          toast.error(response.error || 'Failed to create transaction')
        }
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getTransactionTypeOptions = () => {
    const options = [
      { value: 'rent_payment', label: 'Rent Payment' },
      { value: 'loan_payment', label: 'Loan Payment' },
      { value: 'expense', label: 'Expense' },
      { value: 'income', label: 'Income' },
      { value: 'property_sale', label: 'Property Sale' },
      { value: 'property_purchase', label: 'Property Purchase' },
    ]
    return options
  }

  const getStatusOptions = () => {
    const options = [
      { value: 'completed', label: 'Completed' },
      { value: 'pending', label: 'Pending' },
      { value: 'failed', label: 'Failed' },
      { value: 'cancelled', label: 'Cancelled' },
    ]
    return options
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <DollarSign className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">
              {transaction ? 'Edit Transaction' : 'Add New Transaction'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type *
              </label>
              <select {...register('transaction_type')} className="input">
                {getTransactionTypeOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.transaction_type && (
                <p className="text-sm text-red-600 mt-1">{errors.transaction_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                {...register('amount', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="input"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Date *
              </label>
              <input
                {...register('transaction_date')}
                type="date"
                className="input"
              />
              {errors.transaction_date && (
                <p className="text-sm text-red-600 mt-1">{errors.transaction_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status *
              </label>
              <select {...register('payment_status')} className="input">
                {getStatusOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.payment_status && (
                <p className="text-sm text-red-600 mt-1">{errors.payment_status.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <input
                {...register('description')}
                className="input"
                placeholder="Enter transaction description"
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number
              </label>
              <input
                {...register('reference_number')}
                className="input"
                placeholder="e.g., Check #1234"
              />
            </div>

            {/* Property and Tenant Selection */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Related Information</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property
              </label>
              <select {...register('property_id')} className="input">
                <option value="">Select Property (Optional)</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.address}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tenant
              </label>
              <select {...register('tenant_id')} className="input">
                <option value="">Select Tenant (Optional)</option>
                {filteredTenants.map(tenant => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.first_name} {tenant.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional Fields */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="input"
                placeholder="Additional notes about this transaction"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {transaction ? 'Update Transaction' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 