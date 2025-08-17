// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  timestamp: string;
  error?: string;
  message?: string;
}

// Schedule Types
export interface ScheduleEntry {
  Date?: string;
  date?: string;
  DATE?: string;
  Employee?: string;
  Name?: string;
  EMPLOYEE?: string;
  NAME?: string;
  Shift?: string;
  shift?: string;
  SHIFT?: string;
  Start?: string;
  start?: string;
  START?: string;
  End?: string;
  end?: string;
  END?: string;
  Hours?: string;
  hours?: string;
  HOURS?: string;
  Position?: string;
  position?: string;
  POSITION?: string;
  [key: string]: any; // Allow for additional fields
}

export interface ScheduleSummary {
  totalShifts: number;
  totalEmployees: number;
  employeeSummary: Record<string, {
    totalShifts: number;
    totalHours: number;
    shifts: ScheduleEntry[];
  }>;
  timestamp: string;
}

// Performance Types
export interface PerformanceEntry {
  Date?: string;
  date?: string;
  DATE?: string;
  Sales?: string;
  sales?: string;
  SALES?: string;
  Transactions?: string;
  transactions?: string;
  TRANSACTIONS?: string;
  Customers?: string;
  customers?: string;
  CUSTOMERS?: string;
  Revenue?: string;
  revenue?: string;
  REVENUE?: string;
  [key: string]: any; // Allow for additional fields
}

export interface PerformanceSummary {
  totalSales: number;
  totalTransactions: number;
  totalCustomers: number;
  avgDailySales: number;
  avgDailyTransactions: number;
  avgDailyCustomers: number;
  daysCount: number;
  dailyData: Record<string, {
    sales: number;
    transactions: number;
    customers: number;
  }>;
  timestamp: string;
}

export interface MetricData {
  date: string;
  value: number;
}

// Navigation Types
export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
}

// Chart Types
export interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
}

export interface ChartConfig {
  data: ChartDataPoint[];
  title: string;
  color?: string;
  height?: number;
}

// Component Props
export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
}

export interface DataTableProps<T> {
  data: T[];
  columns: {
    key: string;
    label: string;
    render?: (value: any, row: T) => React.ReactNode;
  }[];
  title?: string;
  loading?: boolean;
  error?: string;
}

export interface LoadingState {
  loading: boolean;
  error: string | null;
} 