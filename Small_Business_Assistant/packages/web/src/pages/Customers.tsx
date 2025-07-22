import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  Edit,
  Trash2,
  Eye,
  Users
} from 'lucide-react';
import { Customer } from '../../../shared/types';
import { apiService } from '../services/apiService';

interface CustomerFilters {
  search: string;
  sortBy: 'name' | 'email' | 'createdAt' | 'totalJobs' | 'totalSpent';
  sortOrder: 'asc' | 'desc';
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadCustomers();
  }, [filters]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof CustomerFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleSort = (field: CustomerFilters['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleBulkAction = async (action: 'delete') => {
    if (selectedCustomers.length === 0) return;

    if (action === 'delete') {
      if (window.confirm(`Are you sure you want to delete ${selectedCustomers.length} customer(s)?`)) {
        try {
          await Promise.all(
            selectedCustomers.map(id => apiService.delete(`/customers/${id}`))
          );
          setSelectedCustomers([]);
          loadCustomers();
        } catch (error) {
          console.error('Error deleting customers:', error);
        }
      }
    }
  };

  const deleteCustomer = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await apiService.delete(`/customers/${id}`);
        loadCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
    customer.email.toLowerCase().includes(filters.search.toLowerCase()) ||
    customer.phone?.includes(filters.search) ||
    customer.address?.toLowerCase().includes(filters.search.toLowerCase())
  );

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let aValue: any = a[filters.sortBy];
    let bValue: any = b[filters.sortBy];

    if (filters.sortBy === 'totalJobs' || filters.sortBy === 'totalSpent') {
      aValue = aValue || 0;
      bValue = bValue || 0;
    } else {
      aValue = aValue || '';
      bValue = bValue || '';
    }

    if (filters.sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getCustomerRating = (customer: Customer) => {
    // Mock rating based on total jobs and spending
    const jobs = customer.totalJobs || 0;
    const spent = customer.totalSpent || 0;
    
    if (jobs >= 10 && spent >= 5000) return 5;
    if (jobs >= 5 && spent >= 2000) return 4;
    if (jobs >= 2 && spent >= 500) return 3;
    if (jobs >= 1) return 2;
    return 1;
  };

  const SortButton: React.FC<{
    field: CustomerFilters['sortBy'];
    children: React.ReactNode;
  }> = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
    >
      <span>{children}</span>
      {filters.sortBy === field && (
        <span className="text-blue-600">
          {filters.sortOrder === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </button>
  );

  const CustomerRow: React.FC<{ customer: Customer }> = ({ customer }) => {
    const rating = getCustomerRating(customer);
    
    return (
      <tr key={customer.id} className="border-b border-gray-200 hover:bg-gray-50">
        <td className="px-6 py-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedCustomers.includes(customer.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedCustomers(prev => [...prev, customer.id]);
                } else {
                  setSelectedCustomers(prev => prev.filter(id => id !== customer.id));
                }
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">
                {customer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{customer.name}</div>
              <div className="text-sm text-gray-500">{customer.email}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">
          {customer.phone || 'N/A'}
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">
          {customer.address || 'N/A'}
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">
          {customer.totalJobs || 0}
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">
          {formatCurrency(customer.totalSpent || 0)}
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">
          {formatDate(customer.createdAt)}
        </td>
        <td className="px-6 py-4 text-right text-sm font-medium">
          <div className="flex items-center justify-end space-x-2">
            <Link
              to={`/customers/${customer.id}`}
              className="text-blue-600 hover:text-blue-900 p-1"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </Link>
            <Link
              to={`/customers/${customer.id}/edit`}
              className="text-gray-600 hover:text-gray-900 p-1"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={() => deleteCustomer(customer.id)}
              className="text-red-600 hover:text-red-900 p-1"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600">Manage your customer relationships and information</p>
          </div>
          <Link
            to="/customers/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search customers..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedCustomers.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedCustomers.length} selected
              </span>
              <button
                onClick={() => handleBulkAction('delete')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.length === customers.length && customers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCustomers(customers.map(c => c.id));
                      } else {
                        setSelectedCustomers([]);
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton field="name">Customer</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton field="totalJobs">Jobs</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton field="totalSpent">Total Spent</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <SortButton field="createdAt">Joined</SortButton>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCustomers.map(customer => (
                <CustomerRow key={customer.id} customer={customer} />
              ))}
            </tbody>
          </table>
        </div>

        {sortedCustomers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Users className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-500 mb-4">
              {filters.search ? 'Try adjusting your search criteria.' : 'Get started by adding your first customer.'}
            </p>
            {!filters.search && (
              <Link
                to="/customers/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers.filter(c => {
                  const lastMonth = new Date();
                  lastMonth.setMonth(lastMonth.getMonth() - 1);
                  return new Date(c.createdAt) >= lastMonth;
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Top Rated</p>
              <p className="text-2xl font-bold text-gray-900">
                {customers.filter(c => getCustomerRating(c) >= 4).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers; 