'use client'

import { TenantsService } from '@rental-app/api'
import type { Tenant } from '@rental-app/api'

interface LateTenantNoticeProps {
  tenant: Tenant
}

export function LateTenantNotice({ tenant }: LateTenantNoticeProps) {
  const today = new Date()
  const noticeDate = new Date(today.getTime() + (5 * 24 * 60 * 60 * 1000)) // 5 days from today
  const totalDue = TenantsService.calculateTotalDue(tenant)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto print:p-0">
      {/* Header */}
      <div className="text-center mb-8 print:mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 print:text-xl">
          5-Day Notice to Vacate or Pay Rent
        </h1>
        <p className="text-gray-600">Date: {formatDate(noticeDate)}</p>
      </div>

      {/* To/From Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 print:mb-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">To:</h3>
          <div className="text-gray-700">
            <p className="font-medium">{tenant.first_name} {tenant.last_name}</p>
            {tenant.properties && (
              <p>{tenant.properties.address}</p>
            )}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">From:</h3>
          <div className="text-gray-700">
            <p className="font-medium">Honest Home Sales, LLC - Member: Billy Rochester</p>
            <p>PO Box 705</p>
            <p>Cowpens SC 29330</p>
          </div>
        </div>
      </div>

      {/* Main Notice */}
      <div className="border-2 border-gray-300 p-6 mb-8 print:mb-6">
        <h2 className="text-xl font-bold text-center text-gray-900 mb-6 print:mb-4">
          NOTICE TO VACATE OR PAY RENT
        </h2>
        
        <p className="text-gray-700 mb-4">
          This notice serves as formal notification that you are past due on your rent for the premises located at:
        </p>
        
        <div className="bg-gray-50 p-4 mb-6 print:mb-4 border-l-4 border-red-500">
          <p className="font-medium text-gray-900">
            {tenant.properties ? tenant.properties.address : 'Property address not available'}
          </p>
        </div>
        
        <p className="text-gray-700 mb-4">
          As of the date of this notice, you owe the total amount of:
        </p>
        
        <div className="bg-red-50 p-4 mb-6 print:mb-4 border-l-4 border-red-500">
          <p className="text-2xl font-bold text-red-600 print:text-xl">
            ${totalDue.toLocaleString()}
          </p>
        </div>
        
        <p className="text-gray-700 mb-4">
          You are hereby given 5 days from the date of this notice to either:
        </p>
        
        <ul className="list-none space-y-2 mb-6 print:mb-4">
          <li className="flex items-start">
            <span className="text-green-600 mr-2 mt-1">✅</span>
            <span className="text-gray-700">Pay the full amount of rent owed immediately to bring your account current; or</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2 mt-1">✅</span>
            <span className="text-gray-700">Vacate and surrender the premises to the landlord in accordance with the conditions below.</span>
          </li>
        </ul>
        
        <p className="text-gray-700 mb-4">
          If you choose to voluntarily vacate the premises within this 5-day period, leave the property in pristine condition, and deliver possession to the landlord without causing additional damage or incurring further rent, then:
        </p>
        
        <ul className="list-disc list-inside space-y-2 mb-6 print:mb-4 text-gray-700">
          <li>All late fees will be waived.</li>
          <li>You will not be pursued for a judgment for unpaid rent.</li>
        </ul>
        
        <p className="text-gray-700 mb-4">
          However, if you fail to pay the rent in full, and do not vacate the premises within 5 days of this notice, legal action may be filed to recover possession of the property, unpaid rent, and any other damages permitted by law.
        </p>
        
        <div className="bg-yellow-50 p-4 mb-6 print:mb-4 border-l-4 border-yellow-500">
          <h4 className="font-semibold text-gray-900 mb-2">Important:</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>If you pay the full past due rent before the expiration of this notice, your tenancy will continue, and no further action will be taken at this time.</li>
            <li>If you vacate voluntarily and leave the premises in pristine condition as determined by the landlord, you will be released from further liability for unpaid rent or late fees.</li>
          </ul>
        </div>
      </div>

      {/* Signature Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Landlord/Property Manager Signature:</h3>
          <div className="border-b-2 border-gray-400 h-12 mb-2 print:h-8"></div>
          <p className="text-sm text-gray-600">(Upload signature here)</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Printed Name:</h3>
          <p className="text-gray-700">Billy Rochester</p>
          <p className="text-sm text-gray-600">Member: Honest Home Sales, LLC</p>
        </div>
      </div>
      
      <div className="mt-8 print:mt-6">
        <h3 className="font-semibold text-gray-900 mb-2">Date:</h3>
        <p className="text-gray-700">{formatDate(today)}</p>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print\\:mb-6 { margin-bottom: 1.5rem !important; }
          .print\\:mb-4 { margin-bottom: 1rem !important; }
          .print\\:text-xl { font-size: 1.25rem !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:gap-6 { gap: 1.5rem !important; }
          .print\\:mt-6 { margin-top: 1.5rem !important; }
          .print\\:h-8 { height: 2rem !important; }
        }
      `}</style>
    </div>
  )
} 