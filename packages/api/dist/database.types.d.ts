export type Json = string | number | boolean | null | {
    [key: string]: Json | undefined;
} | Json[];
export type Database = {
    public: {
        Tables: {
            RENT_properties: {
                Row: {
                    id: string;
                    name: string;
                    address: string;
                    city: string;
                    state: string;
                    zip_code: string;
                    property_type: 'house' | 'singlewide' | 'doublewide';
                    status: 'rented' | 'empty' | 'owner_finance' | 'lease_purchase';
                    bedrooms: number | null;
                    bathrooms: number | null;
                    square_feet: number | null;
                    year_built: number | null;
                    purchase_price: number | null;
                    purchase_date: string | null;
                    current_value: number | null;
                    is_for_sale: boolean;
                    is_for_rent: boolean;
                    insurance_policy_number: string | null;
                    insurance_provider: string | null;
                    insurance_expiry_date: string | null;
                    insurance_premium: number | null;
                    owner_name: string | null;
                    owner_phone: string | null;
                    owner_email: string | null;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    address: string;
                    city: string;
                    state: string;
                    zip_code: string;
                    property_type: 'house' | 'singlewide' | 'doublewide';
                    status?: 'rented' | 'empty' | 'owner_finance' | 'lease_purchase';
                    bedrooms?: number | null;
                    bathrooms?: number | null;
                    square_feet?: number | null;
                    year_built?: number | null;
                    purchase_price?: number | null;
                    purchase_date?: string | null;
                    current_value?: number | null;
                    is_for_sale?: boolean;
                    is_for_rent?: boolean;
                    insurance_policy_number?: string | null;
                    insurance_provider?: string | null;
                    insurance_expiry_date?: string | null;
                    insurance_premium?: number | null;
                    owner_name?: string | null;
                    owner_phone?: string | null;
                    owner_email?: string | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    address?: string;
                    city?: string;
                    state?: string;
                    zip_code?: string;
                    property_type?: 'house' | 'singlewide' | 'doublewide';
                    status?: 'rented' | 'empty' | 'owner_finance' | 'lease_purchase';
                    bedrooms?: number | null;
                    bathrooms?: number | null;
                    square_feet?: number | null;
                    year_built?: number | null;
                    purchase_price?: number | null;
                    purchase_date?: string | null;
                    current_value?: number | null;
                    is_for_sale?: boolean;
                    is_for_rent?: boolean;
                    insurance_policy_number?: string | null;
                    insurance_provider?: string | null;
                    insurance_expiry_date?: string | null;
                    insurance_premium?: number | null;
                    owner_name?: string | null;
                    owner_phone?: string | null;
                    owner_email?: string | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            RENT_tenants: {
                Row: {
                    id: string;
                    property_id: string | null;
                    first_name: string;
                    last_name: string;
                    email: string | null;
                    phone: string | null;
                    emergency_contact_name: string | null;
                    emergency_contact_phone: string | null;
                    lease_start_date: string | null;
                    lease_end_date: string | null;
                    security_deposit: number | null;
                    lease_pdf_url: string | null;
                    payment_history: Json;
                    late_fees_owed: number;
                    late_status: string;
                    last_payment_date: string | null;
                    notes: string | null;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
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
                    payment_history?: Json;
                    late_fees_owed?: number;
                    late_status?: string;
                    last_payment_date?: string | null;
                    notes?: string | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    property_id?: string | null;
                    first_name?: string;
                    last_name?: string;
                    email?: string | null;
                    phone?: string | null;
                    emergency_contact_name?: string | null;
                    emergency_contact_phone?: string | null;
                    lease_start_date?: string | null;
                    lease_end_date?: string | null;
                    security_deposit?: number | null;
                    lease_pdf_url?: string | null;
                    payment_history?: Json;
                    late_fees_owed?: number;
                    late_status?: string;
                    last_payment_date?: string | null;
                    notes?: string | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "RENT_tenants_property_id_fkey";
                        columns: ["property_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_properties";
                        referencedColumns: ["id"];
                    }
                ];
            };
            RENT_leases: {
                Row: {
                    id: string;
                    tenant_id: string;
                    property_id: string | null;
                    lease_start_date: string;
                    lease_end_date: string;
                    rent: number;
                    rent_cadence: string;
                    rent_due_day: number | null;
                    move_in_fee: number | null;
                    late_fee_amount: number | null;
                    lease_pdf_url: string | null;
                    status: string;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
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
                    status?: string;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    tenant_id?: string;
                    property_id?: string | null;
                    lease_start_date?: string;
                    lease_end_date?: string;
                    rent?: number;
                    rent_cadence?: string;
                    rent_due_day?: number | null;
                    move_in_fee?: number | null;
                    late_fee_amount?: number | null;
                    lease_pdf_url?: string | null;
                    status?: string;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "RENT_leases_property_id_fkey";
                        columns: ["property_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_properties";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "RENT_leases_tenant_id_fkey";
                        columns: ["tenant_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_tenants";
                        referencedColumns: ["id"];
                    }
                ];
            };
            RENT_payments: {
                Row: {
                    id: string;
                    property_id: string | null;
                    tenant_id: string | null;
                    payment_date: string;
                    amount: number;
                    payment_type: string;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    property_id?: string | null;
                    tenant_id?: string | null;
                    payment_date: string;
                    amount: number;
                    payment_type: string;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    property_id?: string | null;
                    tenant_id?: string | null;
                    payment_date?: string;
                    amount?: number;
                    payment_type?: string;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "RENT_payments_property_id_fkey";
                        columns: ["property_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_properties";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "RENT_payments_tenant_id_fkey";
                        columns: ["tenant_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_tenants";
                        referencedColumns: ["id"];
                    }
                ];
            };
            RENT_other: {
                Row: {
                    id: string;
                    date: string;
                    type: 'expense' | 'income';
                    amount: number;
                    description: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    date: string;
                    type: 'expense' | 'income';
                    amount: number;
                    description?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    date?: string;
                    type?: 'expense' | 'income';
                    amount?: number;
                    description?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            RENT_rent_periods: {
                Row: {
                    id: string;
                    tenant_id: string;
                    property_id: string;
                    lease_id: string;
                    period_due_date: string;
                    rent_amount: number;
                    rent_cadence: string;
                    status: 'paid' | 'unpaid' | 'partial' | 'overdue';
                    amount_paid: number;
                    late_fees: number;
                    late_fees_waived: boolean;
                    due_date_override: string | null;
                    notes: string | null;
                    days_late: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    tenant_id: string;
                    property_id: string;
                    lease_id: string;
                    period_due_date: string;
                    rent_amount: number;
                    rent_cadence: string;
                    status?: 'paid' | 'unpaid' | 'partial' | 'overdue';
                    amount_paid?: number;
                    late_fees?: number;
                    late_fees_waived?: boolean;
                    due_date_override?: string | null;
                    notes?: string | null;
                    days_late?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    tenant_id?: string;
                    property_id?: string;
                    lease_id?: string;
                    period_due_date?: string;
                    rent_amount?: number;
                    rent_cadence?: string;
                    status?: 'paid' | 'unpaid' | 'partial' | 'overdue';
                    amount_paid?: number;
                    late_fees?: number;
                    late_fees_waived?: boolean;
                    due_date_override?: string | null;
                    notes?: string | null;
                    days_late?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "RENT_rent_periods_tenant_id_fkey";
                        columns: ["tenant_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_tenants";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "RENT_rent_periods_property_id_fkey";
                        columns: ["property_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_properties";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "RENT_rent_periods_lease_id_fkey";
                        columns: ["lease_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_leases";
                        referencedColumns: ["id"];
                    }
                ];
            };
            bank_accounts: {
                Row: {
                    id: string;
                    name: string;
                    account_number: string | null;
                    routing_number: string | null;
                    bank_name: string | null;
                    account_type: string | null;
                    current_balance: number;
                    outstanding_checks: number;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    account_number?: string | null;
                    routing_number?: string | null;
                    bank_name?: string | null;
                    account_type?: string | null;
                    current_balance?: number;
                    outstanding_checks?: number;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    account_number?: string | null;
                    routing_number?: string | null;
                    bank_name?: string | null;
                    account_type?: string | null;
                    current_balance?: number;
                    outstanding_checks?: number;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            loans: {
                Row: {
                    id: string;
                    property_id: string | null;
                    lender_name: string;
                    loan_number: string | null;
                    original_amount: number;
                    current_balance: number;
                    interest_rate: number | null;
                    monthly_payment: number | null;
                    start_date: string | null;
                    end_date: string | null;
                    payment_day: number | null;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    property_id?: string | null;
                    lender_name: string;
                    loan_number?: string | null;
                    original_amount: number;
                    current_balance: number;
                    interest_rate?: number | null;
                    monthly_payment?: number | null;
                    start_date?: string | null;
                    end_date?: string | null;
                    payment_day?: number | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    property_id?: string | null;
                    lender_name?: string;
                    loan_number?: string | null;
                    original_amount?: number;
                    current_balance?: number;
                    interest_rate?: number | null;
                    monthly_payment?: number | null;
                    start_date?: string | null;
                    end_date?: string | null;
                    payment_day?: number | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "loans_property_id_fkey";
                        columns: ["property_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_properties";
                        referencedColumns: ["id"];
                    }
                ];
            };
            RENT_transactions: {
                Row: {
                    id: string;
                    property_id: string | null;
                    tenant_id: string | null;
                    loan_id: string | null;
                    bank_account_id: string | null;
                    transaction_type: 'rent_payment' | 'loan_payment' | 'property_sale' | 'property_purchase' | 'expense' | 'income';
                    amount: number;
                    description: string | null;
                    transaction_date: string;
                    payment_status: 'pending' | 'completed' | 'failed' | 'cancelled';
                    invoice_image_url: string | null;
                    extracted_amount: number | null;
                    check_image_url: string | null;
                    reference_number: string | null;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    property_id?: string | null;
                    tenant_id?: string | null;
                    loan_id?: string | null;
                    bank_account_id?: string | null;
                    transaction_type: 'rent_payment' | 'loan_payment' | 'property_sale' | 'property_purchase' | 'expense' | 'income';
                    amount: number;
                    description?: string | null;
                    transaction_date: string;
                    payment_status?: 'pending' | 'completed' | 'failed' | 'cancelled';
                    invoice_image_url?: string | null;
                    extracted_amount?: number | null;
                    check_image_url?: string | null;
                    reference_number?: string | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    property_id?: string | null;
                    tenant_id?: string | null;
                    loan_id?: string | null;
                    bank_account_id?: string | null;
                    transaction_type?: 'rent_payment' | 'loan_payment' | 'property_sale' | 'property_purchase' | 'expense' | 'income';
                    amount?: number;
                    description?: string | null;
                    transaction_date?: string;
                    payment_status?: 'pending' | 'completed' | 'failed' | 'cancelled';
                    invoice_image_url?: string | null;
                    extracted_amount?: number | null;
                    check_image_url?: string | null;
                    reference_number?: string | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "RENT_transactions_property_id_fkey";
                        columns: ["property_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_properties";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "RENT_transactions_tenant_id_fkey";
                        columns: ["tenant_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_tenants";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "RENT_transactions_loan_id_fkey";
                        columns: ["loan_id"];
                        isOneToOne: false;
                        referencedRelation: "loans";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "RENT_transactions_bank_account_id_fkey";
                        columns: ["bank_account_id"];
                        isOneToOne: false;
                        referencedRelation: "bank_accounts";
                        referencedColumns: ["id"];
                    }
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            property_type: 'house' | 'singlewide' | 'doublewide';
            property_status: 'rented' | 'empty' | 'owner_finance' | 'lease_purchase';
            transaction_type: 'rent_payment' | 'loan_payment' | 'property_sale' | 'property_purchase' | 'expense' | 'income';
            payment_status: 'pending' | 'completed' | 'failed' | 'cancelled';
            late_status: 'on_time' | 'late_5_days' | 'late_10_days' | 'eviction_notice';
        };
    };
};
