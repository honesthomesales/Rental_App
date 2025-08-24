export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          state: string
          zip_code: string
          property_type: 'house' | 'singlewide' | 'doublewide'
          status: 'rented' | 'empty' | 'owner_finance' | 'lease_purchase'
          bedrooms: number | null
          bathrooms: number | null
          square_feet: number | null
          year_built: number | null
          purchase_price: number | null
          purchase_date: string | null
          current_value: number | null
          monthly_rent: number | null
          is_for_sale: boolean
          is_for_rent: boolean
          insurance_policy_number: string | null
          insurance_provider: string | null
          insurance_expiry_date: string | null
          insurance_premium: number | null
          owner_name: string | null
          owner_phone: string | null
          owner_email: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          city: string
          state: string
          zip_code: string
          property_type: 'house' | 'singlewide' | 'doublewide'
          status?: 'rented' | 'empty' | 'owner_finance' | 'lease_purchase'
          bedrooms?: number | null
          bathrooms?: number | null
          square_feet?: number | null
          year_built?: number | null
          purchase_price?: number | null
          purchase_date?: string | null
          current_value?: number | null
          monthly_rent?: number | null
          is_for_sale?: boolean
          is_for_rent?: boolean
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          insurance_expiry_date?: string | null
          insurance_premium?: number | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_email?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          city?: string
          state?: string
          zip_code?: string
          property_type?: 'house' | 'singlewide' | 'doublewide'
          status?: 'rented' | 'empty' | 'owner_finance' | 'lease_purchase'
          bedrooms?: number | null
          bathrooms?: number | null
          square_feet?: number | null
          year_built?: number | null
          purchase_price?: number | null
          purchase_date?: string | null
          current_value?: number | null
          monthly_rent?: number | null
          is_for_sale?: boolean
          is_for_rent?: boolean
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          insurance_expiry_date?: string | null
          insurance_premium?: number | null
          owner_name?: string | null
          owner_phone?: string | null
          owner_email?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tenants: {
        Row: {
          id: string
          property_id: string | null
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          move_in_date: string | null
          lease_start_date: string | null
          lease_end_date: string | null
          monthly_rent: number | null
          security_deposit: number | null
          lease_pdf_url: string | null
          payment_history: Json
          late_fees_owed: number
          late_status: 'on_time' | 'late_5_days' | 'late_10_days' | 'eviction_notice'
          last_payment_date: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id?: string | null
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          move_in_date?: string | null
          lease_start_date?: string | null
          lease_end_date?: string | null
          monthly_rent?: number | null
          security_deposit?: number | null
          lease_pdf_url?: string | null
          payment_history?: Json
          late_fees_owed?: number
          late_status?: 'on_time' | 'late_5_days' | 'late_10_days' | 'eviction_notice'
          last_payment_date?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string | null
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          move_in_date?: string | null
          lease_start_date?: string | null
          lease_end_date?: string | null
          monthly_rent?: number | null
          security_deposit?: number | null
          lease_pdf_url?: string | null
          payment_history?: Json
          late_fees_owed?: number
          late_status?: 'on_time' | 'late_5_days' | 'late_10_days' | 'eviction_notice'
          last_payment_date?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bank_accounts: {
        Row: {
          id: string
          name: string
          account_number: string | null
          routing_number: string | null
          bank_name: string | null
          account_type: string | null
          current_balance: number
          outstanding_checks: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          account_number?: string | null
          routing_number?: string | null
          bank_name?: string | null
          account_type?: string | null
          current_balance?: number
          outstanding_checks?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          account_number?: string | null
          routing_number?: string | null
          bank_name?: string | null
          account_type?: string | null
          current_balance?: number
          outstanding_checks?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      loans: {
        Row: {
          id: string
          property_id: string | null
          lender_name: string
          loan_number: string | null
          original_amount: number
          current_balance: number
          interest_rate: number | null
          monthly_payment: number | null
          start_date: string | null
          end_date: string | null
          payment_day: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id?: string | null
          lender_name: string
          loan_number?: string | null
          original_amount: number
          current_balance: number
          interest_rate?: number | null
          monthly_payment?: number | null
          start_date?: string | null
          end_date?: string | null
          payment_day?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string | null
          lender_name?: string
          loan_number?: string | null
          original_amount?: number
          current_balance?: number
          interest_rate?: number | null
          monthly_payment?: number | null
          start_date?: string | null
          end_date?: string | null
          payment_day?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          property_id: string | null
          tenant_id: string | null
          loan_id: string | null
          bank_account_id: string | null
          transaction_type: 'rent_payment' | 'loan_payment' | 'property_sale' | 'property_purchase' | 'expense' | 'income'
          amount: number
          description: string | null
          transaction_date: string
          payment_status: 'pending' | 'completed' | 'failed' | 'cancelled'
          invoice_image_url: string | null
          extracted_amount: number | null
          check_image_url: string | null
          reference_number: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id?: string | null
          tenant_id?: string | null
          loan_id?: string | null
          bank_account_id?: string | null
          transaction_type: 'rent_payment' | 'loan_payment' | 'property_sale' | 'property_purchase' | 'expense' | 'income'
          amount: number
          description?: string | null
          transaction_date: string
          payment_status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          invoice_image_url?: string | null
          extracted_amount?: number | null
          check_image_url?: string | null
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string | null
          tenant_id?: string | null
          loan_id?: string | null
          bank_account_id?: string | null
          transaction_type?: 'rent_payment' | 'loan_payment' | 'property_sale' | 'property_purchase' | 'expense' | 'income'
          amount?: number
          description?: string | null
          transaction_date?: string
          payment_status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          invoice_image_url?: string | null
          extracted_amount?: number | null
          check_image_url?: string | null
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      scraped_payments: {
        Row: {
          id: string
          source: string
          raw_data: Json
          extracted_amount: number | null
          extracted_date: string | null
          sender_name: string | null
          sender_email: string | null
          sender_phone: string | null
          description: string | null
          is_processed: boolean
          proposed_property_id: string | null
          proposed_tenant_id: string | null
          proposed_transaction_type: 'rent_payment' | 'loan_payment' | 'property_sale' | 'property_purchase' | 'expense' | 'income' | null
          confidence_score: number | null
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          source: string
          raw_data: Json
          extracted_amount?: number | null
          extracted_date?: string | null
          sender_name?: string | null
          sender_email?: string | null
          sender_phone?: string | null
          description?: string | null
          is_processed?: boolean
          proposed_property_id?: string | null
          proposed_tenant_id?: string | null
          proposed_transaction_type?: 'rent_payment' | 'loan_payment' | 'property_sale' | 'property_purchase' | 'expense' | 'income' | null
          confidence_score?: number | null
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          source?: string
          raw_data?: Json
          extracted_amount?: number | null
          extracted_date?: string | null
          sender_name?: string | null
          sender_email?: string | null
          sender_phone?: string | null
          description?: string | null
          is_processed?: boolean
          proposed_property_id?: string | null
          proposed_tenant_id?: string | null
          proposed_transaction_type?: 'rent_payment' | 'loan_payment' | 'property_sale' | 'property_purchase' | 'expense' | 'income' | null
          confidence_score?: number | null
          created_at?: string
          processed_at?: string | null
        }
      }
    }
  }
} 