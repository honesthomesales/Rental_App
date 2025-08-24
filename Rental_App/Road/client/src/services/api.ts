import axios from 'axios';
import { 
  ApiResponse, 
  ScheduleEntry, 
  ScheduleSummary, 
  PerformanceEntry, 
  PerformanceSummary,
  MetricData 
} from '../types';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Schedule API functions
export const scheduleApi = {
  // Get all schedule data
  getAll: async (): Promise<ApiResponse<ScheduleEntry[]>> => {
    const response = await api.get('/schedule');
    return response.data;
  },

  // Get today's schedule
  getToday: async (): Promise<ApiResponse<ScheduleEntry[]>> => {
    const response = await api.get('/schedule/today');
    return response.data;
  },

  // Get this week's schedule
  getWeek: async (): Promise<ApiResponse<ScheduleEntry[]>> => {
    const response = await api.get('/schedule/week');
    return response.data;
  },

  // Get schedule for specific employee
  getByEmployee: async (name: string): Promise<ApiResponse<ScheduleEntry[]>> => {
    const response = await api.get(`/schedule/employee/${encodeURIComponent(name)}`);
    return response.data;
  },

  // Get schedule summary
  getSummary: async (): Promise<ApiResponse<ScheduleSummary>> => {
    const response = await api.get('/schedule/summary');
    return response.data;
  },
};

// Performance API functions
export const performanceApi = {
  // Get all performance data
  getAll: async (): Promise<ApiResponse<PerformanceEntry[]>> => {
    const response = await api.get('/performance');
    return response.data;
  },

  // Get today's performance
  getToday: async (): Promise<ApiResponse<PerformanceEntry[]>> => {
    const response = await api.get('/performance/today');
    return response.data;
  },

  // Get this week's performance
  getWeek: async (): Promise<ApiResponse<PerformanceEntry[]>> => {
    const response = await api.get('/performance/week');
    return response.data;
  },

  // Get this month's performance
  getMonth: async (): Promise<ApiResponse<PerformanceEntry[]>> => {
    const response = await api.get('/performance/month');
    return response.data;
  },

  // Get performance summary
  getSummary: async (): Promise<ApiResponse<PerformanceSummary>> => {
    const response = await api.get('/performance/summary');
    return response.data;
  },

  // Get specific metric data
  getMetric: async (metric: string): Promise<ApiResponse<MetricData[]>> => {
    const response = await api.get(`/performance/metrics?metric=${encodeURIComponent(metric)}`);
    return response.data;
  },
};

// Health check
export const healthApi = {
  check: async (): Promise<{ status: string; timestamp: string; environment: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Utility function to handle API errors
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Utility function to format currency
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

// Utility function to format numbers
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

// Utility function to format dates
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Utility function to format time
export const formatTime = (timeString: string): string => {
  if (!timeString) return '';
  
  // Handle various time formats
  const time = timeString.includes('T') 
    ? new Date(timeString) 
    : new Date(`2000-01-01T${timeString}`);
    
  return time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export default api; 