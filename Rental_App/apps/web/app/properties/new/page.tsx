'use client'

import { useRouter } from 'next/navigation'
import { PropertyForm } from '../../../components/PropertyForm'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NewPropertyPage() {
  const router = useRouter()

  const handleSuccess = () => {
    toast.success('Property created successfully')
    router.push('/')
  }

  const handleCancel = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button 
            onClick={handleCancel}
            className="btn btn-secondary mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Add New Property</h1>
        </div>
        
        <PropertyForm 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
} 