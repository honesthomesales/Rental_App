import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {user?.firstName || 'User'}!
            </h1>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900">Active Jobs</h3>
              <p className="text-3xl font-bold text-blue-600">0</p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900">Completed Today</h3>
              <p className="text-3xl font-bold text-green-600">0</p>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900">Total Revenue</h3>
              <p className="text-3xl font-bold text-purple-600">$0</p>
            </div>
          </div>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => navigate('/jobs/create')}
                className="bg-indigo-600 text-white p-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create New Job
              </button>
              <button 
                onClick={() => navigate('/jobs')}
                className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                View Jobs
              </button>
              <button className="bg-yellow-600 text-white p-4 rounded-lg hover:bg-yellow-700 transition-colors">
                Create Quote
              </button>
              <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors">
                View Invoices
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 