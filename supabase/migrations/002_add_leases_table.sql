-- Add leases table
CREATE TABLE RENT_leases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES RENT_properties(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES RENT_tenants(id) ON DELETE CASCADE,
    lease_start_date DATE NOT NULL,
    lease_end_date DATE NOT NULL,
    rent DECIMAL(10,2) NOT NULL,
    rent_cadence VARCHAR(20) DEFAULT 'monthly',
    move_in_fee DECIMAL(10,2) DEFAULT 0,
    late_fee_amount DECIMAL(10,2) DEFAULT 0,
    lease_pdf TEXT,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for leases table
CREATE INDEX idx_leases_property_id ON RENT_leases(property_id);
CREATE INDEX idx_leases_tenant_id ON RENT_leases(tenant_id);
CREATE INDEX idx_leases_status ON RENT_leases(status);
CREATE INDEX idx_leases_dates ON RENT_leases(lease_start_date, lease_end_date);

-- Create trigger for updated_at
CREATE TRIGGER update_leases_updated_at BEFORE UPDATE ON RENT_leases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 