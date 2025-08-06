-- Create RENT_other table for storing expenses and income entries
CREATE TABLE IF NOT EXISTS RENT_other (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'income')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on date for efficient filtering
CREATE INDEX IF NOT EXISTS idx_rent_other_date ON RENT_other(date);

-- Create index on type for efficient filtering
CREATE INDEX IF NOT EXISTS idx_rent_other_type ON RENT_other(type);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rent_other_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rent_other_updated_at
    BEFORE UPDATE ON RENT_other
    FOR EACH ROW
    EXECUTE FUNCTION update_rent_other_updated_at(); 