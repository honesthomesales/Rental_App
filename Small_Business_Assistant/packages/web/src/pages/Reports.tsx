import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Clock,
  Download,
  Filter,
  RefreshCw,
  PieChart,
  Activity,
  Target,
  Award
} from 'lucide-react';
import { Job, JobStatus } from '../../../shared/types';
import { apiService } from '../services/apiService';

interface ReportData {
  jobs: Job[];
  totalRevenue: number;
  totalJobs: number;
  averageJobValue: number;
  completionRate: number;
  averageJobDuration: number;
  topCustomers: Array<{
    id: string;
    name: string;
    totalSpent: number;
    jobCount: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    jobs: number;
  }>;
  jobStatusDistribution: Array<{
    status: JobStatus;
    count: number;
    percentage: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'job_created' | 'job_completed' | 'payment_received';
    description: string;
    timestamp: string;
    amount?: number;
  }>;
}

interface ReportFilters {
  dateRange: 'week' | 'month' | 'quarter' | 'year';
  startDate?: string;
  endDate?: string;
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: 'month'
  });
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadReportData();
  }, [filters]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      // In a real app, this would be a dedicated reports endpoint
      const [jobsResponse, customersResponse] = await Promise.all([
        apiService.get('/jobs'),
        apiService.get('/customers')
      ]);

      const jobs = jobsResponse.data;
      const customers = customersResponse.data;

      // Calculate report data
      const totalRevenue = jobs.reduce((sum: number, job: Job) => sum + (job.amount || 0), 0);
      const totalJobs = jobs.length;
      const averageJobValue = totalJobs > 0 ? totalRevenue / totalJobs : 0;
      const completedJobs = jobs.filter((job: Job) => job.status === 'completed').length;
      const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

      // Calculate average job duration (mock data for now)
      const averageJobDuration = 3.5; // days

      // Top customers
      const topCustomers = customers
        .sort((a: any, b: any) => (b.totalSpent || 0) - (a.totalSpent || 0))
        .slice(0, 5)
        .map((customer: any) => ({
          id: customer.id,
          name: customer.name,
          totalSpent: customer.totalSpent || 0,
          jobCount: customer.totalJobs || 0
        }));

      // Monthly revenue (mock data for now)
      const monthlyRevenue = [
        { month: 'Jan', revenue: 8500, jobs: 12 },
        { month: 'Feb', revenue: 9200, jobs: 15 },
        { month: 'Mar', revenue: 7800, jobs: 11 },
        { month: 'Apr', revenue: 10500, jobs: 18 },
        { month: 'May', revenue: 9800, jobs: 16 },
        { month: 'Jun', revenue: 11200, jobs: 19 }
      ];

      // Job status distribution
      const statusCounts = jobs.reduce((acc: any, job: Job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {});

      const jobStatusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status: status as JobStatus,
        count: count as number,
        percentage: totalJobs > 0 ? ((count as number) / totalJobs) * 100 : 0
      }));

      // Recent activity (mock data for now)
      const recentActivity = [
        {
          id: '1',
          type: 'job_completed' as const,
          description: 'Kitchen renovation completed for John Smith',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          amount: 2500
        },
        {
          id: '2',
          type: 'payment_received' as const,
          description: 'Payment received for bathroom remodel',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          amount: 1800
        },
        {
          id: '3',
          type: 'job_created' as const,
          description: 'New job created: Deck installation',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ];

      setReportData({
        jobs,
        totalRevenue,
        totalJobs,
        averageJobValue,
        completionRate,
        averageJobDuration,
        topCustomers,
        monthlyRevenue,
        jobStatusDistribution,
        recentActivity
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'job_created':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'job_completed':
        return <Award className="w-4 h-4 text-green-600" />;
      case 'payment_received':
        return <DollarSign className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, change, icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change)}% from last period
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No report data available</h3>
        <p className="text-gray-500">Try adjusting your filters or check back later.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Track your business performance and insights</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadReportData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(reportData.totalRevenue)}
          change={12.5}
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          color="bg-green-100"
        />
        <StatCard
          title="Total Jobs"
          value={reportData.totalJobs}
          change={8.2}
          icon={<Calendar className="w-6 h-6 text-blue-600" />}
          color="bg-blue-100"
        />
        <StatCard
          title="Average Job Value"
          value={formatCurrency(reportData.averageJobValue)}
          change={-2.1}
          icon={<Target className="w-6 h-6 text-purple-600" />}
          color="bg-purple-100"
        />
        <StatCard
          title="Completion Rate"
          value={`${reportData.completionRate.toFixed(1)}%`}
          change={5.3}
          icon={<Award className="w-6 h-6 text-yellow-600" />}
          color="bg-yellow-100"
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Revenue</h3>
          <div className="space-y-3">
            {reportData.monthlyRevenue.map((month) => (
              <div key={month.month} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{month.month}</span>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(month.revenue / Math.max(...reportData.monthlyRevenue.map(m => m.revenue))) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-16 text-right">
                    {formatCurrency(month.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Job Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Job Status Distribution</h3>
          <div className="space-y-3">
            {reportData.jobStatusDistribution.map((status) => (
              <div key={status.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.status)}`}>
                    {status.status}
                  </div>
                  <span className="text-sm text-gray-700">{status.count} jobs</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {status.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Customers and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Customers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Customers</h3>
          <div className="space-y-4">
            {reportData.topCustomers.map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.jobCount} jobs</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(customer.totalSpent)}
                  </p>
                  <p className="text-xs text-gray-500">#{index + 1}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {reportData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                    {activity.amount && (
                      <span className="text-xs font-medium text-green-600">
                        {formatCurrency(activity.amount)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports; 