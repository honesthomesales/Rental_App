export type Json = string | number | boolean | null | {
    [key: string]: Json | undefined;
} | Json[];
export type Database = {
    __InternalSupabase: {
        PostgrestVersion: "12.2.3 (519615d)";
    };
    public: {
        Tables: {
            activity_log: {
                Row: {
                    created_at: string | null;
                    details: Json | null;
                    id: string;
                    task_id: string | null;
                    type: string;
                    user_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    details?: Json | null;
                    id?: string;
                    task_id?: string | null;
                    type: string;
                    user_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    details?: Json | null;
                    id?: string;
                    task_id?: string | null;
                    type?: string;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "activity_log_task_id_fkey";
                        columns: ["task_id"];
                        isOneToOne: false;
                        referencedRelation: "todos";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "activity_log_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "team_members";
                        referencedColumns: ["id"];
                    }
                ];
            };
            agent_events: {
                Row: {
                    created_at: string | null;
                    error: string | null;
                    executed: boolean;
                    id: string;
                    mode: string;
                    plan_json: Json | null;
                    success: boolean | null;
                    transcript: string;
                    user_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    error?: string | null;
                    executed?: boolean;
                    id?: string;
                    mode: string;
                    plan_json?: Json | null;
                    success?: boolean | null;
                    transcript: string;
                    user_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    error?: string | null;
                    executed?: boolean;
                    id?: string;
                    mode?: string;
                    plan_json?: Json | null;
                    success?: boolean | null;
                    transcript?: string;
                    user_id?: string | null;
                };
                Relationships: [];
            };
            app_config: {
                Row: {
                    created_at: string | null;
                    description: string | null;
                    id: number;
                    key_name: string;
                    key_value: string;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    description?: string | null;
                    id?: number;
                    key_name: string;
                    key_value: string;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    description?: string | null;
                    id?: number;
                    key_name?: string;
                    key_value?: string;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
            assistant_turns: {
                Row: {
                    confidence: number;
                    correlation_id: string | null;
                    created_at: string;
                    executed: boolean;
                    execution_result: Json | null;
                    followups: string[];
                    id: number;
                    intent: string;
                    missing_slots: string[];
                    org_id: string | null;
                    slots: Json;
                    tool: string;
                    transcript: string;
                    user_id: string | null;
                };
                Insert: {
                    confidence: number;
                    correlation_id?: string | null;
                    created_at?: string;
                    executed?: boolean;
                    execution_result?: Json | null;
                    followups?: string[];
                    id?: never;
                    intent: string;
                    missing_slots?: string[];
                    org_id?: string | null;
                    slots?: Json;
                    tool: string;
                    transcript: string;
                    user_id?: string | null;
                };
                Update: {
                    confidence?: number;
                    correlation_id?: string | null;
                    created_at?: string;
                    executed?: boolean;
                    execution_result?: Json | null;
                    followups?: string[];
                    id?: never;
                    intent?: string;
                    missing_slots?: string[];
                    org_id?: string | null;
                    slots?: Json;
                    tool?: string;
                    transcript?: string;
                    user_id?: string | null;
                };
                Relationships: [];
            };
            comments: {
                Row: {
                    created_at: string | null;
                    id: string;
                    task_id: string | null;
                    text: string;
                    user_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    task_id?: string | null;
                    text: string;
                    user_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    task_id?: string | null;
                    text?: string;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "comments_task_id_fkey";
                        columns: ["task_id"];
                        isOneToOne: false;
                        referencedRelation: "todos";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "comments_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "team_members";
                        referencedColumns: ["id"];
                    }
                ];
            };
            company_members: {
                Row: {
                    company_id: string;
                    created_at: string;
                    user_id: string;
                };
                Insert: {
                    company_id: string;
                    created_at?: string;
                    user_id: string;
                };
                Update: {
                    company_id?: string;
                    created_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "company_members_user_fk";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "user_preferences";
                        referencedColumns: ["user_id"];
                    }
                ];
            };
            expense_types: {
                Row: {
                    created_at: string | null;
                    description: string | null;
                    id: number;
                    name: string;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    description?: string | null;
                    id?: number;
                    name: string;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    description?: string | null;
                    id?: number;
                    name?: string;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
            gmail_tokens: {
                Row: {
                    created_at: string | null;
                    refresh_token: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    refresh_token: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    refresh_token?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            intent_observations: {
                Row: {
                    blocked: boolean;
                    blocked_by: string[];
                    confidence: number;
                    context_now_iso: string | null;
                    context_tz: string | null;
                    correlation_id: string | null;
                    created_at: string;
                    fired_validation_ids: string[];
                    id: number;
                    intent: string;
                    missing_slots: string[];
                    org_id: string | null;
                    parsed_payload: Json;
                    resolver_question: string | null;
                    transcript: string;
                    user_id: string | null;
                    warnings: string[];
                };
                Insert: {
                    blocked?: boolean;
                    blocked_by?: string[];
                    confidence: number;
                    context_now_iso?: string | null;
                    context_tz?: string | null;
                    correlation_id?: string | null;
                    created_at?: string;
                    fired_validation_ids?: string[];
                    id?: never;
                    intent: string;
                    missing_slots?: string[];
                    org_id?: string | null;
                    parsed_payload: Json;
                    resolver_question?: string | null;
                    transcript: string;
                    user_id?: string | null;
                    warnings?: string[];
                };
                Update: {
                    blocked?: boolean;
                    blocked_by?: string[];
                    confidence?: number;
                    context_now_iso?: string | null;
                    context_tz?: string | null;
                    correlation_id?: string | null;
                    created_at?: string;
                    fired_validation_ids?: string[];
                    id?: never;
                    intent?: string;
                    missing_slots?: string[];
                    org_id?: string | null;
                    parsed_payload?: Json;
                    resolver_question?: string | null;
                    transcript?: string;
                    user_id?: string | null;
                    warnings?: string[];
                };
                Relationships: [];
            };
            intent_requirements: {
                Row: {
                    ask_order: string[] | null;
                    created_at: string;
                    enabled: boolean;
                    followup_template: string | null;
                    id: string;
                    intent: string;
                    min_confidence: number;
                    optional_slots: Json;
                    required_slots: Json;
                    updated_at: string;
                };
                Insert: {
                    ask_order?: string[] | null;
                    created_at?: string;
                    enabled?: boolean;
                    followup_template?: string | null;
                    id?: string;
                    intent: string;
                    min_confidence?: number;
                    optional_slots?: Json;
                    required_slots?: Json;
                    updated_at?: string;
                };
                Update: {
                    ask_order?: string[] | null;
                    created_at?: string;
                    enabled?: boolean;
                    followup_template?: string | null;
                    id?: string;
                    intent?: string;
                    min_confidence?: number;
                    optional_slots?: Json;
                    required_slots?: Json;
                    updated_at?: string;
                };
                Relationships: [];
            };
            intent_validations: {
                Row: {
                    config: Json;
                    created_at: string;
                    enabled: boolean;
                    id: string;
                    intent: string;
                    message: string;
                    priority: number;
                    severity: string;
                    updated_at: string;
                    validator: string;
                };
                Insert: {
                    config?: Json;
                    created_at?: string;
                    enabled?: boolean;
                    id?: string;
                    intent: string;
                    message: string;
                    priority?: number;
                    severity?: string;
                    updated_at?: string;
                    validator: string;
                };
                Update: {
                    config?: Json;
                    created_at?: string;
                    enabled?: boolean;
                    id?: string;
                    intent?: string;
                    message?: string;
                    priority?: number;
                    severity?: string;
                    updated_at?: string;
                    validator?: string;
                };
                Relationships: [];
            };
            invoices: {
                Row: {
                    business_info: Json;
                    created_at: string | null;
                    customer_address: string | null;
                    customer_email: string | null;
                    customer_name: string | null;
                    customer_phone: string | null;
                    deprecated_at: string | null;
                    due_date: string | null;
                    due_time: string | null;
                    id: string;
                    is_deprecated: boolean;
                    job_description: string | null;
                    job_id: number;
                    job_name: string;
                    line_items: Json;
                    original_completion_date: string | null;
                    pay_provider: string | null;
                    pay_token: string | null;
                    pay_token_created_at: string | null;
                    receipt_ids: string[] | null;
                    status: string;
                    total_amount: number;
                    user_id: string | null;
                };
                Insert: {
                    business_info?: Json;
                    created_at?: string | null;
                    customer_address?: string | null;
                    customer_email?: string | null;
                    customer_name?: string | null;
                    customer_phone?: string | null;
                    deprecated_at?: string | null;
                    due_date?: string | null;
                    due_time?: string | null;
                    id?: string;
                    is_deprecated?: boolean;
                    job_description?: string | null;
                    job_id: number;
                    job_name: string;
                    line_items?: Json;
                    original_completion_date?: string | null;
                    pay_provider?: string | null;
                    pay_token?: string | null;
                    pay_token_created_at?: string | null;
                    receipt_ids?: string[] | null;
                    status?: string;
                    total_amount?: number;
                    user_id?: string | null;
                };
                Update: {
                    business_info?: Json;
                    created_at?: string | null;
                    customer_address?: string | null;
                    customer_email?: string | null;
                    customer_name?: string | null;
                    customer_phone?: string | null;
                    deprecated_at?: string | null;
                    due_date?: string | null;
                    due_time?: string | null;
                    id?: string;
                    is_deprecated?: boolean;
                    job_description?: string | null;
                    job_id?: number;
                    job_name?: string;
                    line_items?: Json;
                    original_completion_date?: string | null;
                    pay_provider?: string | null;
                    pay_token?: string | null;
                    pay_token_created_at?: string | null;
                    receipt_ids?: string[] | null;
                    status?: string;
                    total_amount?: number;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "invoices_job_id_fkey";
                        columns: ["job_id"];
                        isOneToOne: false;
                        referencedRelation: "jobs";
                        referencedColumns: ["id"];
                    }
                ];
            };
            jobs: {
                Row: {
                    address: string | null;
                    created_at: string;
                    customer_info: string | null;
                    due_date: string | null;
                    due_time: string | null;
                    email: string | null;
                    estimate_accepted_at: string | null;
                    estimate_declined_at: string | null;
                    estimate_expires_at: string | null;
                    estimate_notes: string | null;
                    estimate_pdf_url: string | null;
                    estimate_public_token: string | null;
                    estimate_sent_at: string | null;
                    estimate_status: Database["public"]["Enums"]["estimate_status"];
                    "Full Job Description": string | null;
                    id: number;
                    is_estimate: boolean;
                    job_description: string | null;
                    job_name: string | null;
                    payment_info: Json | null;
                    phone: string | null;
                    project_end_date: string | null;
                    project_start_date: string | null;
                    project_status: string | null;
                    project_type: string | null;
                    status: string;
                    total_project_amount: number | null;
                    user_id: string | null;
                };
                Insert: {
                    address?: string | null;
                    created_at?: string;
                    customer_info?: string | null;
                    due_date?: string | null;
                    due_time?: string | null;
                    email?: string | null;
                    estimate_accepted_at?: string | null;
                    estimate_declined_at?: string | null;
                    estimate_expires_at?: string | null;
                    estimate_notes?: string | null;
                    estimate_pdf_url?: string | null;
                    estimate_public_token?: string | null;
                    estimate_sent_at?: string | null;
                    estimate_status?: Database["public"]["Enums"]["estimate_status"];
                    "Full Job Description"?: string | null;
                    id?: number;
                    is_estimate?: boolean;
                    job_description?: string | null;
                    job_name?: string | null;
                    payment_info?: Json | null;
                    phone?: string | null;
                    project_end_date?: string | null;
                    project_start_date?: string | null;
                    project_status?: string | null;
                    project_type?: string | null;
                    status?: string;
                    total_project_amount?: number | null;
                    user_id?: string | null;
                };
                Update: {
                    address?: string | null;
                    created_at?: string;
                    customer_info?: string | null;
                    due_date?: string | null;
                    due_time?: string | null;
                    email?: string | null;
                    estimate_accepted_at?: string | null;
                    estimate_declined_at?: string | null;
                    estimate_expires_at?: string | null;
                    estimate_notes?: string | null;
                    estimate_pdf_url?: string | null;
                    estimate_public_token?: string | null;
                    estimate_sent_at?: string | null;
                    estimate_status?: Database["public"]["Enums"]["estimate_status"];
                    "Full Job Description"?: string | null;
                    id?: number;
                    is_estimate?: boolean;
                    job_description?: string | null;
                    job_name?: string | null;
                    payment_info?: Json | null;
                    phone?: string | null;
                    project_end_date?: string | null;
                    project_start_date?: string | null;
                    project_status?: string | null;
                    project_type?: string | null;
                    status?: string;
                    total_project_amount?: number | null;
                    user_id?: string | null;
                };
                Relationships: [];
            };
            line_items: {
                Row: {
                    created_at: string | null;
                    description: string;
                    id: string;
                    job_id: number;
                    line_item_type: string | null;
                    milestone_id: string | null;
                    original_receipt_amount: number | null;
                    price: number;
                    quantity: number;
                    receipt_multiplier_applied: boolean | null;
                    total: number;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    description: string;
                    id?: string;
                    job_id: number;
                    line_item_type?: string | null;
                    milestone_id?: string | null;
                    original_receipt_amount?: number | null;
                    price?: number;
                    quantity?: number;
                    receipt_multiplier_applied?: boolean | null;
                    total?: number;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    description?: string;
                    id?: string;
                    job_id?: number;
                    line_item_type?: string | null;
                    milestone_id?: string | null;
                    original_receipt_amount?: number | null;
                    price?: number;
                    quantity?: number;
                    receipt_multiplier_applied?: boolean | null;
                    total?: number;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "line_items_job_id_fkey";
                        columns: ["job_id"];
                        isOneToOne: false;
                        referencedRelation: "jobs";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "line_items_milestone_id_fkey";
                        columns: ["milestone_id"];
                        isOneToOne: false;
                        referencedRelation: "milestones";
                        referencedColumns: ["id"];
                    }
                ];
            };
            milestone_approvals: {
                Row: {
                    approval_notes: string | null;
                    approval_token: string;
                    approval_type: string;
                    approved: boolean | null;
                    approved_at: string | null;
                    created_at: string | null;
                    customer_email: string;
                    expires_at: string;
                    id: string;
                    milestone_id: string | null;
                };
                Insert: {
                    approval_notes?: string | null;
                    approval_token: string;
                    approval_type: string;
                    approved?: boolean | null;
                    approved_at?: string | null;
                    created_at?: string | null;
                    customer_email: string;
                    expires_at: string;
                    id?: string;
                    milestone_id?: string | null;
                };
                Update: {
                    approval_notes?: string | null;
                    approval_token?: string;
                    approval_type?: string;
                    approved?: boolean | null;
                    approved_at?: string | null;
                    created_at?: string | null;
                    customer_email?: string;
                    expires_at?: string;
                    id?: string;
                    milestone_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "milestone_approvals_milestone_id_fkey";
                        columns: ["milestone_id"];
                        isOneToOne: false;
                        referencedRelation: "milestones";
                        referencedColumns: ["id"];
                    }
                ];
            };
            milestone_change_orders: {
                Row: {
                    additional_amount: number;
                    approved_by_customer: boolean | null;
                    approved_date: string | null;
                    change_order_number: string;
                    created_at: string | null;
                    description: string;
                    id: string;
                    milestone_id: string | null;
                    status: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    additional_amount: number;
                    approved_by_customer?: boolean | null;
                    approved_date?: string | null;
                    change_order_number: string;
                    created_at?: string | null;
                    description: string;
                    id?: string;
                    milestone_id?: string | null;
                    status?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    additional_amount?: number;
                    approved_by_customer?: boolean | null;
                    approved_date?: string | null;
                    change_order_number?: string;
                    created_at?: string | null;
                    description?: string;
                    id?: string;
                    milestone_id?: string | null;
                    status?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "milestone_change_orders_milestone_id_fkey";
                        columns: ["milestone_id"];
                        isOneToOne: false;
                        referencedRelation: "milestones";
                        referencedColumns: ["id"];
                    }
                ];
            };
            milestone_dependencies: {
                Row: {
                    created_at: string | null;
                    depends_on_milestone_id: string | null;
                    id: string;
                    milestone_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    depends_on_milestone_id?: string | null;
                    id?: string;
                    milestone_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    depends_on_milestone_id?: string | null;
                    id?: string;
                    milestone_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "milestone_dependencies_depends_on_milestone_id_fkey";
                        columns: ["depends_on_milestone_id"];
                        isOneToOne: false;
                        referencedRelation: "milestones";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "milestone_dependencies_milestone_id_fkey";
                        columns: ["milestone_id"];
                        isOneToOne: false;
                        referencedRelation: "milestones";
                        referencedColumns: ["id"];
                    }
                ];
            };
            milestone_invoices: {
                Row: {
                    amount: number;
                    created_at: string | null;
                    id: string;
                    invoice_date: string;
                    invoice_id: string | null;
                    milestone_id: string | null;
                    status: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    amount: number;
                    created_at?: string | null;
                    id?: string;
                    invoice_date: string;
                    invoice_id?: string | null;
                    milestone_id?: string | null;
                    status?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    amount?: number;
                    created_at?: string | null;
                    id?: string;
                    invoice_date?: string;
                    invoice_id?: string | null;
                    milestone_id?: string | null;
                    status?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "milestone_invoices_invoice_id_fkey";
                        columns: ["invoice_id"];
                        isOneToOne: false;
                        referencedRelation: "active_invoices";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "milestone_invoices_invoice_id_fkey";
                        columns: ["invoice_id"];
                        isOneToOne: false;
                        referencedRelation: "deprecated_invoices";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "milestone_invoices_invoice_id_fkey";
                        columns: ["invoice_id"];
                        isOneToOne: false;
                        referencedRelation: "invoices";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "milestone_invoices_milestone_id_fkey";
                        columns: ["milestone_id"];
                        isOneToOne: false;
                        referencedRelation: "milestones";
                        referencedColumns: ["id"];
                    }
                ];
            };
            milestone_progress: {
                Row: {
                    completion_percentage: number;
                    created_at: string | null;
                    created_by: string | null;
                    id: string;
                    milestone_id: string | null;
                    notes: string | null;
                    progress_date: string;
                };
                Insert: {
                    completion_percentage: number;
                    created_at?: string | null;
                    created_by?: string | null;
                    id?: string;
                    milestone_id?: string | null;
                    notes?: string | null;
                    progress_date: string;
                };
                Update: {
                    completion_percentage?: number;
                    created_at?: string | null;
                    created_by?: string | null;
                    id?: string;
                    milestone_id?: string | null;
                    notes?: string | null;
                    progress_date?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "milestone_progress_milestone_id_fkey";
                        columns: ["milestone_id"];
                        isOneToOne: false;
                        referencedRelation: "milestones";
                        referencedColumns: ["id"];
                    }
                ];
            };
            milestone_time_entries: {
                Row: {
                    created_at: string | null;
                    description: string | null;
                    duration_minutes: number | null;
                    end_time: string | null;
                    hourly_rate: number | null;
                    id: string;
                    milestone_id: string | null;
                    start_time: string;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    description?: string | null;
                    duration_minutes?: number | null;
                    end_time?: string | null;
                    hourly_rate?: number | null;
                    id?: string;
                    milestone_id?: string | null;
                    start_time: string;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    description?: string | null;
                    duration_minutes?: number | null;
                    end_time?: string | null;
                    hourly_rate?: number | null;
                    id?: string;
                    milestone_id?: string | null;
                    start_time?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "milestone_time_entries_milestone_id_fkey";
                        columns: ["milestone_id"];
                        isOneToOne: false;
                        referencedRelation: "milestones";
                        referencedColumns: ["id"];
                    }
                ];
            };
            milestones: {
                Row: {
                    actual_amount: number | null;
                    completed_date: string | null;
                    completion_percentage: number | null;
                    created_at: string | null;
                    description: string | null;
                    due_date: string | null;
                    estimated_amount: number;
                    id: string;
                    job_id: number | null;
                    name: string;
                    sort_order: number | null;
                    start_date: string | null;
                    status: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    actual_amount?: number | null;
                    completed_date?: string | null;
                    completion_percentage?: number | null;
                    created_at?: string | null;
                    description?: string | null;
                    due_date?: string | null;
                    estimated_amount: number;
                    id?: string;
                    job_id?: number | null;
                    name: string;
                    sort_order?: number | null;
                    start_date?: string | null;
                    status?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    actual_amount?: number | null;
                    completed_date?: string | null;
                    completion_percentage?: number | null;
                    created_at?: string | null;
                    description?: string | null;
                    due_date?: string | null;
                    estimated_amount?: number;
                    id?: string;
                    job_id?: number | null;
                    name?: string;
                    sort_order?: number | null;
                    start_date?: string | null;
                    status?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "milestones_job_id_fkey";
                        columns: ["job_id"];
                        isOneToOne: false;
                        referencedRelation: "jobs";
                        referencedColumns: ["id"];
                    }
                ];
            };
            orchestrate_llm_logs: {
                Row: {
                    completion_tokens: number | null;
                    correlation_id: string | null;
                    created_at: string;
                    endpoint: string;
                    error: string | null;
                    id: number;
                    latency_ms: number | null;
                    model: string;
                    org_id: string | null;
                    prompt_tokens: number | null;
                    request_json: Json | null;
                    response_json: Json | null;
                    status_code: number | null;
                    total_tokens: number | null;
                    trace_id: string;
                    user_id: string | null;
                };
                Insert: {
                    completion_tokens?: number | null;
                    correlation_id?: string | null;
                    created_at?: string;
                    endpoint: string;
                    error?: string | null;
                    id?: number;
                    latency_ms?: number | null;
                    model: string;
                    org_id?: string | null;
                    prompt_tokens?: number | null;
                    request_json?: Json | null;
                    response_json?: Json | null;
                    status_code?: number | null;
                    total_tokens?: number | null;
                    trace_id?: string;
                    user_id?: string | null;
                };
                Update: {
                    completion_tokens?: number | null;
                    correlation_id?: string | null;
                    created_at?: string;
                    endpoint?: string;
                    error?: string | null;
                    id?: number;
                    latency_ms?: number | null;
                    model?: string;
                    org_id?: string | null;
                    prompt_tokens?: number | null;
                    request_json?: Json | null;
                    response_json?: Json | null;
                    status_code?: number | null;
                    total_tokens?: number | null;
                    trace_id?: string;
                    user_id?: string | null;
                };
                Relationships: [];
            };
            orchestrate_test_cases: {
                Row: {
                    context: Json;
                    created_at: string;
                    enabled: boolean;
                    expected: Json;
                    id: string;
                    name: string;
                    org_id: string | null;
                    transcript: string;
                    updated_at: string;
                    user_id: string | null;
                };
                Insert: {
                    context?: Json;
                    created_at?: string;
                    enabled?: boolean;
                    expected: Json;
                    id?: string;
                    name: string;
                    org_id?: string | null;
                    transcript: string;
                    updated_at?: string;
                    user_id?: string | null;
                };
                Update: {
                    context?: Json;
                    created_at?: string;
                    enabled?: boolean;
                    expected?: Json;
                    id?: string;
                    name?: string;
                    org_id?: string | null;
                    transcript?: string;
                    updated_at?: string;
                    user_id?: string | null;
                };
                Relationships: [];
            };
            payment_events: {
                Row: {
                    created_at: string;
                    id: number;
                    invoice_id: string;
                    ip: unknown | null;
                    kind: string;
                    meta: Json | null;
                    source: string | null;
                    ua: string | null;
                };
                Insert: {
                    created_at?: string;
                    id?: number;
                    invoice_id: string;
                    ip?: unknown | null;
                    kind: string;
                    meta?: Json | null;
                    source?: string | null;
                    ua?: string | null;
                };
                Update: {
                    created_at?: string;
                    id?: number;
                    invoice_id?: string;
                    ip?: unknown | null;
                    kind?: string;
                    meta?: Json | null;
                    source?: string | null;
                    ua?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "payment_events_invoice_id_fkey";
                        columns: ["invoice_id"];
                        isOneToOne: false;
                        referencedRelation: "active_invoices";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "payment_events_invoice_id_fkey";
                        columns: ["invoice_id"];
                        isOneToOne: false;
                        referencedRelation: "deprecated_invoices";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "payment_events_invoice_id_fkey";
                        columns: ["invoice_id"];
                        isOneToOne: false;
                        referencedRelation: "invoices";
                        referencedColumns: ["id"];
                    }
                ];
            };
            photos: {
                Row: {
                    amount: number | null;
                    created_at: string | null;
                    date_taken: string | null;
                    description: string | null;
                    expense_type: string | null;
                    file_name: string;
                    id: string;
                    job_id: number | null;
                    line_item_id: string | null;
                    local_path: string;
                    milestone_id: string | null;
                    original_photo_id: string | null;
                    payment_method: string | null;
                    photo_category: string | null;
                    photo_type: string;
                    total_amount: string | null;
                    updated_at: string | null;
                    user_id: string | null;
                    vendor: string | null;
                };
                Insert: {
                    amount?: number | null;
                    created_at?: string | null;
                    date_taken?: string | null;
                    description?: string | null;
                    expense_type?: string | null;
                    file_name: string;
                    id?: string;
                    job_id?: number | null;
                    line_item_id?: string | null;
                    local_path: string;
                    milestone_id?: string | null;
                    original_photo_id?: string | null;
                    payment_method?: string | null;
                    photo_category?: string | null;
                    photo_type: string;
                    total_amount?: string | null;
                    updated_at?: string | null;
                    user_id?: string | null;
                    vendor?: string | null;
                };
                Update: {
                    amount?: number | null;
                    created_at?: string | null;
                    date_taken?: string | null;
                    description?: string | null;
                    expense_type?: string | null;
                    file_name?: string;
                    id?: string;
                    job_id?: number | null;
                    line_item_id?: string | null;
                    local_path?: string;
                    milestone_id?: string | null;
                    original_photo_id?: string | null;
                    payment_method?: string | null;
                    photo_category?: string | null;
                    photo_type?: string;
                    total_amount?: string | null;
                    updated_at?: string | null;
                    user_id?: string | null;
                    vendor?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "photos_job_id_fkey";
                        columns: ["job_id"];
                        isOneToOne: false;
                        referencedRelation: "jobs";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "photos_line_item_id_fkey";
                        columns: ["line_item_id"];
                        isOneToOne: false;
                        referencedRelation: "line_items";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "photos_milestone_id_fkey";
                        columns: ["milestone_id"];
                        isOneToOne: false;
                        referencedRelation: "milestones";
                        referencedColumns: ["id"];
                    }
                ];
            };
            receipts: {
                Row: {
                    amount: number | null;
                    category: string | null;
                    created_at: string | null;
                    date: string;
                    description: string | null;
                    file_name: string;
                    id: string;
                    invoice_id: number | null;
                    job_id: number | null;
                    line_item_id: number | null;
                    local_path: string;
                    original_photo_id: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    amount?: number | null;
                    category?: string | null;
                    created_at?: string | null;
                    date: string;
                    description?: string | null;
                    file_name: string;
                    id?: string;
                    invoice_id?: number | null;
                    job_id?: number | null;
                    line_item_id?: number | null;
                    local_path: string;
                    original_photo_id?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    amount?: number | null;
                    category?: string | null;
                    created_at?: string | null;
                    date?: string;
                    description?: string | null;
                    file_name?: string;
                    id?: string;
                    invoice_id?: number | null;
                    job_id?: number | null;
                    line_item_id?: number | null;
                    local_path?: string;
                    original_photo_id?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "receipts_job_id_fkey";
                        columns: ["job_id"];
                        isOneToOne: false;
                        referencedRelation: "jobs";
                        referencedColumns: ["id"];
                    }
                ];
            };
            RENT_insurance_policies: {
                Row: {
                    coverage_amount: number | null;
                    created_at: string | null;
                    end_date: string;
                    id: string;
                    notes: string | null;
                    policy_number: string;
                    policy_type: string | null;
                    premium_amount: number | null;
                    property_id: string | null;
                    provider_name: string;
                    renewal_date: string | null;
                    start_date: string;
                    status: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    coverage_amount?: number | null;
                    created_at?: string | null;
                    end_date: string;
                    id?: string;
                    notes?: string | null;
                    policy_number: string;
                    policy_type?: string | null;
                    premium_amount?: number | null;
                    property_id?: string | null;
                    provider_name: string;
                    renewal_date?: string | null;
                    start_date: string;
                    status?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    coverage_amount?: number | null;
                    created_at?: string | null;
                    end_date?: string;
                    id?: string;
                    notes?: string | null;
                    policy_number?: string;
                    policy_type?: string | null;
                    premium_amount?: number | null;
                    property_id?: string | null;
                    provider_name?: string;
                    renewal_date?: string | null;
                    start_date?: string;
                    status?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "insurance_policies_property_id_fkey";
                        columns: ["property_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_properties";
                        referencedColumns: ["id"];
                    }
                ];
            };
            RENT_leases: {
                Row: {
                    created_at: string | null;
                    id: string;
                    late_fee_amount: number | null;
                    lease_end_date: string;
                    lease_pdf_url: string | null;
                    lease_start_date: string;
                    move_in_fee: number | null;
                    notes: string | null;
                    property_id: string | null;
                    rent: number;
                    rent_cadence: string | null;
                    rent_due_day: number | null;
                    status: string | null;
                    tenant_id: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    late_fee_amount?: number | null;
                    lease_end_date: string;
                    lease_pdf_url?: string | null;
                    lease_start_date: string;
                    move_in_fee?: number | null;
                    notes?: string | null;
                    property_id?: string | null;
                    rent: number;
                    rent_cadence?: string | null;
                    rent_due_day?: number | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    late_fee_amount?: number | null;
                    lease_end_date?: string;
                    lease_pdf_url?: string | null;
                    lease_start_date?: string;
                    move_in_fee?: number | null;
                    notes?: string | null;
                    property_id?: string | null;
                    rent?: number;
                    rent_cadence?: string | null;
                    rent_due_day?: number | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "leases_property_id_fkey";
                        columns: ["property_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_properties";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "leases_tenant_id_fkey";
                        columns: ["tenant_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_tenants";
                        referencedColumns: ["id"];
                    }
                ];
            };
            RENT_maintenance_requests: {
                Row: {
                    actual_cost: number | null;
                    completed_date: string | null;
                    created_at: string | null;
                    description: string;
                    estimated_cost: number | null;
                    id: string;
                    notes: string | null;
                    priority: string | null;
                    property_id: string | null;
                    repairman: string | null;
                    reported_date: string;
                    status: string | null;
                    tenant_id: string | null;
                    title: string;
                    updated_at: string | null;
                };
                Insert: {
                    actual_cost?: number | null;
                    completed_date?: string | null;
                    created_at?: string | null;
                    description: string;
                    estimated_cost?: number | null;
                    id?: string;
                    notes?: string | null;
                    priority?: string | null;
                    property_id?: string | null;
                    repairman?: string | null;
                    reported_date: string;
                    status?: string | null;
                    tenant_id?: string | null;
                    title: string;
                    updated_at?: string | null;
                };
                Update: {
                    actual_cost?: number | null;
                    completed_date?: string | null;
                    created_at?: string | null;
                    description?: string;
                    estimated_cost?: number | null;
                    id?: string;
                    notes?: string | null;
                    priority?: string | null;
                    property_id?: string | null;
                    repairman?: string | null;
                    reported_date?: string;
                    status?: string | null;
                    tenant_id?: string | null;
                    title?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "maintenance_requests_property_id_fkey";
                        columns: ["property_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_properties";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "maintenance_requests_tenant_id_fkey";
                        columns: ["tenant_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_tenants";
                        referencedColumns: ["id"];
                    }
                ];
            };
            rent_other: {
                Row: {
                    amount: number;
                    created_at: string | null;
                    date: string;
                    description: string | null;
                    id: string;
                    type: string;
                    updated_at: string | null;
                };
                Insert: {
                    amount: number;
                    created_at?: string | null;
                    date: string;
                    description?: string | null;
                    id?: string;
                    type: string;
                    updated_at?: string | null;
                };
                Update: {
                    amount?: number;
                    created_at?: string | null;
                    date?: string;
                    description?: string | null;
                    id?: string;
                    type?: string;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
            RENT_payments: {
                Row: {
                    amount: number;
                    created_at: string | null;
                    date_paid: string | null;
                    id: string;
                    lease_id: string | null;
                    notes: string | null;
                    payment_date: string;
                    payment_method: string | null;
                    payment_type: string;
                    property_id: string | null;
                    status: string | null;
                    tenant_id: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    amount: number;
                    created_at?: string | null;
                    date_paid?: string | null;
                    id?: string;
                    lease_id?: string | null;
                    notes?: string | null;
                    payment_date: string;
                    payment_method?: string | null;
                    payment_type: string;
                    property_id?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    amount?: number;
                    created_at?: string | null;
                    date_paid?: string | null;
                    id?: string;
                    lease_id?: string | null;
                    notes?: string | null;
                    payment_date?: string;
                    payment_method?: string | null;
                    payment_type?: string;
                    property_id?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "payments_lease_id_fkey";
                        columns: ["lease_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_leases";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "payments_property_id_fkey";
                        columns: ["property_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_properties";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "payments_tenant_id_fkey";
                        columns: ["tenant_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_tenants";
                        referencedColumns: ["id"];
                    }
                ];
            };
            RENT_properties: {
                Row: {
                    address: string;
                    bathrooms: number | null;
                    bedrooms: number | null;
                    city: string;
                    created_at: string | null;
                    current_value: number | null;
                    id: string;
                    insurance_policy_number: string | null;
                    insurance_premium: number | null;
                    insurance_provider: string | null;
                    Interest_Rate: number | null;
                    is_for_rent: boolean | null;
                    is_for_sale: boolean | null;
                    Map_ID: string | null;
                    monthly_rent: number | null;
                    name: string;
                    notes: string | null;
                    owner_name: string | null;
                    property_tax: number | null;
                    property_type: Database["public"]["Enums"]["property_type"] | null;
                    purchase_date: string | null;
                    purchase_payment: number | null;
                    purchase_price: number | null;
                    Sell_Price: number | null;
                    square_feet: number | null;
                    state: string;
                    status: Database["public"]["Enums"]["property_status"] | null;
                    updated_at: string | null;
                    year_built: number | null;
                    zip_code: string;
                };
                Insert: {
                    address: string;
                    bathrooms?: number | null;
                    bedrooms?: number | null;
                    city: string;
                    created_at?: string | null;
                    current_value?: number | null;
                    id?: string;
                    insurance_policy_number?: string | null;
                    insurance_premium?: number | null;
                    insurance_provider?: string | null;
                    Interest_Rate?: number | null;
                    is_for_rent?: boolean | null;
                    is_for_sale?: boolean | null;
                    Map_ID?: string | null;
                    monthly_rent?: number | null;
                    name: string;
                    notes?: string | null;
                    owner_name?: string | null;
                    property_tax?: number | null;
                    property_type?: Database["public"]["Enums"]["property_type"] | null;
                    purchase_date?: string | null;
                    purchase_payment?: number | null;
                    purchase_price?: number | null;
                    Sell_Price?: number | null;
                    square_feet?: number | null;
                    state: string;
                    status?: Database["public"]["Enums"]["property_status"] | null;
                    updated_at?: string | null;
                    year_built?: number | null;
                    zip_code: string;
                };
                Update: {
                    address?: string;
                    bathrooms?: number | null;
                    bedrooms?: number | null;
                    city?: string;
                    created_at?: string | null;
                    current_value?: number | null;
                    id?: string;
                    insurance_policy_number?: string | null;
                    insurance_premium?: number | null;
                    insurance_provider?: string | null;
                    Interest_Rate?: number | null;
                    is_for_rent?: boolean | null;
                    is_for_sale?: boolean | null;
                    Map_ID?: string | null;
                    monthly_rent?: number | null;
                    name?: string;
                    notes?: string | null;
                    owner_name?: string | null;
                    property_tax?: number | null;
                    property_type?: Database["public"]["Enums"]["property_type"] | null;
                    purchase_date?: string | null;
                    purchase_payment?: number | null;
                    purchase_price?: number | null;
                    Sell_Price?: number | null;
                    square_feet?: number | null;
                    state?: string;
                    status?: Database["public"]["Enums"]["property_status"] | null;
                    updated_at?: string | null;
                    year_built?: number | null;
                    zip_code?: string;
                };
                Relationships: [];
            };
            RENT_rent_periods: {
                Row: {
                    amount_paid: number | null;
                    created_at: string | null;
                    due_date_override: string | null;
                    id: string;
                    late_fee_applied: number | null;
                    late_fee_waived: boolean | null;
                    lease_id: string | null;
                    notes: string | null;
                    period_due_date: string;
                    property_id: string | null;
                    rent_amount: number;
                    rent_cadence: string;
                    status: string | null;
                    tenant_id: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    amount_paid?: number | null;
                    created_at?: string | null;
                    due_date_override?: string | null;
                    id?: string;
                    late_fee_applied?: number | null;
                    late_fee_waived?: boolean | null;
                    lease_id?: string | null;
                    notes?: string | null;
                    period_due_date: string;
                    property_id?: string | null;
                    rent_amount: number;
                    rent_cadence: string;
                    status?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    amount_paid?: number | null;
                    created_at?: string | null;
                    due_date_override?: string | null;
                    id?: string;
                    late_fee_applied?: number | null;
                    late_fee_waived?: boolean | null;
                    lease_id?: string | null;
                    notes?: string | null;
                    period_due_date?: string;
                    property_id?: string | null;
                    rent_amount?: number;
                    rent_cadence?: string;
                    status?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "RENT_rent_periods_lease_id_fkey";
                        columns: ["lease_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_leases";
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
                        foreignKeyName: "RENT_rent_periods_tenant_id_fkey";
                        columns: ["tenant_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_tenants";
                        referencedColumns: ["id"];
                    }
                ];
            };
            RENT_tenants: {
                Row: {
                    created_at: string | null;
                    currently_paid_up_date: string | null;
                    email: string | null;
                    first_name: string;
                    id: string;
                    is_active: boolean | null;
                    last_name: string;
                    lease_end_date: string | null;
                    lease_start_date: string | null;
                    notes: string | null;
                    phone: string | null;
                    property_id: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    currently_paid_up_date?: string | null;
                    email?: string | null;
                    first_name: string;
                    id?: string;
                    is_active?: boolean | null;
                    last_name: string;
                    lease_end_date?: string | null;
                    lease_start_date?: string | null;
                    notes?: string | null;
                    phone?: string | null;
                    property_id?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    currently_paid_up_date?: string | null;
                    email?: string | null;
                    first_name?: string;
                    id?: string;
                    is_active?: boolean | null;
                    last_name?: string;
                    lease_end_date?: string | null;
                    lease_start_date?: string | null;
                    notes?: string | null;
                    phone?: string | null;
                    property_id?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "tenants_property_id_fkey";
                        columns: ["property_id"];
                        isOneToOne: false;
                        referencedRelation: "RENT_properties";
                        referencedColumns: ["id"];
                    }
                ];
            };
            secure_job_hashes: {
                Row: {
                    created_at: string | null;
                    expires_at: string;
                    hash: string;
                    id: number;
                    is_used: boolean | null;
                    job_id: number;
                    used_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    expires_at: string;
                    hash: string;
                    id?: number;
                    is_used?: boolean | null;
                    job_id: number;
                    used_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    expires_at?: string;
                    hash?: string;
                    id?: number;
                    is_used?: boolean | null;
                    job_id?: number;
                    used_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "secure_job_hashes_job_id_fkey";
                        columns: ["job_id"];
                        isOneToOne: false;
                        referencedRelation: "jobs";
                        referencedColumns: ["id"];
                    }
                ];
            };
            slot_aliases: {
                Row: {
                    alias: string;
                    canonical_slot: string;
                    created_at: string;
                    enabled: boolean;
                    id: string;
                    intent: string;
                    priority: number;
                    updated_at: string;
                };
                Insert: {
                    alias: string;
                    canonical_slot: string;
                    created_at?: string;
                    enabled?: boolean;
                    id?: string;
                    intent: string;
                    priority?: number;
                    updated_at?: string;
                };
                Update: {
                    alias?: string;
                    canonical_slot?: string;
                    created_at?: string;
                    enabled?: boolean;
                    id?: string;
                    intent?: string;
                    priority?: number;
                    updated_at?: string;
                };
                Relationships: [];
            };
            slot_transforms: {
                Row: {
                    config: Json;
                    created_at: string;
                    enabled: boolean;
                    id: string;
                    intent: string;
                    kind: Database["public"]["Enums"]["slot_transform_kind"];
                    priority: number;
                    slot: string;
                    stage: string;
                    updated_at: string;
                };
                Insert: {
                    config?: Json;
                    created_at?: string;
                    enabled?: boolean;
                    id?: string;
                    intent: string;
                    kind: Database["public"]["Enums"]["slot_transform_kind"];
                    priority?: number;
                    slot: string;
                    stage?: string;
                    updated_at?: string;
                };
                Update: {
                    config?: Json;
                    created_at?: string;
                    enabled?: boolean;
                    id?: string;
                    intent?: string;
                    kind?: Database["public"]["Enums"]["slot_transform_kind"];
                    priority?: number;
                    slot?: string;
                    stage?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            team_members: {
                Row: {
                    created_at: string | null;
                    email: string;
                    id: string;
                    name: string;
                };
                Insert: {
                    created_at?: string | null;
                    email: string;
                    id?: string;
                    name: string;
                };
                Update: {
                    created_at?: string | null;
                    email?: string;
                    id?: string;
                    name?: string;
                };
                Relationships: [];
            };
            todos: {
                Row: {
                    assignee: string | null;
                    completed: boolean;
                    due_date: string | null;
                    id: string;
                    manual_order: number | null;
                    priority: string | null;
                    status: string;
                    text: string;
                    user_id: string | null;
                };
                Insert: {
                    assignee?: string | null;
                    completed?: boolean;
                    due_date?: string | null;
                    id?: string;
                    manual_order?: number | null;
                    priority?: string | null;
                    status?: string;
                    text: string;
                    user_id?: string | null;
                };
                Update: {
                    assignee?: string | null;
                    completed?: boolean;
                    due_date?: string | null;
                    id?: string;
                    manual_order?: number | null;
                    priority?: string | null;
                    status?: string;
                    text?: string;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "todos_assignee_fkey";
                        columns: ["assignee"];
                        isOneToOne: false;
                        referencedRelation: "team_members";
                        referencedColumns: ["id"];
                    }
                ];
            };
            user_preferences: {
                Row: {
                    business_address: string | null;
                    business_email: string | null;
                    business_name: string | null;
                    business_phone: string | null;
                    cashapp_cashtag: string | null;
                    cashapp_enabled: boolean | null;
                    charge_tax: boolean | null;
                    created_at: string | null;
                    email_setup_complete: boolean | null;
                    id: string;
                    logo: string | null;
                    receipt_multiplier_enabled: boolean | null;
                    receipt_multiplier_rate: number | null;
                    tax_rate: number | null;
                    updated_at: string | null;
                    user_id: string | null;
                };
                Insert: {
                    business_address?: string | null;
                    business_email?: string | null;
                    business_name?: string | null;
                    business_phone?: string | null;
                    cashapp_cashtag?: string | null;
                    cashapp_enabled?: boolean | null;
                    charge_tax?: boolean | null;
                    created_at?: string | null;
                    email_setup_complete?: boolean | null;
                    id?: string;
                    logo?: string | null;
                    receipt_multiplier_enabled?: boolean | null;
                    receipt_multiplier_rate?: number | null;
                    tax_rate?: number | null;
                    updated_at?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    business_address?: string | null;
                    business_email?: string | null;
                    business_name?: string | null;
                    business_phone?: string | null;
                    cashapp_cashtag?: string | null;
                    cashapp_enabled?: boolean | null;
                    charge_tax?: boolean | null;
                    created_at?: string | null;
                    email_setup_complete?: boolean | null;
                    id?: string;
                    logo?: string | null;
                    receipt_multiplier_enabled?: boolean | null;
                    receipt_multiplier_rate?: number | null;
                    tax_rate?: number | null;
                    updated_at?: string | null;
                    user_id?: string | null;
                };
                Relationships: [];
            };
            voice_corrections: {
                Row: {
                    active: boolean;
                    added_at: string;
                    entities: Json;
                    hits: number;
                    id: string;
                    intent: string;
                    is_regex: boolean;
                    normalized_text: string | null;
                    original_text: string | null;
                    pattern: string;
                    pattern_norm: string | null;
                    rewrite_regex: string | null;
                    rewrite_replace: string | null;
                    updated_at: string;
                    user_id: string | null;
                };
                Insert: {
                    active?: boolean;
                    added_at?: string;
                    entities?: Json;
                    hits?: number;
                    id?: string;
                    intent: string;
                    is_regex?: boolean;
                    normalized_text?: string | null;
                    original_text?: string | null;
                    pattern: string;
                    pattern_norm?: string | null;
                    rewrite_regex?: string | null;
                    rewrite_replace?: string | null;
                    updated_at?: string;
                    user_id?: string | null;
                };
                Update: {
                    active?: boolean;
                    added_at?: string;
                    entities?: Json;
                    hits?: number;
                    id?: string;
                    intent?: string;
                    is_regex?: boolean;
                    normalized_text?: string | null;
                    original_text?: string | null;
                    pattern?: string;
                    pattern_norm?: string | null;
                    rewrite_regex?: string | null;
                    rewrite_replace?: string | null;
                    updated_at?: string;
                    user_id?: string | null;
                };
                Relationships: [];
            };
        };
        Views: {
            active_invoices: {
                Row: {
                    business_info: Json | null;
                    created_at: string | null;
                    customer_address: string | null;
                    customer_email: string | null;
                    customer_name: string | null;
                    customer_phone: string | null;
                    deprecated_at: string | null;
                    due_date: string | null;
                    due_time: string | null;
                    id: string | null;
                    is_deprecated: boolean | null;
                    job_description: string | null;
                    job_id: number | null;
                    job_name: string | null;
                    line_items: Json | null;
                    original_completion_date: string | null;
                    status: string | null;
                    total_amount: number | null;
                };
                Insert: {
                    business_info?: Json | null;
                    created_at?: string | null;
                    customer_address?: string | null;
                    customer_email?: string | null;
                    customer_name?: string | null;
                    customer_phone?: string | null;
                    deprecated_at?: string | null;
                    due_date?: string | null;
                    due_time?: string | null;
                    id?: string | null;
                    is_deprecated?: boolean | null;
                    job_description?: string | null;
                    job_id?: number | null;
                    job_name?: string | null;
                    line_items?: Json | null;
                    original_completion_date?: string | null;
                    status?: string | null;
                    total_amount?: number | null;
                };
                Update: {
                    business_info?: Json | null;
                    created_at?: string | null;
                    customer_address?: string | null;
                    customer_email?: string | null;
                    customer_name?: string | null;
                    customer_phone?: string | null;
                    deprecated_at?: string | null;
                    due_date?: string | null;
                    due_time?: string | null;
                    id?: string | null;
                    is_deprecated?: boolean | null;
                    job_description?: string | null;
                    job_id?: number | null;
                    job_name?: string | null;
                    line_items?: Json | null;
                    original_completion_date?: string | null;
                    status?: string | null;
                    total_amount?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "invoices_job_id_fkey";
                        columns: ["job_id"];
                        isOneToOne: false;
                        referencedRelation: "jobs";
                        referencedColumns: ["id"];
                    }
                ];
            };
            deprecated_invoices: {
                Row: {
                    business_info: Json | null;
                    created_at: string | null;
                    customer_address: string | null;
                    customer_email: string | null;
                    customer_name: string | null;
                    customer_phone: string | null;
                    deprecated_at: string | null;
                    due_date: string | null;
                    due_time: string | null;
                    id: string | null;
                    is_deprecated: boolean | null;
                    job_description: string | null;
                    job_id: number | null;
                    job_name: string | null;
                    line_items: Json | null;
                    original_completion_date: string | null;
                    status: string | null;
                    total_amount: number | null;
                };
                Insert: {
                    business_info?: Json | null;
                    created_at?: string | null;
                    customer_address?: string | null;
                    customer_email?: string | null;
                    customer_name?: string | null;
                    customer_phone?: string | null;
                    deprecated_at?: string | null;
                    due_date?: string | null;
                    due_time?: string | null;
                    id?: string | null;
                    is_deprecated?: boolean | null;
                    job_description?: string | null;
                    job_id?: number | null;
                    job_name?: string | null;
                    line_items?: Json | null;
                    original_completion_date?: string | null;
                    status?: string | null;
                    total_amount?: number | null;
                };
                Update: {
                    business_info?: Json | null;
                    created_at?: string | null;
                    customer_address?: string | null;
                    customer_email?: string | null;
                    customer_name?: string | null;
                    customer_phone?: string | null;
                    deprecated_at?: string | null;
                    due_date?: string | null;
                    due_time?: string | null;
                    id?: string | null;
                    is_deprecated?: boolean | null;
                    job_description?: string | null;
                    job_id?: number | null;
                    job_name?: string | null;
                    line_items?: Json | null;
                    original_completion_date?: string | null;
                    status?: string | null;
                    total_amount?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "invoices_job_id_fkey";
                        columns: ["job_id"];
                        isOneToOne: false;
                        referencedRelation: "jobs";
                        referencedColumns: ["id"];
                    }
                ];
            };
            invoice_summary: {
                Row: {
                    active_invoices: number | null;
                    deprecated_invoices: number | null;
                    total_active_amount: number | null;
                    total_all_amount: number | null;
                    total_invoices: number | null;
                };
                Relationships: [];
            };
        };
        Functions: {
            calculate_milestone_total_cost: {
                Args: {
                    milestone_id_param: string;
                };
                Returns: number;
            };
            calculate_milestone_total_time: {
                Args: {
                    milestone_id_param: string;
                };
                Returns: number;
            };
            calculate_total_project_amount: {
                Args: {
                    job_id_param: number;
                };
                Returns: number;
            };
            cleanup_expired_secure_hashes: {
                Args: Record<PropertyKey, never>;
                Returns: undefined;
            };
            create_milestone_approval: {
                Args: {
                    approval_type_param: string;
                    customer_email_param: string;
                    expires_in_days?: number;
                    milestone_id_param: string;
                };
                Returns: string;
            };
            expire_estimates_job: {
                Args: Record<PropertyKey, never>;
                Returns: undefined;
            };
            generate_approval_token: {
                Args: Record<PropertyKey, never>;
                Returns: string;
            };
            gtrgm_compress: {
                Args: {
                    "": unknown;
                };
                Returns: unknown;
            };
            gtrgm_decompress: {
                Args: {
                    "": unknown;
                };
                Returns: unknown;
            };
            gtrgm_in: {
                Args: {
                    "": unknown;
                };
                Returns: unknown;
            };
            gtrgm_options: {
                Args: {
                    "": unknown;
                };
                Returns: undefined;
            };
            gtrgm_out: {
                Args: {
                    "": unknown;
                };
                Returns: unknown;
            };
            increment_hits: {
                Args: {
                    row_id: string;
                };
                Returns: undefined;
            };
            process_milestone_approval: {
                Args: {
                    approved_param: boolean;
                    notes_param?: string;
                    token_param: string;
                };
                Returns: boolean;
            };
            set_limit: {
                Args: {
                    "": number;
                };
                Returns: number;
            };
            show_limit: {
                Args: Record<PropertyKey, never>;
                Returns: number;
            };
            show_trgm: {
                Args: {
                    "": string;
                };
                Returns: string[];
            };
        };
        Enums: {
            estimate_status: "draft" | "sent" | "accepted" | "declined" | "expired";
            property_status: "rented" | "empty" | "owner_finance" | "lease_purchase";
            property_type: "house" | "singlewide" | "doublewide" | "land" | "loan";
            slot_transform_kind: "trim" | "lower" | "title" | "digits_only" | "money_2dp" | "regex_replace" | "map" | "email_lower" | "date_roll_forward_if_past";
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};
type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];
export type Tables<DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"]) : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
    Row: infer R;
} ? R : never : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
    Row: infer R;
} ? R : never : never;
export type TablesInsert<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I;
} ? I : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I;
} ? I : never : never;
export type TablesUpdate<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U;
} ? U : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U;
} ? U : never : never;
export type Enums<DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | {
    schema: keyof DatabaseWithoutInternals;
}, EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"] : never = never> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName] : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions] : never;
export type CompositeTypes<PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | {
    schema: keyof DatabaseWithoutInternals;
}, CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"] : never = never> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName] : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions] : never;
export declare const Constants: {
    readonly public: {
        readonly Enums: {
            readonly estimate_status: readonly ["draft", "sent", "accepted", "declined", "expired"];
            readonly property_status: readonly ["rented", "empty", "owner_finance", "lease_purchase"];
            readonly property_type: readonly ["house", "singlewide", "doublewide", "land", "loan"];
            readonly slot_transform_kind: readonly ["trim", "lower", "title", "digits_only", "money_2dp", "regex_replace", "map", "email_lower", "date_roll_forward_if_past"];
        };
    };
};
export {};
