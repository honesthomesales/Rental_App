'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { Calendar, DollarSign, TrendingUp, PieChart, Plus, Minus } from 'lucide-react'
import { TenantsService, PropertiesService, PaymentsService } from '@rental-app/api'
import type { Tenant, Property } from '@rental-app/api'
import { normalizeRentToMonthly, extractRentCadence } from '../../lib/utils'
import toast from 'react-hot-toast'

interface ProfitData {
  potentialIncome: number
  expectedIncome: number
  collectedIncome: number
  insurance: number
  taxes: number
  repairs: number
  otherExpenses: number
  expectedProfit: number
  netProfit: number
}

interface Expense {
  id: string
  type: 'insurance' | 'taxes' | 'repairs' | 'other'
  amount: number
  description: string
  date: string
}

export default function ProfitPage() {
  const [profitData, setProfitData] = useState<ProfitData>({
    potentialIncome: 0,
    expectedIncome: 0,
    collectedIncome: 0,
    insurance: 0,
    taxes: 0,
    repairs: 0,
    otherExpenses: 0,
    expectedProfit: 0,
    netProfit: 0
  })
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showProfitDetails, setShowProfitDetails] = useState(false)
  const [showPotentialIncomeDetails, setShowPotentialIncomeDetails] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [monthlyPotentialIncome, setMonthlyPotentialIncome] = useState(0)
  const [monthsInRange, setMonthsInRange] = useState(0)
  const [fixedExpenses, setFixedExpenses] = useState({
    insurance: 0,
    taxes: 0
  })
  const [newExpense, setNewExpense] = useState({
    type: 'repairs' as 'repairs' | 'other',
    amount: 0,
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  })

  useEffect(() => {
    loadProfitData()
  }, [dateRange])

  const loadProfitData = async () => {
    try {
      setLoading(true)
      
      // Load properties and tenants for potential income calculation
      const [propertiesResponse, tenantsResponse, paymentsResponse] = await Promise.all([
        PropertiesService.getAll(),
        TenantsService.getAll(),
        PaymentsService.getAll()
      ])

      if (!propertiesResponse.success || !tenantsResponse.success || !paymentsResponse.success) {
        toast.error('Failed to load data')
        return
      }

      const propertiesData = propertiesResponse.data || []
      const tenants = tenantsResponse.data || []
      const payments = paymentsResponse.data || []

      // Calculate potential income for the date range (if ALL properties were occupied)
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      const calculatedMonthsInRange = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                           (endDate.getMonth() - startDate.getMonth()) + 1
      
      // Calculate potential income (sum of all property monthly rents * months in range)
      const calculatedMonthlyPotentialIncome = propertiesData.reduce((sum, property) => {
        const rentCadence = extractRentCadence(property.notes)
        const normalizedRent = normalizeRentToMonthly(property.monthly_rent || 0, rentCadence)
        return sum + normalizedRent
      }, 0)

      // Update state for modal access
      setProperties(propertiesData)
      setMonthlyPotentialIncome(calculatedMonthlyPotentialIncome)
      setMonthsInRange(calculatedMonthsInRange)
      
      // Use monthly amounts for display (not multiplied by months in range)
      const potentialIncome = calculatedMonthlyPotentialIncome
      
      // Calculate expected income (for properties that currently have renters)
      const occupiedPropertyIds = new Set(tenants.map(tenant => tenant.property_id))
      const monthlyExpectedIncome = propertiesData
        .filter(property => occupiedPropertyIds.has(property.id))
        .reduce((sum, property) => {
          const rentCadence = extractRentCadence(property.notes)
          const normalizedRent = normalizeRentToMonthly(property.monthly_rent || 0, rentCadence)
          return sum + normalizedRent
        }, 0)
      
      const expectedIncome = monthlyExpectedIncome
      
      // Debug logging
      console.log('Profit calculations:', {
        totalProperties: propertiesData.length,
        occupiedProperties: occupiedPropertyIds.size,
        monthsInRange: calculatedMonthsInRange,
        monthlyPotentialIncome: calculatedMonthlyPotentialIncome,
        monthlyExpectedIncome,
        potentialIncome,
        expectedIncome
      })

      // Calculate collected income for the date range
      const collectedIncome = payments
        .filter(payment => {
          const paymentDate = new Date(payment.payment_date)
          const startDate = new Date(dateRange.start)
          const endDate = new Date(dateRange.end)
          return paymentDate >= startDate && paymentDate <= endDate
        })
        .reduce((sum, payment) => sum + (payment.amount || 0), 0)

      // Calculate expenses by type
      const insurance = fixedExpenses.insurance
      const taxes = fixedExpenses.taxes
      const repairs = expenses.filter(e => e.type === 'repairs').reduce((sum, e) => sum + e.amount, 0)
      const otherExpenses = expenses.filter(e => e.type === 'other').reduce((sum, e) => sum + e.amount, 0)

      const totalExpenses = insurance + taxes + repairs + otherExpenses
      const expectedProfit = expectedIncome - totalExpenses
      const netProfit = collectedIncome - totalExpenses

      // Debug logging
      console.log('Profit calculation:', {
        propertiesCount: properties.length,
        tenantsCount: tenants.length,
        paymentsCount: payments.length,
        monthlyPotentialIncome,
        monthsInRange,
        potentialIncome,
        collectedIncome,
        totalExpenses,
        netProfit
      })

      setProfitData({
        potentialIncome,
        expectedIncome,
        collectedIncome,
        insurance,
        taxes,
        repairs,
        otherExpenses,
        expectedProfit,
        netProfit
      })

    } catch (error) {
      console.error('Error loading profit data:', error)
      toast.error('Error loading profit data')
    } finally {
      setLoading(false)
    }
  }

  const addExpense = () => {
    if (newExpense.amount <= 0 || !newExpense.description.trim()) {
      toast.error('Please enter a valid amount and description')
      return
    }

    const expense: Expense = {
      id: Date.now().toString(),
      ...newExpense
    }

    setExpenses([...expenses, expense])
    setNewExpense({
      type: 'other',
      amount: 0,
      description: '',
      date: format(new Date(), 'yyyy-MM-dd')
    })
    setShowAddExpense(false)
    loadProfitData() // Recalculate profit
  }

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id))
    loadProfitData() // Recalculate profit
  }

  const getExpenseTypeColor = (type: string) => {
    switch (type) {
      case 'insurance': return 'bg-blue-100 text-blue-800'
      case 'taxes': return 'bg-red-100 text-red-800'
      case 'repairs': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getExpenseTypeLabel = (type: string) => {
    switch (type) {
      case 'insurance': return 'Insurance'
      case 'taxes': return 'Taxes'
      case 'repairs': return 'Repairs'
      default: return 'Other'
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profit Analysis</h1>
              <p className="text-gray-600">Track income, expenses, and profitability</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${profitData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${profitData.netProfit.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Picker */}
        <div className="card mb-8">
          <div className="card-header">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-primary-600 mr-2" />
              <h2 className="card-title">Date Range</h2>
            </div>
          </div>
          <div className="card-content">
            <div className="flex space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Income Overview */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-primary-600 mr-2" />
                <h2 className="card-title">Income Overview</h2>
              </div>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Potential Income</p>
                    <p className="text-2xl font-bold text-green-600">${profitData.potentialIncome.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">If all properties were occupied</p>
                  </div>
                  <button
                    onClick={() => {
                      console.log('Potential income button clicked!')
                      console.log('Properties in state:', properties.length)
                      console.log('Sample property:', properties[0])
                      setShowPotentialIncomeDetails(true)
                    }}
                    className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                    type="button"
                  >
                    <TrendingUp className="w-8 h-8 text-green-600 cursor-pointer" />
                  </button>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Expected Income</p>
                    <p className="text-2xl font-bold text-purple-600">${profitData.expectedIncome.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">From currently occupied properties</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-600" />
                </div>
                
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Collected Income</p>
                    <p className="text-2xl font-bold text-blue-600">${profitData.collectedIncome.toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Collection Rate</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {profitData.expectedIncome > 0 
                        ? ((profitData.collectedIncome / profitData.expectedIncome) * 100).toFixed(1)
                        : '0'}%
                    </p>
                    <p className="text-xs text-gray-500">vs Expected Income</p>
                  </div>
                  <PieChart className="w-8 h-8 text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center">
                <PieChart className="w-5 h-5 text-primary-600 mr-2" />
                <h2 className="card-title">Collected vs Expected Income</h2>
              </div>
            </div>
            <div className="card-content">
              <div className="flex items-center justify-center h-64">
                <div className="relative w-48 h-48">
                  {/* Dynamic pie chart using SVG */}
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background circle (expected income) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="8"
                    />
                    {/* Collected income slice */}
                    {profitData.expectedIncome > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="8"
                        strokeDasharray={`${(profitData.collectedIncome / profitData.expectedIncome) * 251.2} 251.2`}
                        strokeDashoffset="62.8"
                        transform="rotate(-90 50 50)"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Collected</p>
                      <p className="text-lg font-bold">${profitData.collectedIncome.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                    <span className="text-sm">Collected Income</span>
                  </div>
                  <span className="text-sm font-medium">${profitData.collectedIncome.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                    <span className="text-sm">Expected Income</span>
                  </div>
                  <span className="text-sm font-medium">${profitData.expectedIncome.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Expenses Section */}
        <div className="card mt-8">
          <div className="card-header">
            <div className="flex items-center">
              <Minus className="w-5 h-5 text-red-600 mr-2" />
              <h2 className="card-title">Fixed Expenses</h2>
            </div>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Insurance (Monthly)</label>
                <input
                  type="number"
                  value={fixedExpenses.insurance}
                  onChange={(e) => {
                    setFixedExpenses({ ...fixedExpenses, insurance: parseFloat(e.target.value) || 0 })
                    loadProfitData()
                  }}
                  className="input w-full"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Taxes (Monthly)</label>
                <input
                  type="number"
                  value={fixedExpenses.taxes}
                  onChange={(e) => {
                    setFixedExpenses({ ...fixedExpenses, taxes: parseFloat(e.target.value) || 0 })
                    loadProfitData()
                  }}
                  className="input w-full"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Variable Expenses Section */}
        <div className="card mt-8">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Minus className="w-5 h-5 text-red-600 mr-2" />
                <h2 className="card-title">Variable Expenses</h2>
              </div>
              <button
                onClick={() => setShowAddExpense(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </button>
            </div>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Insurance</p>
                <p className="text-xl font-bold text-blue-600">${profitData.insurance.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Taxes</p>
                <p className="text-xl font-bold text-red-600">${profitData.taxes.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Expected Profit</p>
                <p className={`text-xl font-bold ${profitData.expectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${profitData.expectedProfit.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">Repairs</p>
                <p className="text-xl font-bold text-yellow-600">${profitData.repairs.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Other</p>
                <p className="text-xl font-bold text-gray-600">${profitData.otherExpenses.toLocaleString()}</p>
              </div>
            </div>

            {/* Expenses List */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getExpenseTypeColor(expense.type)}`}>
                          {getExpenseTypeLabel(expense.type)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">{expense.description}</td>
                      <td className="py-4 px-4 font-medium text-red-600">
                        ${expense.amount.toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => removeExpense(expense.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        No expenses added yet. Click "Add Expense" to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Add Expense</h2>
              <button
                onClick={() => setShowAddExpense(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newExpense.type}
                  onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value as 'repairs' | 'other' })}
                  className="input"
                >
                  <option value="repairs">Repairs</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                  className="input"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="input"
                  placeholder="Enter description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddExpense(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={addExpense}
                className="btn btn-primary"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profit Details Modal */}
      {showProfitDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <TrendingUp className="w-6 h-6 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Profit Analysis Details
                </h2>
              </div>
              <button
                onClick={() => setShowProfitDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Income Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Income Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-gray-600">Potential Income</span>
                      <span className="font-semibold text-green-600">${profitData.potentialIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm text-gray-600">Expected Income</span>
                      <span className="font-semibold text-purple-600">${profitData.expectedIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm text-gray-600">Collected Income</span>
                      <span className="font-semibold text-blue-600">${profitData.collectedIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Collection Rate</span>
                      <span className="font-semibold text-gray-600">
                        {profitData.expectedIncome > 0 
                          ? ((profitData.collectedIncome / profitData.expectedIncome) * 100).toFixed(1)
                          : '0'}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expense Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm text-gray-600">Insurance</span>
                      <span className="font-semibold text-blue-600">${profitData.insurance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm text-gray-600">Taxes</span>
                      <span className="font-semibold text-red-600">${profitData.taxes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm text-gray-600">Repairs</span>
                      <span className="font-semibold text-yellow-600">${profitData.repairs.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Other Expenses</span>
                      <span className="font-semibold text-gray-600">${profitData.otherExpenses.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg border-l-4 border-red-500">
                      <span className="text-sm font-medium text-gray-700">Total Expenses</span>
                      <span className="font-semibold text-red-600">
                        ${(profitData.insurance + profitData.taxes + profitData.repairs + profitData.otherExpenses).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profit Summary */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Expected Profit</p>
                    <p className={`text-xl font-bold ${profitData.expectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${profitData.expectedProfit.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Expected Income - Total Expenses</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Actual Profit</p>
                    <p className={`text-xl font-bold ${profitData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${profitData.netProfit.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Collected Income - Total Expenses</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Profit Variance</p>
                    <p className={`text-xl font-bold ${(profitData.netProfit - profitData.expectedProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${(profitData.netProfit - profitData.expectedProfit).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Actual vs Expected</p>
                  </div>
                </div>
              </div>

              {/* Date Range Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Analysis Period</h3>
                <p className="text-sm text-gray-600">
                  {format(new Date(dateRange.start), 'MMMM dd, yyyy')} to {format(new Date(dateRange.end), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Potential Income Details Modal */}
      {showPotentialIncomeDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <TrendingUp className="w-6 h-6 text-green-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Potential Income Breakdown
                </h2>
              </div>
              <button
                onClick={() => setShowPotentialIncomeDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculation Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Properties</p>
                    <p className="text-xl font-bold text-green-600">{properties.length}</p>
                  </div>
                                      <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Monthly Potential Income</p>
                      <p className="text-xl font-bold text-blue-600">${monthlyPotentialIncome.toLocaleString()}</p>
                    </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Months in Range</p>
                    <p className="text-xl font-bold text-purple-600">{monthsInRange}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Property</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Address</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Rent Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Rent Cadence</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Monthly Equivalent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {properties.length > 0 ? (
                        properties.map((property) => {
                          const rentCadence = extractRentCadence(property.notes)
                          const normalizedRent = normalizeRentToMonthly(property.monthly_rent || 0, rentCadence)
                          
                          return (
                            <tr key={property.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <p className="font-medium text-gray-900">{property.name}</p>
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-600">
                                {property.address}
                              </td>
                              <td className="py-4 px-4 font-medium text-gray-900">
                                ${property.monthly_rent?.toLocaleString() || '0'}
                              </td>
                              <td className="py-4 px-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {rentCadence}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-medium text-green-600">
                                ${normalizedRent.toLocaleString()}
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500">
                            No properties found. Properties count: {properties.length}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Calculation Formula</h3>
                <p className="text-sm text-gray-600">
                  Total Potential Income = Monthly Potential Income × Number of Months in Range
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Monthly Potential Income = Sum of all property monthly equivalent rents
                </p>
              </div>

              {/* Debug Info */}
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Debug Information</h3>
                <p className="text-sm text-gray-600">Properties loaded: {properties.length}</p>
                <p className="text-sm text-gray-600">Monthly Potential Income: ${monthlyPotentialIncome.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Months in Range: {monthsInRange}</p>
                <p className="text-sm text-gray-600">Modal State: {showPotentialIncomeDetails ? 'OPEN' : 'CLOSED'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 