import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { performanceApi, formatCurrency, formatNumber, formatDate } from '../services/api';
import { PerformanceEntry } from '../types';

const Performance: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    fetchPerformanceData();
  }, [view]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      switch (view) {
        case 'today':
          response = await performanceApi.getToday();
          break;
        case 'week':
          response = await performanceApi.getWeek();
          break;
        case 'month':
          response = await performanceApi.getMonth();
          break;
        default:
          response = await performanceApi.getAll();
      }

      setPerformanceData(response.data);
    } catch (err: any) {
      console.error('Error fetching performance data:', err);
      setError('Failed to load performance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSalesValue = (entry: PerformanceEntry) => {
    return parseFloat(entry.Sales || entry.sales || entry.SALES || '0');
  };

  const getTransactionsValue = (entry: PerformanceEntry) => {
    return parseInt(entry.Transactions || entry.transactions || entry.TRANSACTIONS || '0');
  };

  const getCustomersValue = (entry: PerformanceEntry) => {
    return parseInt(entry.Customers || entry.customers || entry.CUSTOMERS || '0');
  };

  const calculateTotals = () => {
    return performanceData.reduce(
      (acc, entry) => ({
        sales: acc.sales + getSalesValue(entry),
        transactions: acc.transactions + getTransactionsValue(entry),
        customers: acc.customers + getCustomersValue(entry),
      }),
      { sales: 0, transactions: 0, customers: 0 }
    );
  };

  const calculateAverages = () => {
    if (performanceData.length === 0) return { sales: 0, transactions: 0, customers: 0 };
    
    const totals = calculateTotals();
    return {
      sales: totals.sales / performanceData.length,
      transactions: totals.transactions / performanceData.length,
      customers: totals.customers / performanceData.length,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-danger-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Performance Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchPerformanceData}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();
  const averages = calculateAverages();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Metrics</h1>
          <p className="text-gray-600">Monitor sales and performance data</p>
        </div>
        <BarChart3 className="h-8 w-8 text-primary-600" />
      </div>

      {/* View Toggle */}
      <div className="flex space-x-2">
        <button
          onClick={() => setView('all')}
          className={`btn ${view === 'all' ? 'btn-primary' : 'btn-secondary'}`}
        >
          All Data
        </button>
        <button
          onClick={() => setView('today')}
          className={`btn ${view === 'today' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Today
        </button>
        <button
          onClick={() => setView('week')}
          className={`btn ${view === 'week' ? 'btn-primary' : 'btn-secondary'}`}
        >
          This Week
        </button>
        <button
          onClick={() => setView('month')}
          className={`btn ${view === 'month' ? 'btn-primary' : 'btn-secondary'}`}
        >
          This Month
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totals.sales)}
              </p>
              <p className="text-sm text-gray-500">
                Avg: {formatCurrency(averages.sales)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-success-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(totals.transactions)}
              </p>
              <p className="text-sm text-gray-500">
                Avg: {averages.transactions.toFixed(0)}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(totals.customers)}
              </p>
              <p className="text-sm text-gray-500">
                Avg: {averages.customers.toFixed(0)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-warning-600" />
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Performance Details</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BarChart3 className="h-4 w-4" />
            {performanceData.length} records
          </div>
        </div>

        {performanceData.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data</h3>
            <p className="text-gray-600">
              {view === 'today' 
                ? 'No performance data for today.'
                : view === 'week'
                ? 'No performance data for this week.'
                : view === 'month'
                ? 'No performance data for this month.'
                : 'No performance data available.'
              }
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Date</th>
                  <th className="table-header-cell">Sales</th>
                  <th className="table-header-cell">Transactions</th>
                  <th className="table-header-cell">Customers</th>
                  <th className="table-header-cell">Avg Transaction</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {performanceData.map((entry, index) => {
                  const sales = getSalesValue(entry);
                  const transactions = getTransactionsValue(entry);
                  const customers = getCustomersValue(entry);
                  const avgTransaction = transactions > 0 ? sales / transactions : 0;

                  return (
                    <tr key={index} className="table-row">
                      <td className="table-cell font-medium">
                        {formatDate(entry.Date || entry.date || entry.DATE || '')}
                      </td>
                      <td className="table-cell">
                        <span className="font-semibold text-success-600">
                          {formatCurrency(sales)}
                        </span>
                      </td>
                      <td className="table-cell">
                        {formatNumber(transactions)}
                      </td>
                      <td className="table-cell">
                        {formatNumber(customers)}
                      </td>
                      <td className="table-cell">
                        {formatCurrency(avgTransaction)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Performance Insights */}
      {performanceData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Performance Insights</h3>
            <TrendingUp className="h-5 w-5 text-primary-600" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Best Performing Day</h4>
              {(() => {
                const bestDay = performanceData.reduce((best, current) => {
                  const currentSales = getSalesValue(current);
                  const bestSales = getSalesValue(best);
                  return currentSales > bestSales ? current : best;
                });
                
                return (
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(bestDay.Date || bestDay.date || bestDay.DATE || '')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Sales: {formatCurrency(getSalesValue(bestDay))}
                    </p>
                    <p className="text-sm text-gray-600">
                      Transactions: {getTransactionsValue(bestDay)}
                    </p>
                  </div>
                );
              })()}
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Conversion Rate</h4>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-900">
                  {totals.transactions > 0 
                    ? ((totals.transactions / totals.customers) * 100).toFixed(1)
                    : '0'
                  }%
                </p>
                <p className="text-sm text-gray-600">
                  {formatNumber(totals.transactions)} transactions from {formatNumber(totals.customers)} customers
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Performance; 