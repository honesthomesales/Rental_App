'use client'

import { useState, useEffect } from 'react'
import { PaymentsService, PropertiesService, TenantsService } from '@rental-app/api'
import type { Property, Tenant } from '@rental-app/api'
import { Plus, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(today), 'yyyy-MM-dd'),
    end: format(endOfMonth(today), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [paymentsRes, propertiesRes, tenantsRes] = await Promise.all([
        PaymentsService.getAll(),
        PropertiesService.getAll(),
        TenantsService.getAll()
      ])
      
      if (paymentsRes.success && paymentsRes.data) {
        setPayments(paymentsRes.data)
        console.log('Fetched payments:', paymentsRes.data)
      }
      if (propertiesRes.success && propertiesRes.data) {
        setProperties(propertiesRes.data)
      }
      if (tenantsRes.success && tenantsRes.data) {
        setTenants(tenantsRes.data)
      }
    } catch (error) {
      toast.error('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  const getPropertyName = (propertyId?: string) => {
    if (!propertyId) return 'N/A'
    const property = properties.find(p => p.id === propertyId)
    return property?.name || 'Unknown Property'
  }

  const getTenantName = (tenantId?: string) => {
    if (!tenantId) return 'N/A'
    const tenant = tenants.find(t => t.id === tenantId)
    return tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Unknown Tenant'
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      getPropertyName(payment.property_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTenantName(payment.tenant_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.payment_type || '').toLowerCase().includes(searchTerm.toLowerCase())
    // TEMP: Remove date filtering for debugging
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
              <p className="text-gray-600">Manage all payments</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-primary-600">{payments.length}</p>
              </div>
              <Link
                href="/payments/new"
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Payment
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="card mb-6">
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))}
                  className="input w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        {filteredPayments.length === 0 ? (
          <div className="card">
            <div className="card-content text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No payments found' : 'No payments yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first payment'}
              </p>
              {!searchTerm && (
                <Link href="/payments/new" className="btn btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="card-title">Payments</h2>
                  <p className="card-description">Showing {filteredPayments.length} of {payments.length} payments</p>
                </div>
              </div>
            </div>
            <div className="card-content">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Property</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Tenant</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Payment Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-gray-900">
                          {getPropertyName(payment.property_id)}
                        </td>
                        <td className="py-4 px-4 text-gray-900">
                          {getTenantName(payment.tenant_id)}
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium text-green-600">
                            ${payment.amount?.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {payment.payment_type || 'N/A'}
                        </td>
                        <td className="py-4 px-4">
                          {payment.notes || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 