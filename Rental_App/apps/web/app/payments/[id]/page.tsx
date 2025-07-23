'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TransactionsService } from '@rental-app/api'
import type { Transaction } from '@rental-app/api'
import { ArrowLeft, Edit, Trash2, DollarSign, Calendar, FileText, MapPin, User, Building } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function TransactionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadTransaction(params.id as string)
    }
  }, [params.id])

  const loadTransaction = async (id: string) => {
    try {
      setLoading(true)
      const response = await TransactionsService.getById(id)
      
      if (response.success && response.data) {
        setTransaction(response.data)
      } else {
        toast.error('Transaction not found')
        router.push('/payments')
      }
    } catch (error) {
      toast.error('Error loading transaction')
      router.push('/payments')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!transaction || !confirm('Are you sure you want to delete this transaction?')) return

    try {
      const response = await TransactionsService.delete(transaction.id)
      
      if (response.success) {
        toast.success('Transaction deleted successfully')
        router.push('/payments')
      } else {
        toast.error(response.error || 'Failed to delete transaction')
      }
    } catch (error) {
      toast.error('Error deleting transaction')
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'rent_payment':
        return 'bg-green-100 text-green-800'
      case 'loan_payment':
        return 'bg-blue-100 text-blue-800'
      case 'expense':
        return 'bg-red-100 text-red-800'
      case 'income':
        return 'bg-emerald-100 text-emerald-800'
      case 'property_sale':
        return 'bg-purple-100 text-purple-800'
      case 'property_purchase':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'rent_payment':
        return 'Rent Payment'
      case 'loan_payment':
        return 'Loan Payment'
      case 'expense':
        return 'Expense'
      case 'income':
        return 'Income'
      case 'property_sale':
        return 'Property Sale'
      case 'property_purchase':
        return 'Property Purchase'
      default:
        return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Transaction Not Found</h2>
          <Link href="/payments" className="btn btn-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Payments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link
                href="/payments"
                className="text-gray-400 hover:text-gray-600 mr-4"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Transaction Details</h1>
                <p className="text-gray-600">View transaction information</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/payments/${transaction.id}/edit`}
                className="btn btn-primary"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
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
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Transaction Summary Card */}
        <div className="card mb-8">
          <div className="card-content">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <DollarSign className="w-8 h-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    ${transaction.amount.toLocaleString()}
                  </h2>
                  <p className="text-gray-600">{transaction.description}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                  {getTransactionTypeLabel(transaction.transaction_type)}
                </span>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.payment_status)}`}>
                    {transaction.payment_status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Transaction Date</p>
                      <p className="font-medium">{new Date(transaction.transaction_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="font-medium">{transaction.description || 'No description'}</p>
                    </div>
                  </div>
                  
                  {transaction.reference_number && (
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Reference Number</p>
                        <p className="font-medium">{transaction.reference_number}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className={`font-medium ${['expense', 'loan_payment', 'property_purchase'].includes(transaction.transaction_type) ? 'text-red-600' : 'text-green-600'}`}>
                        ${transaction.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Information</h3>
                <div className="space-y-3">
                  {transaction.properties && (
                    <div className="flex items-center">
                      <Building className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Property</p>
                        <p className="font-medium">{transaction.properties.name}</p>
                        <p className="text-sm text-gray-500">{transaction.properties.address}</p>
                      </div>
                    </div>
                  )}
                  
                  {transaction.tenants && (
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Tenant</p>
                        <p className="font-medium">{transaction.tenants.first_name} {transaction.tenants.last_name}</p>
                        {transaction.tenants.email && (
                          <p className="text-sm text-gray-500">{transaction.tenants.email}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {transaction.loans && (
                    <div className="flex items-center">
                      <Building className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Loan</p>
                        <p className="font-medium">{transaction.loans.lender_name}</p>
                        {transaction.loans.loan_number && (
                          <p className="text-sm text-gray-500">#{transaction.loans.loan_number}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {transaction.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {transaction.notes}
                </p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <p>Created: {new Date(transaction.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p>Updated: {new Date(transaction.updated_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p>ID: {transaction.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 