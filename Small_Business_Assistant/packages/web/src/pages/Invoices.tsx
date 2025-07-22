import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Download,
  Mail,
  Eye,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Receipt
} from 'lucide-react';
import { Invoice, Job } from '../../../shared/types';
import { apiService } from '../services/apiService';

interface InvoiceFilters {
  search: string;
  status: 'all' | 'draft' | 'sent' | 'paid' | 'overdue';
  dateRange: 'all' | 'week' | 'month' | 'quarter' | 'year';
}

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<InvoiceFilters>({
    search: '',
    status: 'all',
    dateRange: 'all'
  });
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesResponse, jobsResponse] = await Promise.all([
        apiService.get('/invoices'),
        apiService.get('/jobs')
      ]);
      setInvoices(invoicesResponse.data);
      setJobs(jobsResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof InvoiceFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleBulkAction = async (action: 'delete' | 'mark-paid' | 'send') => {
    if (selectedInvoices.length === 0) return;

    try {
      if (action === 'delete') {
        if (window.confirm(`Are you sure you want to delete ${selectedInvoices.length} invoice(s)?`)) {
          await Promise.all(
            selectedInvoices.map(id => apiService.delete(`/invoices/${id}`))
          );
        }
      } else if (action === 'mark-paid') {
        await Promise.all(
          selectedInvoices.map(id => apiService.patch(`/invoices/${id}`, { status: 'paid' }))
        );
      } else if (action === 'send') {
        await Promise.all(
          selectedInvoices.map(id => apiService.post(`/invoices/${id}/send`))
        );
      }
      setSelectedInvoices([]);
      loadData();
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
    }
  };

  const deleteInvoice = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await apiService.delete(`/invoices/${id}`);
        loadData();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const sendInvoice = async (id: string) => {
    try {
      await apiService.post(`/invoices/${id}/send`);
      loadData();
    } catch (error) {
      console.error('Error sending invoice:', error);
    }
  };

  const markAsPaid = async (id: string) => {
    try {
      await apiService.patch(`/invoices/${id}`, { status: 'paid' });
      loadData();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(filters.search.toLowerCase()) ||
      invoice.jobTitle.toLowerCase().includes(filters.search.toLowerCase());

    const matchesStatus = filters.status === 'all' || invoice.status === filters.status;

    return matchesSearch && matchesStatus;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'sent': return <Mail className="w-4 h-4" />;
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const isOverdue = (invoice: Invoice) => {
    if (invoice.status === 'paid') return false;
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    return dueDate < today;
  };

  const InvoiceRow: React.FC<{ invoice: Invoice }> = ({ invoice }) => {
    const overdue = isOverdue(invoice);
    
    return (
      <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50">
        <td className="px-6 py-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedInvoices.includes(invoice.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedInvoices(prev => [...prev, invoice.id]);
                } else {
                  setSelectedInvoices(prev => prev.filter(id => id !== invoice.id));
                }
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </td>
        <td className="px-6 py-4">
          <div>
            <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
            <div className="text-sm text-gray-500">{invoice.jobTitle}</div>
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">
          {invoice.customerName}
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">
          {formatCurrency(invoice.amount)}
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">
          {formatDate(invoice.issueDate)}
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">
          {formatDate(invoice.dueDate)}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
              {getStatusIcon(invoice.status)}
              <span className="ml-1">{invoice.status}</span>
            </span>
            {overdue && (
              <span className="ml-2 text-xs text-red-600 font-medium">OVERDUE</span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 text-right text-sm font-medium">
          <div className="flex items-center justify-end space-x-2">
            <Link
              to={`/invoices/${invoice.id}`}
              className="text-blue-600 hover:text-blue-900 p-1"
              title="View Invoice"
            >
              <Eye className="w-4 h-4" />
            </Link>
            <button
              onClick={() => window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')}
              className="text-gray-600 hover:text-gray-900 p-1"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>
            {invoice.status === 'draft' && (
              <button
                onClick={() => sendInvoice(invoice.id)}
                className="text-blue-600 hover:text-blue-900 p-1"
                title="Send Invoice"
              >
                <Mail className="w-4 h-4" />
              </button>
            )}
            {invoice.status === 'sent' && (
              <button
                onClick={() => markAsPaid(invoice.id)}
                className="text-green-600 hover:text-green-900 p-1"
                title="Mark as Paid"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
            <Link
              to={`/invoices/${invoice.id}/edit`}
              className="text-gray-600 hover:text-gray-900 p-1"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={() => deleteInvoice(invoice.id)}
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

  const getStats = () => {
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    const overdueInvoices = invoices.filter(inv => isOverdue(inv)).length;
    const paidAmount = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    return {
      totalInvoices,
      totalAmount,
      paidInvoices,
      overdueInvoices,
      paidAmount,
      outstandingAmount: totalAmount - paidAmount
    };
  };

  const stats = getStats();

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
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-600">Manage and track your customer invoices</p>
          </div>
          <Link
            to="/invoices/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInvoices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{stats.paidInvoices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overdueInvoices}</p>
            </div>
          </div>
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
                placeholder="Search invoices..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedInvoices.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedInvoices.length} selected
              </span>
              <button
                onClick={() => handleBulkAction('send')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Mail className="w-4 h-4 mr-1" />
                Send
              </button>
              <button
                onClick={() => handleBulkAction('mark-paid')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Mark Paid
              </button>
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

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedInvoices(invoices.map(inv => inv.id));
                      } else {
                        setSelectedInvoices([]);
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map(invoice => (
                <InvoiceRow key={invoice.id} invoice={invoice} />
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Receipt className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-500 mb-4">
              {filters.search || filters.status !== 'all' ? 'Try adjusting your filters.' : 'Get started by creating your first invoice.'}
            </p>
            {!filters.search && filters.status === 'all' && (
              <Link
                to="/invoices/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices; 