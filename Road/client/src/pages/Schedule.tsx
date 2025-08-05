import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, AlertCircle } from 'lucide-react';
import { scheduleApi, formatDate, formatTime } from '../services/api';
import { ScheduleEntry } from '../types';

const Schedule: React.FC = () => {
  const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'all' | 'today' | 'week'>('all');

  useEffect(() => {
    fetchScheduleData();
  }, [view]);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      switch (view) {
        case 'today':
          response = await scheduleApi.getToday();
          break;
        case 'week':
          response = await scheduleApi.getWeek();
          break;
        default:
          response = await scheduleApi.getAll();
      }

      setScheduleData(response.data);
    } catch (err: any) {
      console.error('Error fetching schedule data:', err);
      setError('Failed to load schedule data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (entry: ScheduleEntry) => {
    return entry.Employee || entry.Name || entry.EMPLOYEE || entry.NAME || 'Unknown';
  };

  const getShiftTime = (entry: ScheduleEntry) => {
    const start = entry.Start || entry.start || entry.START;
    const end = entry.End || entry.end || entry.END;
    
    if (start && end) {
      return `${formatTime(start)} - ${formatTime(end)}`;
    }
    return entry.Shift || entry.shift || entry.SHIFT || 'N/A';
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Schedule</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchScheduleData}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Schedule</h1>
          <p className="text-gray-600">View and manage employee schedules</p>
        </div>
        <Calendar className="h-8 w-8 text-primary-600" />
      </div>

      {/* View Toggle */}
      <div className="flex space-x-2">
        <button
          onClick={() => setView('all')}
          className={`btn ${view === 'all' ? 'btn-primary' : 'btn-secondary'}`}
        >
          All Schedules
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
      </div>

      {/* Schedule Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Schedule Details</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            {scheduleData.length} shifts
          </div>
        </div>

        {scheduleData.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedule Data</h3>
            <p className="text-gray-600">
              {view === 'today' 
                ? 'No shifts scheduled for today.'
                : view === 'week'
                ? 'No shifts scheduled for this week.'
                : 'No schedule data available.'
              }
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Date</th>
                  <th className="table-header-cell">Employee</th>
                  <th className="table-header-cell">Shift</th>
                  <th className="table-header-cell">Time</th>
                  <th className="table-header-cell">Hours</th>
                  <th className="table-header-cell">Position</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {scheduleData.map((entry, index) => (
                  <tr key={index} className="table-row">
                    <td className="table-cell">
                      {formatDate(entry.Date || entry.date || entry.DATE || '')}
                    </td>
                    <td className="table-cell font-medium">
                      {getEmployeeName(entry)}
                    </td>
                    <td className="table-cell">
                      <span className="badge-info">
                        {entry.Shift || entry.shift || entry.SHIFT || 'N/A'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {getShiftTime(entry)}
                      </div>
                    </td>
                    <td className="table-cell">
                      {entry.Hours || entry.hours || entry.HOURS || 'N/A'} hrs
                    </td>
                    <td className="table-cell">
                      {entry.Position || entry.position || entry.POSITION || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {scheduleData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Shifts</p>
                <p className="text-2xl font-bold text-gray-900">{scheduleData.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Employees</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(scheduleData.map(getEmployeeName)).size}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {scheduleData.reduce((total, entry) => {
                    const hours = parseFloat(entry.Hours || entry.hours || entry.HOURS || '0');
                    return total + hours;
                  }, 0).toFixed(1)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule; 