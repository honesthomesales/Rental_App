'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@rental-app/api/src/client'
import { normalizeRentToMonthly, extractRentCadence, formatRentWithCadence } from '../lib/utils'
import { 
  Home, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  Search,
  Filter
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  property_type: string
  status: string
  bedrooms: number | null
  bathrooms: number | null
  square_feet: number | null
  year_built: number | null
  purchase_price: number | null
  purchase_date: string | null
  current_value: number | null
  monthly_rent: number | null
  is_for_rent: boolean
  is_for_sale: boolean
  insurance_policy_number: string | null
  insurance_provider: string | null
  insurance_expiry_date: string | null
  insurance_premium: number | null
  owner_name: string | null
  owner_phone: string | null
  owner_email: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface DashboardStats {
  total_properties: number
  total_tenants: number
  outstanding_balances: number
  monthly_income: number
  monthly_expenses: number
  profit: number
  total_bank_balance: number
  late_tenants_count: number
  property_type_breakdown: {
    house: number
    singlewide: number
    doublewide: number
    land: number
    loan: number
  }
}

export default function Dashboard() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    total_properties: 0,
    total_tenants: 0,
    outstanding_balances: 0,
    monthly_income: 0,
    monthly_expenses: 0,
    profit: 0,
    total_bank_balance: 0,
    late_tenants_count: 0,
    property_type_breakdown: {
      house: 0,
      singlewide: 0,
      doublewide: 0,
      land: 0,
      loan: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Direct Supabase query to get properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (propertiesError) {
        console.error('Database error:', propertiesError)
        toast.error('Failed to load properties')
        return
      }
      
      // Query to get count of occupied properties (properties with tenants who have non-blank first names)
      let occupiedData: any[] = []
      let occupiedError: any = null
      
      // Try the main query first (removed is_active filter)
      const { data: mainData, error: mainError } = await supabase
        .from('tenants')
        .select('property_id')
        .not('first_name', 'is', null)
        .neq('first_name', '')
      
      console.log('Main query data:', mainData)
      console.log('Main query error:', mainError)
      
      if (mainData && mainData.length > 0) {
        occupiedData = mainData
      } else {
        // Try alternative query without the is_active filter
        console.log('Trying alternative query...')
        const { data: altData, error: altError } = await supabase
          .from('tenants')
          .select('property_id')
          .not('first_name', 'is', null)
          .neq('first_name', '')
        
        console.log('Alternative data:', altData)
        console.log('Alternative error:', altError)
        
        if (altData && altData.length > 0) {
          occupiedData = altData
        }
      }
      
      if (occupiedError) {
        console.error('Database error:', occupiedError)
        // Don't fail completely, just set occupied count to 0
        console.log('Using fallback for tenant data')
      }
      
      if (propertiesData) {
        setProperties(propertiesData)
        
        // Calculate basic stats with normalized rent amounts
        const totalRent = propertiesData.reduce((sum, property) => {
          const rentCadence = extractRentCadence(property.notes)
          const normalizedRent = normalizeRentToMonthly(property.monthly_rent || 0, rentCadence)
          return sum + normalizedRent
        }, 0)
        
        // Calculate property type breakdown
        const typeBreakdown = propertiesData.reduce((acc, property) => {
          const type = property.property_type || 'house'
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        // Count unique occupied properties (with fallback)
        let occupiedCount = 0
        
        if (occupiedData && occupiedData.length > 0) {
          const occupiedPropertyIds = new Set(occupiedData.map((tenant: any) => tenant.property_id))
          occupiedCount = occupiedPropertyIds.size
        }
        
        console.log('Final occupied count:', occupiedCount)
        
        setStats({
          total_properties: propertiesData.length,
          total_tenants: occupiedCount, // Count of occupied properties
          outstanding_balances: 0, // Will be calculated from transactions
          monthly_income: totalRent,
          monthly_expenses: totalRent * 0.3, // Estimate 30% expenses
          profit: totalRent * 0.7,
          total_bank_balance: 45000, // From seed data
          late_tenants_count: 0, // Will be calculated from tenant data
          property_type_breakdown: {
            house: typeBreakdown.house || 0,
            singlewide: typeBreakdown.singlewide || 0,
            doublewide: typeBreakdown.doublewide || 0,
            land: typeBreakdown.land || 0,
            loan: typeBreakdown.loan || 0
          }
        })
      } else {
        toast.error('No properties found')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error loading dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Manage your rental properties</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/properties/new')}
                className="btn btn-primary btn-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Property
              </button>
              <button 
                onClick={() => router.push('/late-tenants')}
                className="btn btn-warning btn-lg"
              >
                <AlertTriangle className="w-5 h-5 mr-2" />
                Late Tenants
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Home className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Properties</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_properties}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-2 bg-success-100 rounded-lg">
                  <Users className="w-6 h-6 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Occupied</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_tenants}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-warning-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Monthly Income</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${stats.monthly_income.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-2 bg-danger-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-danger-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Late Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.late_tenants_count}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Property Type Breakdown */}
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="card-title">Property Type Breakdown</h2>
            <p className="card-description">Distribution of your properties by type</p>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.total_properties}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.property_type_breakdown.house}</div>
                <div className="text-sm text-gray-600">House</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.property_type_breakdown.doublewide}</div>
                <div className="text-sm text-gray-600">Doublewide</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.property_type_breakdown.singlewide}</div>
                <div className="text-sm text-gray-600">Singlewide</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.property_type_breakdown.loan}</div>
                <div className="text-sm text-gray-600">Loan</div>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Section */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="card-title">Properties</h2>
                <p className="card-description">Manage your rental properties</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <button className="btn btn-secondary">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </button>
              </div>
            </div>
          </div>
          <div className="card-content">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monthly Rent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProperties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{property.name}</div>
                        <div className="text-sm text-gray-500">{property.city}, {property.state}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {property.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {property.property_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          property.status === 'rented' ? 'bg-green-100 text-green-800' :
                          property.status === 'empty' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {property.status}
                        </span>
                      </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         {property.monthly_rent ? formatRentWithCadence(property.monthly_rent, extractRentCadence(property.notes || undefined)) : 'N/A'}
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => router.push(`/properties/${property.id}`)}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          View
                        </button>
                        <button
                          onClick={() => router.push(`/properties/${property.id}/edit`)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 