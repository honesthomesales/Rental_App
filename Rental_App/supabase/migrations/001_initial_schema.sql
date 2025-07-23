-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE property_type AS ENUM ('house', 'singlewide', 'doublewide');
CREATE TYPE property_status AS ENUM ('rented', 'empty', 'owner_finance', 'lease_purchase');
CREATE TYPE transaction_type AS ENUM ('rent_payment', 'loan_payment', 'property_sale', 'property_purchase', 'expense', 'income');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE late_status AS ENUM ('on_time', 'late_5_days', 'late_10_days', 'eviction_notice');

-- Properties table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    property_type property_type NOT NULL,
    status property_status DEFAULT 'empty',
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    square_feet INTEGER,
    year_built INTEGER,
    purchase_price DECIMAL(12,2),
    purchase_date DATE,
    current_value DECIMAL(12,2),
    monthly_rent DECIMAL(10,2),
    is_for_sale BOOLEAN DEFAULT FALSE,
    is_for_rent BOOLEAN DEFAULT TRUE,
    insurance_policy_number VARCHAR(100),
    insurance_provider VARCHAR(100),
    insurance_expiry_date DATE,
    insurance_premium DECIMAL(10,2),
    owner_name VARCHAR(255),
    owner_phone VARCHAR(20),
    owner_email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    move_in_date DATE,
    lease_start_date DATE,
    lease_end_date DATE,
    monthly_rent DECIMAL(10,2),
    security_deposit DECIMAL(10,2),
    lease_pdf_url TEXT,
    payment_history JSONB DEFAULT '[]',
    late_fees_owed DECIMAL(10,2) DEFAULT 0,
    late_status late_status DEFAULT 'on_time',
    last_payment_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank accounts table
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50),
    routing_number VARCHAR(20),
    bank_name VARCHAR(255),
    account_type VARCHAR(50),
    current_balance DECIMAL(12,2) DEFAULT 0,
    outstanding_checks DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loans table
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    lender_name VARCHAR(255) NOT NULL,
    loan_number VARCHAR(100),
    original_amount DECIMAL(12,2) NOT NULL,
    current_balance DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,4),
    monthly_payment DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    payment_day INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    loan_id UUID REFERENCES loans(id) ON DELETE SET NULL,
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    transaction_type transaction_type NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL,
    payment_status payment_status DEFAULT 'completed',
    invoice_image_url TEXT,
    extracted_amount DECIMAL(12,2),
    check_image_url TEXT,
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scraped payments table (temporary holding)
CREATE TABLE scraped_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(50) NOT NULL, -- 'gmail', 'sms', 'cashapp'
    raw_data JSONB NOT NULL,
    extracted_amount DECIMAL(12,2),
    extracted_date DATE,
    sender_name VARCHAR(255),
    sender_email VARCHAR(255),
    sender_phone VARCHAR(20),
    description TEXT,
    is_processed BOOLEAN DEFAULT FALSE,
    proposed_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    proposed_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    proposed_transaction_type transaction_type,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_properties_city_state ON properties(city, state);
CREATE INDEX idx_properties_for_rent ON properties(is_for_rent) WHERE is_for_rent = TRUE;
CREATE INDEX idx_properties_for_sale ON properties(is_for_sale) WHERE is_for_sale = TRUE;
CREATE INDEX idx_tenants_property_id ON tenants(property_id);
CREATE INDEX idx_tenants_active ON tenants(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_tenants_late_status ON tenants(late_status);
CREATE INDEX idx_transactions_property_id ON transactions(property_id);
CREATE INDEX idx_transactions_tenant_id ON transactions(tenant_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_scraped_payments_processed ON scraped_payments(is_processed) WHERE is_processed = FALSE;
CREATE INDEX idx_scraped_payments_source ON scraped_payments(source);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 