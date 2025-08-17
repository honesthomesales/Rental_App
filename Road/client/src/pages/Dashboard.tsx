import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  BarChart3, 
  Users, 
  Clock, 
  DollarSign, 
  ShoppingCart,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { scheduleApi, performanceApi, formatCurrency, formatNumber } from '../services/api';
import { ScheduleSummary, PerformanceSummary } from '../types';

const Dashboard: React.FC = () => {
  const [scheduleSummary, setScheduleSummary] = useState<ScheduleSummary | null>(null);
  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [scheduleData, performanceData] = await Promise.all([
          scheduleApi.getSummary(),
          performanceApi.getSummary()
        ]);

        setScheduleSummary(scheduleData.data);
        setPerformanceSummary(performanceData.data);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your retail store operations</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Sales"
          value={performanceSummary ? formatCurrency(performanceSummary.totalSales) : '$0'}
          icon={DollarSign}
          trend="up"
          change={12}
          changeLabel="vs last month"
        />
        <MetricCard
          title="Total Transactions"
          value={performanceSummary ? formatNumber(performanceSummary.totalTransactions) : '0'}
          icon={ShoppingCart}
          trend="up"
          change={8}
          changeLabel="vs last month"
        />
        <MetricCard
          title="Total Customers"
          value={performanceSummary ? formatNumber(performanceSummary.totalCustomers) : '0'}
          icon={Users}
          trend="up"
          change={15}
          changeLabel="vs last month"
        />
        <MetricCard
          title="Active Employees"
          value={scheduleSummary ? scheduleSummary.totalEmployees.toString() : '0'}
          icon={Clock}
          trend="neutral"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/schedule" className="group">
          <div className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  View Schedule
                </h3>
                <p className="text-gray-600 mt-1">
                  Check employee schedules and shifts
                </p>
                {scheduleSummary && (
                  <p className="text-sm text-gray-500 mt-2">
                    {scheduleSummary.totalShifts} shifts scheduled
                  </p>
                )}
              </div>
              <Calendar className="h-8 w-8 text-primary-600 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </Link>

        <Link to="/performance" className="group">
          <div className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  View Performance
                </h3>
                <p className="text-gray-600 mt-1">
                  Monitor sales and performance metrics
                </p>
                {performanceSummary && (
                  <p className="text-sm text-gray-500 mt-2">
                    {performanceSummary.daysCount} days of data
                  </p>
                )}
              </div>
              <BarChart3 className="h-8 w-8 text-primary-600 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </Link>
      </div>

      {/* Performance Overview */}
      {performanceSummary && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Performance Overview</h3>
            <TrendingUp className="h-5 w-5 text-primary-600" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(performanceSummary.avgDailySales)}
              </p>
              <p className="text-sm text-gray-600">Average Daily Sales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {performanceSummary.avgDailyTransactions.toFixed(0)}
              </p>
              <p className="text-sm text-gray-600">Average Daily Transactions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {performanceSummary.avgDailyCustomers.toFixed(0)}
              </p>
              <p className="text-sm text-gray-600">Average Daily Customers</p>
            </div>
          </div>
        </div>
      )}

      {/* Employee Summary */}
      {scheduleSummary && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Employee Summary</h3>
            <Users className="h-5 w-5 text-primary-600" />
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{scheduleSummary.totalEmployees}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Shifts</p>
                <p className="text-2xl font-bold text-gray-900">{scheduleSummary.totalShifts}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Top Employees by Hours</h4>
              <div className="space-y-2">
                {Object.entries(scheduleSummary.employeeSummary)
                  .sort(([, a], [, b]) => b.totalHours - a.totalHours)
                  .slice(0, 5)
                  .map(([name, data]) => (
                    <div key={name} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{name}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {data.totalHours.toFixed(1)} hours
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 