import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarDays, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign,
  TrendingUp,
  Users,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { Job, JobStatus } from '../../../shared/types';
import { apiService } from '../services/apiService';

interface DashboardStats {
  totalJobs: number;
  pendingJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  totalRevenue: number;
  averageJobValue: number;
  thisWeekJobs: number;
  thisMonthRevenue: number;
}

interface RecentJob extends Job {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeframe]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, jobsResponse] = await Promise.all([
        apiService.get('/jobs/stats'),
        apiService.get('/jobs?limit=5&sort=createdAt&order=desc'),
      ]);
      
      setStats(statsResponse.data);
      setRecentJobs(jobsResponse.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <AlertTriangle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: string;
    changeType?: 'positive' | 'negative';
  }> = ({ title, value, icon, change, changeType }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${
              changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );

  const JobCard: React.FC<{ job: RecentJob }> = ({ job }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
              {getStatusIcon(job.status)}
              {job.status.replace('_', ' ')}
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{job.customerName}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{job.address}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              <span>{formatDate(job.scheduledDate)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>{formatCurrency(job.estimatedCost)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 ml-4">
          <Link
            to={`/jobs/${job.id}`}
            className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View Details
          </Link>
          
          <div className="flex gap-1">
            {job.customerPhone && (
              <a
                href={`tel:${job.customerPhone}`}
                className="inline-flex items-center justify-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Call customer"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
            
            {job.customerEmail && (
              <a
                href={`mailto:${job.customerEmail}`}
                className="inline-flex items-center justify-center p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Email customer"
              >
                <Mail className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Overview of your business operations
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['week', 'month', 'year'] as const).map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      selectedTimeframe === timeframe
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                  </button>
                ))}
              </div>
              
              <Link
                to="/jobs/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create New Job
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Jobs"
            value={stats?.totalJobs || 0}
            icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
            change="+12% from last month"
            changeType="positive"
          />
          
          <StatCard
            title="Pending Jobs"
            value={stats?.pendingJobs || 0}
            icon={<Clock className="w-6 h-6 text-yellow-600" />}
          />
          
          <StatCard
            title="In Progress"
            value={stats?.inProgressJobs || 0}
            icon={<AlertTriangle className="w-6 h-6 text-blue-600" />}
          />
          
          <StatCard
            title="Completed This Week"
            value={stats?.thisWeekJobs || 0}
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          />
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Revenue</span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">This Month</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatCurrency(stats?.thisMonthRevenue || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Job Value</span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatCurrency(stats?.averageJobValue || 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/jobs"
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-900">View All Jobs</span>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
              
              <Link
                to="/jobs/new"
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-medium text-gray-900">Create New Job</span>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
              
              <Link
                to="/reports"
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-medium text-gray-900">View Reports</span>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Jobs</h3>
              <Link
                to="/jobs"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View all jobs →
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {recentJobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <CheckCircle className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first job.
                </p>
                <div className="mt-6">
                  <Link
                    to="/jobs/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Create New Job
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 