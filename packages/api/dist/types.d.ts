export type PropertyType = 'house' | 'singlewide' | 'doublewide';
export type PropertyStatus = 'rented' | 'empty' | 'owner_finance' | 'lease_purchase';
export type TransactionType = 'rent_payment' | 'loan_payment' | 'property_sale' | 'property_purchase' | 'expense' | 'income';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type LateStatus = 'on_time' | 'late_5_days' | 'late_10_days' | 'eviction_notice' | string;
export type PaymentFrequency = 'monthly' | 'bi_weekly' | 'weekly';
export interface Property {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    property_type: PropertyType;
    status: PropertyStatus;
    bedrooms?: number;
    bathrooms?: number;
    square_feet?: number;
    year_built?: number;
    purchase_price?: number;
    purchase_date?: string;
    current_value?: number;
    is_for_sale: boolean;
    is_for_rent: boolean;
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
    created_at: string;
    updated_at: string;
    tenants?: any[];
    active_leases?: Lease[];
    active_lease_count?: number;
}
export interface Tenant {
    id: string;
    property_id?: string | null;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    lease_start_date?: string | null;
    lease_end_date?: string | null;
    security_deposit?: number | null;
    lease_pdf_url?: string | null;
    payment_history?: PaymentHistoryItem[] | any;
    late_fees_owed?: number;
    late_status?: LateStatus;
    last_payment_date?: string | null;
    currently_paid_up_date?: string;
    notes?: string | null;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    properties?: Property;
    payment_frequency?: PaymentFrequency;
    leases?: Lease[];
}
export interface Lease {
    id: string;
    tenant_id: string;
    property_id: string | null;
    lease_start_date: string;
    lease_end_date: string;
    rent: number;
    rent_cadence: string;
    rent_due_day?: number | null;
    move_in_fee?: number | null;
    late_fee_amount?: number | null;
    lease_pdf_url?: string | null;
    status: string;
    notes?: string | null;
    created_at: string;
    updated_at: string;
}
export interface PaymentHistoryItem {
    date: string;
    amount: number;
    status: PaymentStatus;
}
export interface RentPeriod {
    id: string;
    tenant_id: string;
    property_id: string;
    lease_id: string;
    period_due_date: string;
    amount_paid: number;
    late_fee_applied?: number;
    late_fee_waived?: boolean;
    due_date_override?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}
export interface PaymentAllocation {
    id: string;
    payment_id: string;
    rent_period_id: string;
    amount_allocated: number;
    allocation_date: string;
    created_at: string;
}
export interface BankAccount {
    id: string;
    name: string;
    account_number?: string;
    routing_number?: string;
    bank_name?: string;
    account_type?: string;
    current_balance: number;
    outstanding_checks: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}
export interface Loan {
    id: string;
    property_id?: string;
    lender_name: string;
    loan_number?: string;
    original_amount: number;
    current_balance: number;
    interest_rate?: number;
    monthly_payment?: number;
    start_date?: string;
    end_date?: string;
    payment_day?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}
export interface Transaction {
    id: string;
    property_id?: string | undefined;
    tenant_id?: string | undefined;
    loan_id?: string | undefined;
    bank_account_id?: string | undefined;
    transaction_type: TransactionType;
    amount: number;
    description?: string | undefined;
    transaction_date: string;
    payment_status: PaymentStatus;
    invoice_image_url?: string | undefined;
    extracted_amount?: number | undefined;
    check_image_url?: string | undefined;
    reference_number?: string | undefined;
    notes?: string | undefined;
    created_at: string;
    updated_at: string;
}
export interface ScrapedPayment {
    id: string;
    source: 'gmail' | 'sms' | 'cashapp';
    raw_data: Record<string, any>;
    extracted_amount?: number;
    extracted_date?: string;
    sender_name?: string;
    sender_email?: string;
    sender_phone?: string;
    description?: string;
    is_processed: boolean;
    proposed_property_id?: string;
    proposed_tenant_id?: string;
    proposed_transaction_type?: TransactionType;
    confidence_score?: number;
    created_at: string;
    processed_at?: string;
}
export interface DashboardStats {
    total_properties: number;
    total_tenants: number;
    outstanding_balances: number;
    monthly_income: number;
    monthly_expenses: number;
    profit: number;
    total_bank_balance: number;
    late_tenants_count: number;
}
export interface CreatePropertyData {
    name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    property_type: PropertyType;
    status?: PropertyStatus;
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
}
export interface UpdatePropertyData extends Partial<CreatePropertyData> {
    id: string;
}
export interface CreateTenantData {
    property_id?: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    lease_start_date?: string;
    lease_end_date?: string;
    security_deposit?: number;
    notes?: string;
}
export interface UpdateTenantData extends Partial<CreateTenantData> {
    id: string;
    last_payment_date?: string;
    late_fees_owed?: number;
    late_status?: LateStatus;
    is_active?: boolean;
}
export interface CreateLeaseData {
    tenant_id: string;
    property_id: string;
    lease_start_date: string;
    lease_end_date: string;
    rent: number;
    rent_cadence: string;
    move_in_fee?: number;
    late_fee_amount?: number;
    lease_pdf_url?: string;
    status?: string;
    notes?: string;
}
export interface UpdateLeaseData extends Partial<CreateLeaseData> {
    id: string;
}
export interface CreateTransactionData {
    property_id?: string | undefined;
    tenant_id?: string | undefined;
    loan_id?: string | undefined;
    bank_account_id?: string | undefined;
    transaction_type: TransactionType;
    amount: number;
    description?: string | undefined;
    transaction_date: string;
    payment_status?: PaymentStatus;
    invoice_image_url?: string | undefined;
    extracted_amount?: number | undefined;
    check_image_url?: string | undefined;
    reference_number?: string | undefined;
    notes?: string | undefined;
}
export interface UpdateTransactionData extends Partial<CreateTransactionData> {
    id?: string;
}
export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    success: boolean;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export interface LateTenant extends Tenant {
    properties: Property;
    total_due: number;
    days_late: number;
    total_late_fees?: number;
    total_outstanding?: number;
    late_periods?: number;
}
