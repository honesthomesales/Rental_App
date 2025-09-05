-- Test version of RENT_generate_periods function
-- This is a simpler version to test if the function can be created

CREATE OR REPLACE FUNCTION RENT_generate_periods(p_lease_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    lease_record RECORD;
    period_count INTEGER := 0;
BEGIN
    -- Get lease details
    SELECT 
        id, tenant_id, property_id, rent, rent_cadence, rent_due_day,
        lease_start_date, lease_end_date, late_fee_amount
    INTO lease_record
    FROM RENT_leases 
    WHERE id = p_lease_id;
    
    -- Check if lease exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lease with id % not found', p_lease_id;
    END IF;
    
    -- Delete existing periods for this lease
    DELETE FROM RENT_rent_periods WHERE lease_id = p_lease_id;
    
    -- For now, just create one test period
    INSERT INTO RENT_rent_periods (
        id,
        lease_id,
        tenant_id,
        property_id,
        period_due_date,
        rent_amount,
        rent_cadence,
        late_fee_amount,
        status,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        lease_record.id,
        lease_record.tenant_id,
        lease_record.property_id,
        lease_record.lease_start_date,
        lease_record.rent,
        lease_record.rent_cadence,
        COALESCE(lease_record.late_fee_amount, 0),
        'unpaid',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Test: Generated 1 period for lease %', p_lease_id;
    
END;
$$;
