'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TransactionForm } from '@/components/TransactionForm'
import type { Transaction } from '@rental-app/api'
import toast from 'react-hot-toast'

export default function NewTransactionPage() {
  const router = useRouter()
  const [showForm, setShowForm] = useState(true)

  const handleSuccess = (transaction: Transaction) => {
    toast.success('Transaction created successfully!')
    router.push('/payments')
  }

  const handleCancel = () => {
    router.push('/payments')
  }

  if (!showForm) {
    return null
  }

  return (
    <TransactionForm
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
} 
