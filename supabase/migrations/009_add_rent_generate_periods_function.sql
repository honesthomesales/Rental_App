-- Create RENT_generate_periods RPC function
-- This function generates rent periods for a given lease based on its cadence and due day

CREATE OR REPLACE FUNCTION RENT_generate_periods(p_lease_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    lease_record RECORD;
    current_period_date DATE;
    period_due_date DATE;
    period_end_date DATE;
    period_count INTEGER := 0;
    max_periods INTEGER := 100; -- Safety limit
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
    
    -- Delete existing periods for this lease (regenerate)
    DELETE FROM RENT_rent_periods WHERE lease_id = p_lease_id;
    
    -- Set current period date to lease start date
    current_period_date := lease_record.lease_start_date;
    
    -- Generate periods based on cadence
    WHILE current_period_date <= lease_record.lease_end_date AND period_count < max_periods LOOP
        period_count := period_count + 1;
        
        -- Calculate due date based on cadence
        IF lease_record.rent_cadence = 'monthly' THEN
            -- Monthly: due on specified day of month
            period_due_date := DATE_TRUNC('month', current_period_date) + INTERVAL '1 month' - INTERVAL '1 day';
            period_due_date := LEAST(period_due_date, lease_record.lease_end_date);
            
            -- Adjust to the correct day of month
            IF lease_record.rent_due_day IS NOT NULL THEN
                period_due_date := DATE_TRUNC('month', period_due_date) + INTERVAL '1 day' * (lease_record.rent_due_day - 1);
                -- If the day doesn't exist in the month, use the last day
                IF EXTRACT(DAY FROM period_due_date) != lease_record.rent_due_day THEN
                    period_due_date := DATE_TRUNC('month', period_due_date) + INTERVAL '1 month' - INTERVAL '1 day';
                END IF;
            END IF;
            
            -- Set next period start date
            current_period_date := period_due_date + INTERVAL '1 day';
            
        ELSIF lease_record.rent_cadence = 'weekly' THEN
            -- Weekly: due on Friday
            period_due_date := current_period_date;
            -- Find next Friday
            WHILE EXTRACT(DOW FROM period_due_date) != 5 LOOP
                period_due_date := period_due_date + INTERVAL '1 day';
            END LOOP;
            period_due_date := LEAST(period_due_date, lease_record.lease_end_date);
            
            -- Set next period start date (next day after Friday)
            current_period_date := period_due_date + INTERVAL '1 day';
            
        ELSIF lease_record.rent_cadence = 'biweekly' THEN
            -- Bi-weekly: due on Friday every 2 weeks
            period_due_date := current_period_date;
            -- Find next Friday
            WHILE EXTRACT(DOW FROM period_due_date) != 5 LOOP
                period_due_date := period_due_date + INTERVAL '1 day';
            END LOOP;
            period_due_date := LEAST(period_due_date, lease_record.lease_end_date);
            
            -- Set next period start date (2 weeks after current Friday)
            current_period_date := period_due_date + INTERVAL '2 weeks' + INTERVAL '1 day';
        END IF;
        
        -- Skip if due date is beyond lease end
        IF period_due_date > lease_record.lease_end_date THEN
            EXIT;
        END IF;
        
        -- Insert the period
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
            period_due_date,
            lease_record.rent,
            lease_record.rent_cadence,
            COALESCE(lease_record.late_fee_amount, 0),
            'unpaid',
            NOW(),
            NOW()
        );
        
    END LOOP;
    
    -- Log success
    RAISE NOTICE 'Generated % periods for lease %', period_count, p_lease_id;
    
END;
$$;
