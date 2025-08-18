'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TransactionsService } from '@rental-app/api'
import type { Transaction } from '@rental-app/api'
import { TransactionForm } from '@/components/TransactionForm'
import toast from 'react-hot-toast'

export default function EditTransactionPage() {
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

  const handleSuccess = (updatedTransaction: Transaction) => {
    toast.success('Transaction updated successfully!')
    router.push(`/payments/${updatedTransaction.id}`)
  }

  const handleCancel = () => {
    if (transaction) {
      router.push(`/payments/${transaction.id}`)
    } else {
      router.push('/payments')
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
          <button
            onClick={() => router.push('/payments')}
            className="btn btn-primary"
          >
            Back to Payments
          </button>
        </div>
      </div>
    )
  }

  return (
    <TransactionForm
      transaction={transaction}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
}
