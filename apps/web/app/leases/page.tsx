'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@rental-app/api'
import { 
  Calendar, 
  DollarSign, 
  User, 
  Home, 
  Play, 
  AlertTriangle,
  Eye,
  RefreshCw,
  X,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Archive,
  Plus
} from 'lucide-react'
import toast from 'react-hot-toast'
import CreateLeaseForm from './components/CreateLeaseForm'
import EditLeaseForm from './components/EditLeaseForm'
import { normalizeLeaseStatus } from '../../src/lib/rentModel'

interface Lease {
  id: string
  tenant_id: string
  property_id: string | null
  rent: number
  rent_cadence: string
  rent_due_day: number | null
  move_in_fee: number | null
  late_fee_amount: number | null
  lease_pdf_url: string | null
  lease_start_date: string
  lease_end_date: string
  status: string
  created_at: string
  updated_at: string
  RENT_tenants?: {
    first_name: string
    last_name: string
  }
  RENT_properties?: {
    name: string
    address: string
  }
}

interface RentPeriod {
  id: string
  lease_id: string
  period_due_date: string
  rent_amount: number
  status: string
  amount_paid: number
}

export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([])
  const [filteredLeases, setFilteredLeases] = useState<Lease[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null)
  const [showPeriodsModal, setShowPeriodsModal] = useState(false)
  const [periods, setPeriods] = useState<RentPeriod[]>([])
  const [loadingPeriods, setLoadingPeriods] = useState(false)
  const [processingLease, setProcessingLease] = useState<string | null>(null)
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [rentFilter, setRentFilter] = useState('all')
  const [cadenceFilter, setCadenceFilter] = useState('all')
  const [sortField, setSortField] = useState<'tenant' | 'property' | 'rent' | 'status' | 'dates'>('tenant')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showRetired, setShowRetired] = useState(false)
  
  // Create lease modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingLease, setEditingLease] = useState<Lease | null>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])

  useEffect(() => {
    loadLeases()
    loadProperties()
    loadTenants()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [leases, searchTerm, statusFilter, rentFilter, cadenceFilter, sortField, sortDirection, showRetired])

  const loadLeases = async () => {
    try {
      setLoading(true)
      console.log('Loading leases...')
      
      if (!supabase) {
        console.error('Supabase client not available')
        toast.error('Database connection error')
        return
      }

      const { data, error } = await supabase
        .from('RENT_leases')
        .select(`
          *,
          RENT_tenants!inner(first_name, last_name),
          RENT_properties!inner(name, address)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading leases:', error)
        toast.error('Error loading leases')
        return
      }

      console.log('Leases loaded:', data)
      setLeases(data || [])
    } catch (error) {
      console.error('Error loading leases:', error)
      toast.error('Error loading leases')
    } finally {
      setLoading(false)
    }
  }

  const loadProperties = async () => {
    try {
      if (!supabase) return

      const { data, error } = await supabase
        .from('RENT_properties')
        .select('id, name, address')
        .order('name')

      if (error) {
        console.error('Error loading properties:', error)
        return
      }

      setProperties(data || [])
    } catch (error) {
      console.error('Error loading properties:', error)
    }
  }

  const loadTenants = async () => {
    try {
      if (!supabase) return

      const { data, error } = await supabase
        .from('RENT_tenants')
        .select('id, first_name, last_name')
        .order('first_name')

      if (error) {
        console.error('Error loading tenants:', error)
        return
      }

      setTenants(data || [])
    } catch (error) {
      console.error('Error loading tenants:', error)
    }
  }

  const generatePeriods = async (leaseId: string) => {
    try {
      setProcessingLease(leaseId)
      console.log('Generating periods for lease:', leaseId)
      
      const response = await fetch(`/api/leases/${leaseId}/generatePeriods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate periods')
      }

      toast.success('Periods generated successfully')
      console.log('Periods generated:', result)
    } catch (error) {
      console.error('Error generating periods:', error)
      toast.error(error instanceof Error ? error.message : 'Error generating periods')
    } finally {
      setProcessingLease(null)
    }
  }

  const assessLateFees = async (leaseId: string) => {
    try {
      setProcessingLease(leaseId)
      console.log('Assessing late fees for lease:', leaseId)
      
      const response = await fetch(`/api/leases/${leaseId}/assessLateFees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to assess late fees')
      }

      toast.success('Late fees assessed successfully')
      console.log('Late fees assessed:', result)
    } catch (error) {
      console.error('Error assessing late fees:', error)
      toast.error(error instanceof Error ? error.message : 'Error assessing late fees')
    } finally {
      setProcessingLease(null)
    }
  }

  const terminateLease = async (leaseId: string) => {
    if (!confirm('Are you sure you want to terminate this lease? This action cannot be undone.')) {
      return
    }

    try {
      setProcessingLease(leaseId)
      console.log('Terminating lease:', leaseId)
      
      if (!supabase) {
        console.error('Supabase client not available')
        toast.error('Database connection error')
        return
      }
      
      const { error } = await supabase
        .from('RENT_leases')
        .update({ status: 'terminated' })
        .eq('id', leaseId)
      
      if (error) {
        console.error('Error terminating lease:', error)
        toast.error('Error terminating lease')
        return
      }
      
      toast.success('Lease terminated successfully')
      loadLeases() // Reload to update the list
    } catch (error) {
      console.error('Error terminating lease:', error)
      toast.error('Error terminating lease')
    } finally {
      setProcessingLease(null)
    }
  }

  const retireLease = async (leaseId: string) => {
    if (!confirm('Are you sure you want to retire this lease? It will be hidden from the main view but can be shown using the toggle button.')) {
      return
    }

    try {
      setProcessingLease(leaseId)
      console.log('Retiring lease:', leaseId)
      
      if (!supabase) {
        console.error('Supabase client not available')
        toast.error('Database connection error')
        return
      }
      
      const { error } = await supabase
        .from('RENT_leases')
        .update({ status: 'retired' })
        .eq('id', leaseId)
      
      if (error) {
        console.error('Error retiring lease:', error)
        toast.error('Error retiring lease')
        return
      }
      
      toast.success('Lease retired successfully')
      loadLeases() // Reload to update the list
    } catch (error) {
      console.error('Error retiring lease:', error)
      toast.error('Error retiring lease')
    } finally {
      setProcessingLease(null)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...leases]

    // Apply retired filter first
    if (!showRetired) {
      filtered = filtered.filter(lease => lease.status !== 'retired')
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(lease => 
        lease.RENT_tenants?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lease.RENT_tenants?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lease.RENT_properties?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lease.RENT_properties?.address?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lease => lease.status === statusFilter)
    }

    // Apply rent filter
    if (rentFilter !== 'all') {
      const [min, max] = rentFilter.split('-').map(Number)
      if (max) {
        filtered = filtered.filter(lease => lease.rent >= min && lease.rent <= max)
      } else {
        filtered = filtered.filter(lease => lease.rent >= min)
      }
    }

    // Apply cadence filter
    if (cadenceFilter !== 'all') {
      filtered = filtered.filter(lease => lease.rent_cadence === cadenceFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case 'tenant':
          aValue = `${a.RENT_tenants?.first_name} ${a.RENT_tenants?.last_name}`.toLowerCase()
          bValue = `${b.RENT_tenants?.first_name} ${b.RENT_tenants?.last_name}`.toLowerCase()
          break
        case 'property':
          aValue = a.RENT_properties?.name?.toLowerCase() || ''
          bValue = b.RENT_properties?.name?.toLowerCase() || ''
          break
        case 'rent':
          aValue = a.rent
          bValue = b.rent
          break
        case 'status':
          aValue = a.status.toLowerCase()
          bValue = b.status.toLowerCase()
          break
        case 'dates':
          aValue = new Date(a.lease_start_date).getTime()
          bValue = new Date(b.lease_start_date).getTime()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    setFilteredLeases(filtered)
  }

  const handleSort = (field: 'tenant' | 'property' | 'rent' | 'status' | 'dates') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleLeaseCreated = () => {
    loadLeases() // Reload the leases list
  }

  const handleEditLease = (lease: Lease) => {
    setEditingLease(lease)
    setShowEditModal(true)
  }

  const handleLeaseUpdated = () => {
    loadLeases() // Reload the leases list
  }

  const loadPeriods = async (leaseId: string) => {
    try {
      setLoadingPeriods(true)
      console.log('Loading periods for lease:', leaseId)
      
      if (!supabase) {
        console.error('Supabase client not available')
        toast.error('Database connection not available')
        return
      }
      
      const { data, error } = await supabase
        .from('RENT_rent_periods')
        .select('*')
        .eq('lease_id', leaseId)
        .order('period_due_date', { ascending: true })

      if (error) {
        console.error('Error loading periods:', error)
        toast.error('Error loading periods')
        return
      }

      console.log('Periods loaded:', data)
      // Transform data to match our interface
      const transformedPeriods = (data || []).map(period => ({
        ...period
      }))
      setPeriods(transformedPeriods)
    } catch (error) {
      console.error('Error loading periods:', error)
      toast.error('Error loading periods')
    } finally {
      setLoadingPeriods(false)
    }
  }

  const showPeriodsPreview = async (lease: Lease) => {
    setSelectedLease(lease)
    setShowPeriodsModal(true)
    await loadPeriods(lease.id)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getOrdinal = (day: number) => {
    if (day >= 11 && day <= 13) {
      return `${day}th`
    }
    switch (day % 10) {
      case 1: return `${day}st`
      case 2: return `${day}nd`
      case 3: return `${day}rd`
      default: return `${day}th`
    }
  }

  const getStatusColor = (status: string) => {
    const normalizedStatus = normalizeLeaseStatus(status)
    switch (normalizedStatus) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'ended':
        return 'bg-red-100 text-red-800'
      case 'terminated':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

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
            <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leases</h1>
                <p className="text-gray-600">Manage lease agreements and rent periods</p>
        </div>
              <div className="flex space-x-2">
        <button
          onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center space-x-2 transition-colors"
                  title="Create New Lease"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Lease</span>
                </button>
                <button
                  onClick={() => setShowRetired(!showRetired)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    showRetired 
                      ? 'bg-gray-600 text-white border-gray-600' 
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                  title={showRetired ? 'Hide retired leases' : 'Show retired leases'}
                >
                  {showRetired ? 'Hide Retired' : 'Show Retired'}
        </button>
      </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Leases</p>
              <p className="text-2xl font-bold text-primary-600">{filteredLeases.length}</p>
        </div>
      </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-wrap gap-4 pb-6">
            {/* Search */}
            <div className="flex-1 min-w-64">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                  placeholder="Search by tenant or property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
              <option value="terminated">Terminated</option>
            </select>
            
            {/* Rent Filter */}
            <select
              value={rentFilter}
              onChange={(e) => setRentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Rent</option>
              <option value="0-500">$0 - $500</option>
              <option value="500-1000">$500 - $1,000</option>
              <option value="1000-1500">$1,000 - $1,500</option>
              <option value="1500-2000">$1,500 - $2,000</option>
              <option value="2000">$2,000+</option>
            </select>
            
            {/* Cadence Filter */}
            <select
              value={cadenceFilter}
              onChange={(e) => setCadenceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Cadence</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {leases.length === 0 ? (
          <div className="card">
            <div className="card-content text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Leases Found</h3>
              <p className="text-gray-600">No lease agreements have been created yet.</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-content p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        Actions
                      </th>
                      <th 
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('tenant')}
                      >
                        <div className="flex items-center">
                    Tenant
                          {sortField === 'tenant' && (
                            sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                          )}
                        </div>
                  </th>
                      <th 
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-32"
                        onClick={() => handleSort('property')}
                      >
                        <div className="flex items-center">
                    Property
                          {sortField === 'property' && (
                            sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('rent')}
                      >
                        <div className="flex items-center">
                          Rent
                          {sortField === 'rent' && (
                            sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                          )}
                        </div>
                  </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cadence
                  </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Due Day
                  </th>
                      <th 
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('dates')}
                      >
                        <div className="flex items-center">
                          Dates
                          {sortField === 'dates' && (
                            sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                          )}
                        </div>
                  </th>
                      <th 
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center">
                    Status
                          {sortField === 'status' && (
                            sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                          )}
                        </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeases.map((lease) => (
                  <tr key={lease.id} className="hover:bg-gray-50">
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            {/* Top row icons */}
                            <div className="flex space-x-1">
                              <button
                                onClick={() => showPeriodsPreview(lease)}
                                className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                                title="View Periods"
                              >
                                <Eye className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleEditLease(lease)}
                                className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                                title="Edit Lease"
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => generatePeriods(lease.id)}
                                disabled={processingLease === lease.id}
                                className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded disabled:opacity-50"
                                title="Generate Periods"
                              >
                                {processingLease === lease.id ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Play className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            {/* Bottom row icons */}
                            <div className="flex space-x-1">
                              <button
                                onClick={() => assessLateFees(lease.id)}
                                disabled={processingLease === lease.id}
                                className="p-1 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded disabled:opacity-50"
                                title="Assess Late Fees"
                              >
                                <AlertTriangle className="h-3 w-3" />
                              </button>
                              {lease.status === 'active' && (
                                <button
                                  onClick={() => terminateLease(lease.id)}
                                  disabled={processingLease === lease.id}
                                  className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded disabled:opacity-50"
                                  title="Terminate Lease"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                              {lease.status !== 'retired' && (
                                <button
                                  onClick={() => retireLease(lease.id)}
                                  disabled={processingLease === lease.id}
                                  className="p-1 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded disabled:opacity-50"
                                  title="Retire Lease"
                                >
                                  <Archive className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-1" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {lease.RENT_tenants?.first_name} {lease.RENT_tenants?.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                        <td className="px-3 py-3 whitespace-nowrap w-32">
                      <div className="flex items-center">
                            <Home className="h-4 w-4 text-gray-400 mr-1" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                                {lease.RENT_properties?.name}
                          </div>
                              <div className="text-xs text-gray-500 truncate">
                                {lease.RENT_properties?.address}
                          </div>
                        </div>
                      </div>
                    </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(lease.rent)}
                      </div>
                      </div>
                    </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                          {lease.rent_cadence}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 w-20">
                          {lease.rent_due_day ? getOrdinal(lease.rent_due_day) : 'N/A'}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(lease.lease_start_date)}
                      </div>
                          <div className="text-xs text-gray-500">
                            to {formatDate(lease.lease_end_date)}
                      </div>
                    </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lease.status)}`}>
                        {normalizeLeaseStatus(lease.status)}
                      </span>
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

      {/* Periods Preview Modal */}
      {showPeriodsModal && selectedLease && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Rent Periods - {selectedLease.RENT_tenants?.first_name} {selectedLease.RENT_tenants?.last_name}
                </h3>
                      <button
                  onClick={() => setShowPeriodsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                      >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                      </button>
              </div>
              
              {loadingPeriods ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : periods.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No periods found for this lease.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paid
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Late Fee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {periods.map((period) => (
                        <tr key={period.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(period.period_due_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(period.rent_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(period.amount_paid)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="text-gray-500">N/A</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              period.status === 'paid' 
                                ? 'bg-green-100 text-green-800'
                                : period.status === 'partial'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {period.status}
                            </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
            </div>
          </div>
          </div>
        )}

      {/* Create Lease Modal */}
      <CreateLeaseForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleLeaseCreated}
        properties={properties}
        tenants={tenants}
      />

      {/* Edit Lease Modal */}
      {editingLease && (
        <EditLeaseForm
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingLease(null)
          }}
          onSuccess={handleLeaseUpdated}
          lease={editingLease}
        />
      )}
    </div>
  )
}