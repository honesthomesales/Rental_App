// Basic types for the API
export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: 'house' | 'singlewide' | 'doublewide';
  status: 'rented' | 'empty' | 'owner_finance' | 'lease_purchase';
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
  insurance_policy_number?: string;
  insurance_provider?: string;
  insurance_expiry_date?: string;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  latitude?: number;
  longitude?: number;
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
  email?: string;
  phone?: string;
  late_status?: string;
  monthly_rent?: number;
  security_deposit?: number;
  lease_start_date?: string;
  lease_end_date?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  status?: string;
  properties?: {
    name: string;
    address: string;
  };
  leases?: Array<{
    id: string;
    rent: number;
    rent_cadence: string;
    lease_start_date: string;
    lease_end_date: string;
  }>;
  payment_history?: Array<{
    date: string;
    amount: number;
    status: string;
  }>;
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
  transaction_type: 'rent_payment' | 'loan_payment' | 'property_sale' | 'property_purchase' | 'expense' | 'income';
  property_id: string;
  tenant_id: string;
  description?: string;
  payment_status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  loan_id?: string;
  bank_account_id?: string;
  reference_number?: string;
  notes?: string;
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
  property_type: 'house' | 'singlewide' | 'doublewide';
  status: 'rented' | 'empty' | 'owner_finance' | 'lease_purchase';
  monthly_rent?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  year_built?: number;
  purchase_price?: number;
  purchase_date?: string;
  current_value?: number;
  is_for_sale?: boolean;
  is_for_rent?: boolean;
  insurance_policy_number?: string;
  insurance_provider?: string;
  insurance_expiry_date?: string;
  insurance_premium?: number;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  rent_cadence?: string;
}

export interface UpdatePropertyData {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  property_type?: 'house' | 'singlewide' | 'doublewide';
  status?: 'rented' | 'empty' | 'owner_finance' | 'lease_purchase';
  monthly_rent?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  year_built?: number;
  purchase_price?: number;
  purchase_date?: string;
  current_value?: number;
  is_for_sale?: boolean;
  is_for_rent?: boolean;
  insurance_policy_number?: string;
  insurance_provider?: string;
  insurance_expiry_date?: string;
  insurance_premium?: number;
  owner_name?: string;
  owner_phone?: string;
  owner_email?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  rent_cadence?: string;
}

export interface CreateTenantData {
  first_name: string;
  last_name: string;
  property_id: string;
  is_active?: boolean;
  email?: string;
  phone?: string;
  monthly_rent?: number;
  security_deposit?: number;
  lease_start_date?: string;
  lease_end_date?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  rent_cadence?: string;
}

export interface UpdateTenantData {
  first_name?: string;
  last_name?: string;
  property_id?: string;
  is_active?: boolean;
  email?: string;
  phone?: string;
  monthly_rent?: number;
  security_deposit?: number;
  lease_start_date?: string;
  lease_end_date?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  rent_cadence?: string;
}

export interface CreateTransactionData {
  transaction_date?: string;
  amount?: number;
  transaction_type?: 'rent_payment' | 'loan_payment' | 'property_sale' | 'property_purchase' | 'expense' | 'income';
  property_id?: string;
  tenant_id?: string;
  description?: string;
  payment_status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  loan_id?: string;
  bank_account_id?: string;
  reference_number?: string;
  notes?: string;
}

export interface UpdateTransactionData {
  transaction_date?: string;
  amount?: number;
  transaction_type?: 'rent_payment' | 'loan_payment' | 'property_sale' | 'property_purchase' | 'expense' | 'income';
  property_id?: string;
  tenant_id?: string;
  description?: string;
  payment_status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  loan_id?: string;
  bank_account_id?: string;
  reference_number?: string;
  notes?: string;
}

export interface LateTenant {
  id: string;
  first_name: string;
  last_name: string;
  property_id: string;
  days_late: number;
  amount_overdue: number;
  monthly_rent?: number;
  total_due?: number;
  total_late_fees?: number;
  late_fees_owed?: number;
  properties?: {
    address: string;
    name?: string;
  };
  leases?: Array<{
    id: string;
    rent: number;
    rent_cadence?: string;
    lease_start_date?: string;
  }>;
}

// UI Types
export type TxStatus = 'pending' | 'completed' | 'failed' | 'refunded' | string;

// Generic UI wrappers (add optional fields UI needs)
export type TransactionUI<TBase> = TBase & { status?: TxStatus };
export type PropertyUI<TBase> = TBase & { description?: string };
export type TenantUI<TBase> = TBase & { move_in_date?: string | Date }; 