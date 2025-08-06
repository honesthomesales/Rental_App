export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      RENT_tenants: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          property_id: string | null
          lease_start_date: string | null
          lease_end_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
          last_payment_date: string | null
          late_fees_owed: number | null
          late_status: string | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          property_id?: string | null
          lease_start_date?: string | null
          lease_end_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          last_payment_date?: string | null
          late_fees_owed?: number | null
          late_status?: string | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          property_id?: string | null
          lease_start_date?: string | null
          lease_end_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          last_payment_date?: string | null
          late_fees_owed?: number | null
          late_status?: string | null
          is_active?: boolean | null
        }
      }
      RENT_properties: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          state: string
          zip_code: string
          property_type: string | null
          units: number | null
          created_at: string
          updated_at: string
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          id?: string
          name: string
          address: string
          city: string
          state: string
          zip_code: string
          property_type?: string | null
          units?: number | null
          created_at?: string
          updated_at?: string
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          id?: string
          name?: string
          address?: string
          city?: string
          state?: string
          zip_code?: string
          property_type?: string | null
          units?: number | null
          created_at?: string
          updated_at?: string
          latitude?: number | null
          longitude?: number | null
        }
      }
      RENT_leases: {
        Row: {
          id: string
          tenant_id: string
          property_id: string
          lease_start_date: string
          lease_end_date: string
          rent: number
          rent_cadence: string
          move_in_fee: number | null
          late_fee_amount: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          property_id: string
          lease_start_date: string
          lease_end_date: string
          rent: number
          rent_cadence: string
          move_in_fee?: number | null
          late_fee_amount?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          property_id?: string
          lease_start_date?: string
          lease_end_date?: string
          rent?: number
          rent_cadence?: string
          move_in_fee?: number | null
          late_fee_amount?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      RENT_payments: {
        Row: {
          id: string
          tenant_id: string
          property_id: string
          payment_date: string
          amount: number
          payment_type: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          property_id: string
          payment_date: string
          amount: number
          payment_type: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          property_id?: string
          payment_date?: string
          amount?: number
          payment_type?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
