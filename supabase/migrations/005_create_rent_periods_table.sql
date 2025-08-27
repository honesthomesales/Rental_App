-- Create RENT_rent_periods table for managing individual rent periods and late fees
CREATE TABLE IF NOT EXISTS RENT_rent_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES RENT_tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES RENT_properties(id) ON DELETE CASCADE,
  lease_id UUID REFERENCES RENT_leases(id) ON DELETE SET NULL,
  period_due_date DATE NOT NULL,
  rent_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  late_fees DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'partial')),
  days_late INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rent_periods_tenant_id ON RENT_rent_periods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rent_periods_property_id ON RENT_rent_periods(property_id);
CREATE INDEX IF NOT EXISTS idx_rent_periods_lease_id ON RENT_rent_periods(lease_id);
CREATE INDEX IF NOT EXISTS idx_rent_periods_period_due_date ON RENT_rent_periods(period_due_date);
CREATE INDEX IF NOT EXISTS idx_rent_periods_status ON RENT_rent_periods(status);
CREATE INDEX IF NOT EXISTS idx_rent_periods_late_fees ON RENT_rent_periods(late_fees);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_rent_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at timestamp
CREATE TRIGGER trigger_rent_periods_updated_at
  BEFORE UPDATE ON RENT_rent_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_rent_periods_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE RENT_rent_periods ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to view rent periods
CREATE POLICY "Users can view rent periods" ON RENT_rent_periods
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to insert rent periods
CREATE POLICY "Users can insert rent periods" ON RENT_rent_periods
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow authenticated users to update rent periods
CREATE POLICY "Users can update rent periods" ON RENT_rent_periods
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to delete rent periods
CREATE POLICY "Users can delete rent periods" ON RENT_rent_periods
  FOR DELETE USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE RENT_rent_periods IS 'Stores individual rent periods for tenants with late fee tracking';
COMMENT ON COLUMN RENT_rent_periods.period_due_date IS 'The date when rent is due for this period';
COMMENT ON COLUMN RENT_rent_periods.rent_amount IS 'The rent amount due for this period';
COMMENT ON COLUMN RENT_rent_periods.amount_paid IS 'The amount already paid for this period';
COMMENT ON COLUMN RENT_rent_periods.late_fees IS 'Late fees applied to this period (can be waived)';
COMMENT ON COLUMN RENT_rent_periods.status IS 'Payment status: paid, unpaid, or partial';
COMMENT ON COLUMN RENT_rent_periods.days_late IS 'Number of days this period is late';
