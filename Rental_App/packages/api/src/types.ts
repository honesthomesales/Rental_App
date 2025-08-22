// Basic types for the API
export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: string;
  status: string;
  monthly_rent: number | null;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  year_built?: number;
  purchase_price?: number;
  purchase_payment?: number;
  purchase_date?: string;
  current_value?: number;
  is_for_rent?: boolean;
  is_for_sale?: boolean;
  insurance_premium?: number;
  property_tax?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  tenants?: Tenant[];
  active_leases?: Lease[];
  active_lease_count?: number;
}

export interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  property_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  payment_date: string;
  amount: number;
  property_id: string;
  tenant_id: string;
  created_at: string;
}

export interface Lease {
  id: string;
  tenant_id: string;
  property_id: string;
  rent: number;
  rent_cadence: string;
  lease_start_date: string;
  lease_end_date: string;
  status: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  transaction_date: string;
  amount: number;
  transaction_type: string;
  property_id: string;
  tenant_id: string;
  created_at: string;
}

export interface RentPeriod {
  id: string;
  tenant_id: string;
  property_id: string;
  period_due_date: string;
  rent_amount: number;
  status: string;
  created_at: string;
}

export interface OtherEntry {
  id: string;
  date: string;
  amount: number;
  description: string;
  created_at: string;
}

// Additional types needed by services
export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePropertyData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: string;
  status: string;
  monthly_rent?: number;
}

export interface UpdatePropertyData {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  property_type?: string;
  status?: string;
  monthly_rent?: number;
}

export interface CreateTenantData {
  first_name: string;
  last_name: string;
  property_id: string;
  is_active?: boolean;
}

export interface UpdateTenantData {
  first_name?: string;
  last_name?: string;
  property_id?: string;
  is_active?: boolean;
}

export interface CreateTransactionData {
  transaction_date: string;
  amount: number;
  transaction_type: string;
  property_id: string;
  tenant_id: string;
}

export interface UpdateTransactionData {
  transaction_date?: string;
  amount?: number;
  transaction_type?: string;
  property_id?: string;
  tenant_id?: string;
}

export interface LateTenant {
  id: string;
  first_name: string;
  last_name: string;
  property_id: string;
  days_late: number;
  amount_overdue: number;
} 