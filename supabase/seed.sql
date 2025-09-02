-- Seed data for rental management app

-- Insert sample properties
INSERT INTO RENT_properties (name, address, city, state, zip_code, property_type, status, bedrooms, bathrooms, square_feet, year_built, purchase_price, purchase_date, current_value, monthly_rent, is_for_rent, is_for_sale, insurance_policy_number, insurance_provider, insurance_expiry_date, insurance_premium, owner_name, owner_phone, owner_email, notes) VALUES
('Sunset Mobile Home Park Lot 101', '101 Sunset Blvd, Austin, TX 78701', 'Austin', 'TX', '78701', 'singlewide', 'rented', 2, 1.0, 800, 1995, 45000.00, '2020-03-15', 55000.00, 1800.00, true, false, 'POL-001', 'State Farm', '2025-12-31', 1200.00, 'John Smith', '512-555-0101', 'john.smith@email.com', 'Mobile home on rented lot'),
('Oak Ridge House', '123 Oak Ridge Dr, Austin, TX 78702', 'Austin', 'TX', '78702', 'house', 'rented', 3, 2.5, 2200, 2010, 350000.00, '2019-07-20', 420000.00, 2800.00, true, false, 'POL-002', 'Allstate', '2025-06-30', 1800.00, 'John Smith', '512-555-0101', 'john.smith@email.com', 'Family home in quiet neighborhood'),
('Riverside Doublewide', '456 Riverside Ave, Austin, TX 78703', 'Austin', 'TX', '78703', 'doublewide', 'rented', 4, 2.0, 1800, 2005, 120000.00, '2021-01-10', 140000.00, 2200.00, true, false, 'POL-003', 'Farmers', '2025-09-15', 900.00, 'John Smith', '512-555-0101', 'john.smith@email.com', 'Doublewide mobile home'),
('Mobile Home Park Lot 15', '15 Park Circle, Austin, TX 78704', 'Austin', 'TX', '78704', 'singlewide', 'rented', 1, 1.0, 600, 1990, 35000.00, '2022-05-01', 40000.00, 1400.00, true, false, 'POL-004', 'Liberty Mutual', '2025-03-20', 800.00, 'John Smith', '512-555-0101', 'john.smith@email.com', 'Small mobile home, commercial tenant'),
('Downtown Condo', '789 Downtown St, Austin, TX 78705', 'Austin', 'TX', '78705', 'house', 'empty', 2, 2.0, 1200, 2015, 250000.00, '2021-08-15', 280000.00, 2000.00, true, true, 'POL-005', 'Progressive', '2025-11-10', 1200.00, 'John Smith', '512-555-0101', 'john.smith@email.com', 'Downtown condo for sale');

-- Insert sample bank accounts
INSERT INTO bank_accounts (name, account_number, routing_number, bank_name, account_type, current_balance, outstanding_checks, notes) VALUES
('Main Operating Account', '1234567890', '021000021', 'Chase Bank', 'checking', 45000.00, 2500.00, 'Primary account for rental income and expenses'),
('Savings Account', '0987654321', '021000021', 'Chase Bank', 'savings', 125000.00, 0.00, 'Emergency fund and property purchase savings'),
('Property Management Account', '1122334455', '021000021', 'Chase Bank', 'checking', 15000.00, 800.00, 'Dedicated account for property management expenses');

-- Insert sample loans
INSERT INTO loans (property_id, lender_name, loan_number, original_amount, current_balance, interest_rate, monthly_payment, start_date, end_date, payment_day, notes) VALUES
((SELECT id FROM RENT_properties WHERE name = 'Oak Ridge House'), 'Wells Fargo', 'WF-2020-001', 360000.00, 320000.00, 0.0375, 1850.00, '2019-07-20', '2049-07-20', 1, '30-year fixed rate mortgage'),
((SELECT id FROM RENT_properties WHERE name = 'Downtown Condo'), 'Bank of America', 'BOA-2021-002', 256000.00, 240000.00, 0.0325, 1200.00, '2021-01-10', '2051-01-10', 10, '30-year fixed rate mortgage');

-- Insert sample tenants
INSERT INTO RENT_tenants (property_id, first_name, last_name, email, phone, emergency_contact_name, emergency_contact_phone, lease_start_date, lease_end_date, monthly_rent, security_deposit, payment_history, late_fees_owed, late_status, last_payment_date, notes, is_active) VALUES
((SELECT id FROM RENT_properties WHERE name = 'Sunset Mobile Home Park Lot 101'), 'Sarah', 'Johnson', 'sarah.johnson@email.com', '512-555-0201', 'Mike Johnson', '512-555-0202', '2024-01-23', '2030-01-01', 1800.00, 1800.00, '[{"date": "2024-01-01", "amount": 1800.00, "status": "completed"}, {"date": "2024-02-01", "amount": 1800.00, "status": "completed"}]'::jsonb, 0.00, 'on_time', '2024-02-01', 'Reliable tenant, always pays on time', true),
((SELECT id FROM RENT_properties WHERE name = 'Oak Ridge House'), 'David', 'Chen', 'david.chen@email.com', '512-555-0301', 'Lisa Chen', '512-555-0302', '2024-01-23', '2030-01-01', 2800.00, 2800.00, '[{"date": "2024-01-01", "amount": 2800.00, "status": "completed"}, {"date": "2024-02-01", "amount": 2800.00, "status": "completed"}]'::jsonb, 0.00, 'on_time', '2024-02-01', 'Professional tenant, works from home', true),
((SELECT id FROM RENT_properties WHERE name = 'Riverside Doublewide'), 'Emily', 'Rodriguez', 'emily.rodriguez@email.com', '512-555-0401', 'Carlos Rodriguez', '512-555-0402', '2024-01-23', '2030-01-01', 2200.00, 2200.00, '[{"date": "2024-01-01", "amount": 2200.00, "status": "completed"}, {"date": "2024-02-01", "amount": 2200.00, "status": "completed"}]'::jsonb, 0.00, 'on_time', '2024-02-01', 'Family with 2 kids, very quiet', true),
((SELECT id FROM RENT_properties WHERE name = 'Mobile Home Park Lot 15'), 'ABC Coffee Shop', 'ABC Coffee', 'manager@abccoffee.com', '512-555-0501', 'Maria Garcia', '512-555-0502', '2024-01-23', '2030-01-01', 1400.00, 1400.00, '[{"date": "2024-01-01", "amount": 1400.00, "status": "completed"}, {"date": "2024-02-01", "amount": 1400.00, "status": "completed"}]'::jsonb, 0.00, 'on_time', '2024-02-01', 'Commercial tenant - coffee shop storage', true),
((SELECT id FROM RENT_properties WHERE name = 'Sunset Mobile Home Park Lot 101'), 'Late', 'Tenant', 'late.tenant@email.com', '512-555-0601', 'Emergency Contact', '512-555-0602', '2024-01-23', '2030-01-01', 1800.00, 1800.00, '[]'::jsonb, 0.00, 'late', '2024-01-23', 'Tenant with late payments for testing', true),
((SELECT id FROM RENT_properties WHERE name = 'Riverside Doublewide'), 'Tenisha', 'Williams', 'tenisha.williams@email.com', '512-555-0701', 'John Williams', '512-555-0702', '2024-01-23', '2030-01-01', 2200.00, 2200.00, '[{"date": "2024-08-01", "amount": 1650.00, "status": "completed"}]'::jsonb, 0.00, 'late', '2024-08-01', 'Tenant with partial payment for testing', true);

-- Insert sample transactions
INSERT INTO RENT_transactions (property_id, tenant_id, loan_id, bank_account_id, transaction_type, amount, description, transaction_date, payment_status, reference_number, notes) VALUES
((SELECT id FROM RENT_properties WHERE name = 'Sunset Mobile Home Park Lot 101'), (SELECT id FROM RENT_tenants WHERE first_name = 'Sarah' AND last_name = 'Johnson'), NULL, (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'rent_payment', 1800.00, 'January 2024 rent payment', '2024-01-01', 'completed', 'RENT-2024-01-001', 'On-time payment'),
((SELECT id FROM RENT_properties WHERE name = 'Sunset Mobile Home Park Lot 101'), (SELECT id FROM RENT_tenants WHERE first_name = 'Sarah' AND last_name = 'Johnson'), NULL, (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'rent_payment', 1800.00, 'February 2024 rent payment', '2024-02-01', 'completed', 'RENT-2024-02-001', 'On-time payment'),
((SELECT id FROM RENT_properties WHERE name = 'Oak Ridge House'), (SELECT id FROM RENT_tenants WHERE first_name = 'David' AND last_name = 'Chen'), NULL, (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'rent_payment', 2800.00, 'January 2024 rent payment', '2024-01-01', 'completed', 'RENT-2024-01-002', 'On-time payment'),
((SELECT id FROM RENT_properties WHERE name = 'Oak Ridge House'), (SELECT id FROM RENT_tenants WHERE first_name = 'David' AND last_name = 'Chen'), NULL, (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'rent_payment', 2800.00, 'February 2024 rent payment', '2024-02-01', 'completed', 'RENT-2024-02-002', 'On-time payment'),
((SELECT id FROM RENT_properties WHERE name = 'Riverside Doublewide'), (SELECT id FROM RENT_tenants WHERE first_name = 'Emily' AND last_name = 'Rodriguez'), NULL, (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'rent_payment', 2200.00, 'January 2024 rent payment', '2024-01-01', 'completed', 'RENT-2024-01-003', 'On-time payment'),
((SELECT id FROM RENT_properties WHERE name = 'Riverside Doublewide'), (SELECT id FROM RENT_tenants WHERE first_name = 'Emily' AND last_name = 'Rodriguez'), NULL, (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'rent_payment', 2200.00, 'February 2024 rent payment', '2024-02-01', 'completed', 'RENT-2024-02-003', 'On-time payment'),
((SELECT id FROM RENT_properties WHERE name = 'Mobile Home Park Lot 15'), (SELECT id FROM RENT_tenants WHERE first_name = 'ABC Coffee Shop'), NULL, (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'rent_payment', 1400.00, 'January 2024 rent payment', '2024-01-01', 'completed', 'RENT-2024-01-004', 'Commercial rent payment'),
((SELECT id FROM RENT_properties WHERE name = 'Mobile Home Park Lot 15'), (SELECT id FROM RENT_tenants WHERE first_name = 'ABC Coffee Shop'), NULL, (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'rent_payment', 1400.00, 'February 2024 rent payment', '2024-02-01', 'completed', 'RENT-2024-02-004', 'Commercial rent payment'),
(NULL, NULL, (SELECT id FROM loans WHERE loan_number = 'WF-2020-001'), (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'loan_payment', 1850.00, 'January 2024 mortgage payment', '2024-01-01', 'completed', 'LOAN-2024-01-001', 'Wells Fargo mortgage payment'),
(NULL, NULL, (SELECT id FROM loans WHERE loan_number = 'WF-2020-001'), (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'loan_payment', 1850.00, 'February 2024 mortgage payment', '2024-02-01', 'completed', 'LOAN-2024-02-001', 'Wells Fargo mortgage payment'),
(NULL, NULL, (SELECT id FROM loans WHERE loan_number = 'BOA-2021-002'), (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'loan_payment', 1200.00, 'January 2024 mortgage payment', '2024-01-10', 'completed', 'LOAN-2024-01-002', 'Bank of America mortgage payment'),
(NULL, NULL, (SELECT id FROM loans WHERE loan_number = 'BOA-2021-002'), (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'loan_payment', 1200.00, 'February 2024 mortgage payment', '2024-02-10', 'completed', 'LOAN-2024-02-002', 'Bank of America mortgage payment');

-- Insert lease records for all existing tenants (6 months ago start, 2030 end)
INSERT INTO RENT_leases (tenant_id, property_id, lease_start_date, lease_end_date, rent, rent_cadence, move_in_fee, late_fee_amount, lease_pdf, status, notes) VALUES
((SELECT id FROM RENT_tenants WHERE first_name = 'Sarah' AND last_name = 'Johnson'), (SELECT id FROM RENT_properties WHERE name = 'Sunset Mobile Home Park Lot 101'), '2024-01-23', '2030-01-01', 1800.00, 'weekly', 1800.00, 10.00, NULL, 'active', ''),
((SELECT id FROM RENT_tenants WHERE first_name = 'David' AND last_name = 'Chen'), (SELECT id FROM RENT_properties WHERE name = 'Oak Ridge House'), '2024-01-23', '2030-01-01', 2800.00, 'biweekly', 2800.00, 20.00, NULL, 'active', ''),
((SELECT id FROM RENT_tenants WHERE first_name = 'Emily' AND last_name = 'Rodriguez'), (SELECT id FROM RENT_properties WHERE name = 'Riverside Doublewide'), '2024-01-23', '2030-01-01', 2200.00, 'monthly', 2200.00, 45.00, NULL, 'active', ''),
((SELECT id FROM RENT_tenants WHERE first_name = 'ABC Coffee Shop'), (SELECT id FROM RENT_properties WHERE name = 'Mobile Home Park Lot 15'), '2024-01-23', '2030-01-01', 1400.00, 'monthly', 2800.00, 45.00, NULL, 'active', ''),
((SELECT id FROM RENT_tenants WHERE first_name = 'Late' AND last_name = 'Tenant'), (SELECT id FROM RENT_properties WHERE name = 'Sunset Mobile Home Park Lot 101'), '2024-01-23', '2030-01-01', 1800.00, 'weekly', 1800.00, 10.00, NULL, 'active', '');

-- Insert sample scraped payments
INSERT INTO RENT_scraped_payments (source, raw_data, extracted_amount, extracted_date, sender_name, sender_email, sender_phone, description, is_processed, proposed_property_id, proposed_tenant_id, proposed_transaction_type, confidence_score) VALUES
('gmail', '{"subject": "Rent Payment - Sarah Johnson", "body": "Hi, I sent the rent payment for March. Please confirm receipt.", "from": "sarah.johnson@email.com"}', 1800.00, '2024-03-01', 'Sarah Johnson', 'sarah.johnson@email.com', NULL, 'March 2024 rent payment from Sarah Johnson', false, (SELECT id FROM RENT_properties WHERE name = 'Sunset Apartments Unit 101'), (SELECT id FROM RENT_tenants WHERE first_name = 'Sarah' AND last_name = 'Johnson'), 'rent_payment', 0.95),
('sms', '{"message": "Sent $2800 for March rent. -David", "from": "+15125550301"}', 2800.00, '2024-03-01', 'David Chen', NULL, '512-555-0301', 'March 2024 rent payment from David Chen', false, (SELECT id FROM RENT_properties WHERE name = 'Oak Ridge House'), (SELECT id FROM RENT_tenants WHERE first_name = 'David' AND last_name = 'Chen'), 'rent_payment', 0.90),
('cashapp', '{"note": "March rent", "amount": 2200, "sender": "emily.r"}', 2200.00, '2024-03-01', 'Emily Rodriguez', NULL, NULL, 'March 2024 rent payment from Emily Rodriguez', false, (SELECT id FROM RENT_properties WHERE name = 'Downtown Condo'), (SELECT id FROM RENT_tenants WHERE first_name = 'Emily' AND last_name = 'Rodriguez'), 'rent_payment', 0.85);

-- Populate leases table using properties and tenants as driver
-- Lease start date: 6 months ago (January 2025)
-- Lease end date: January 1, 2030
INSERT INTO RENT_leases (property_id, tenant_id, lease_start_date, lease_end_date, rent, rent_cadence, move_in_fee, late_fee_amount, lease_pdf, status, notes, created_at, updated_at)
SELECT 
    t.property_id,
    t.id as tenant_id,
    '2025-01-15' as lease_start_date,  -- 6 months ago
    '2030-01-01' as lease_end_date,
    t.monthly_rent as rent,
    CASE 
        WHEN p.notes ILIKE '%weekly%' THEN 'weekly'
        WHEN p.notes ILIKE '%bi-weekly%' OR p.notes ILIKE '%biweekly%' THEN 'bi-weekly'
        ELSE 'monthly'
    END as rent_cadence,
    t.security_deposit as move_in_fee,
    CASE 
        WHEN p.notes ILIKE '%weekly%' THEN 10
        WHEN p.notes ILIKE '%bi-weekly%' OR p.notes ILIKE '%biweekly%' THEN 20
        ELSE 45
    END as late_fee_amount,
    NULL as lease_pdf,
    'active' as status,
    '' as notes,
    NOW() as created_at,
    NOW() as updated_at
FROM RENT_tenants t
JOIN RENT_properties p ON t.property_id = p.id
WHERE t.is_active = true;

-- Update tenant lease_start_date to match the new lease records
UPDATE RENT_tenants 
SET 
    lease_start_date = '2024-01-15',  -- 6 months ago
    lease_end_date = '2030-01-01',
    updated_at = NOW()
WHERE is_active = true;

-- Query to find property by address and get its ID
-- Replace '123 Main St' with the actual property address you're looking for
SELECT id, address, monthly_rent 
FROM RENT_properties 
WHERE address ILIKE '%123 Main St%'
LIMIT 1;

-- Insert tenant using property_id from the query above
-- Replace 'property_id_here' with the actual property ID from the query above
INSERT INTO RENT_tenants (
    property_id,
    first_name,
    last_name,
    email,
    phone,
    is_active,
    created_at,
    updated_at
) VALUES (
    'property_id_here',  -- Replace with actual property ID
    'John',
    'Doe',
    'john.doe@email.com',
    '555-123-4567',
    true,
    NOW(),
    NOW()
);

-- Alternative: Single query that finds property and inserts tenant in one go
-- This uses a subquery to get the property_id
INSERT INTO RENT_tenants (
    property_id,
    first_name,
    last_name,
    email,
    phone,
    is_active,
    created_at,
    updated_at
)
SELECT 
    p.id as property_id,
    'John' as first_name,
    'Doe' as last_name,
    'john.doe@email.com' as email,
    '555-123-4567' as phone,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM RENT_properties p
WHERE p.address ILIKE '%123 Main St%'
LIMIT 1;

-- Bulk insert multiple tenants for the same property
-- First get the property ID
WITH property_lookup AS (
    SELECT id, address, monthly_rent 
    FROM RENT_properties 
    WHERE address ILIKE '%123 Main St%'
    LIMIT 1
)
INSERT INTO RENT_tenants (
    property_id,
    first_name,
    last_name,
    email,
    phone,
    is_active,
    created_at,
    updated_at
)
SELECT 
    pl.id as property_id,
    t.first_name,
    t.last_name,
    t.email,
    t.phone,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM property_lookup pl
CROSS JOIN (
    VALUES 
        ('John', 'Doe', 'john.doe@email.com', '555-123-4567'),
        ('Jane', 'Smith', 'jane.smith@email.com', '555-987-6543'),
        ('Bob', 'Johnson', 'bob.johnson@email.com', '555-456-7890')
) AS t(first_name, last_name, email, phone);

-- Complete query to get property IDs and tenant counts for all your addresses
-- This will return property_id, address, monthly_rent, and count of tenants with non-blank first names
SELECT 
    p.id as property_id,
    p.address,
    p.monthly_rent,
    p.name as property_name,
    p.city,
    p.state,
    COUNT(t.id) as tenant_count
FROM RENT_properties p
LEFT JOIN RENT_tenants t ON p.id = t.property_id AND t.first_name IS NOT NULL AND t.first_name != ''
WHERE p.address IN (
    '100 Overbrook St',
    '100 Willis Bell',
    '101 Longstaff Ct',
    '101 Willis Bell',
    '102 Brull St',
    '103 Willis Bell',
    '104 Camp St',
    '1044 Howard St',
    '1044 Howard St nbr 2',
    '105 Willis Bell',
    '107 Willis Bell',
    '109 Hosch Dr',
    '109 Willis Bell',
    '110 McDowell St',
    '111 Willis Bell',
    '114 Willis Bell',
    '115 Green St',
    '118 High St',
    '12 Amy Ct',
    '120 Bowers Worrell',
    '122 Bowers',
    '124 Hall Rd',
    '127 Rowell St',
    '131 N Linda St',
    '132 Branch St',
    '134 Tranquility',
    '1408 Macedonia Rd',
    '141 Griffin',
    '145 Lemans Dr',
    '150 Cleveland St',
    '159 Adams Rd',
    '166 Tullyton Rd',
    '177 Craton St',
    '188 Square St',
    '203 Long Twelve St',
    '213 Mason Rd',
    '220 Cleveland St',
    '243 Artemus Ward',
    '253 Idlewood St',
    '2611 W Springs Hwy',
    '296 Shelter Bay Dr',
    '302 Austin St',
    '303 Granite St',
    '304 Deere Xing',
    '3050 S Livingston St',
    '307 Moorehead St',
    '31 Nutty Dr',
    '313 C St',
    '340 Lake Forest',
    '341 S High Top',
    '351 High St',
    '361 High Bottom St',
    '37 Caroline St',
    '405 Holland Mem Church Rd',
    '407 Bonner Rd',
    '407 Holland Mem Church Rd',
    '409 Holland Mem Church Rd',
    '411 Holland Mem Church Rd',
    '419 Holland Mem Church Rd',
    '423 Holland Mem Church Rd',
    '424 Dewberry Rd',
    '425 Holland Mem Church Rd',
    '425 Ridge Rd',
    '429 Holland Mem Church Rd',
    '433 Holland Mem Church Rd',
    '4750 S Pine St',
    '4760 S Pine St',
    '501 Green Willow',
    '504 Grubb St',
    '52 Humility Ln',
    '555 Old Mill Rd',
    '5667 N Main St',
    '601 Capps',
    '605 Capps',
    '609 Capps',
    '61 Nutty Middle St',
    '707 Capps',
    '711 Capps',
    '715 Capps',
    '726 Capps',
    '737 Winn St',
    '741 T Bishop Rd',
    'Weathers Road'
)
GROUP BY p.id, p.address, p.monthly_rent, p.name, p.city, p.state
ORDER BY p.address;

-- Alternative: Use ILIKE for partial matching if exact addresses don't match
-- This is useful if the addresses in your database have slight variations
SELECT 
    id as property_id,
    address,
    monthly_rent,
    name as property_name
FROM RENT_properties 
WHERE 
    address ILIKE '%100 Overbrook St%' OR
    address ILIKE '%100 Willis Bell%' OR
    address ILIKE '%101 Longstaff Ct%' OR
    address ILIKE '%101 Willis Bell%' OR
    address ILIKE '%102 Brull St%' OR
    address ILIKE '%103 Willis Bell%' OR
    address ILIKE '%104 Camp St%' OR
    address ILIKE '%1044 Howard St%' OR
    address ILIKE '%105 Willis Bell%' OR
    address ILIKE '%107 Willis Bell%' OR
    address ILIKE '%109 Hosch Dr%' OR
    address ILIKE '%109 Willis Bell%' OR
    address ILIKE '%110 McDowell St%' OR
    address ILIKE '%111 Willis Bell%' OR
    address ILIKE '%114 Willis Bell%' OR
    address ILIKE '%115 Green St%' OR
    address ILIKE '%118 High St%' OR
    address ILIKE '%12 Amy Ct%' OR
    address ILIKE '%120 Bowers Worrell%' OR
    address ILIKE '%122 Bowers%' OR
    address ILIKE '%124 Hall Rd%' OR
    address ILIKE '%127 Rowell St%' OR
    address ILIKE '%131 N Linda St%' OR
    address ILIKE '%132 Branch St%' OR
    address ILIKE '%134 Tranquility%' OR
    address ILIKE '%1408 Macedonia Rd%' OR
    address ILIKE '%141 Griffin%' OR
    address ILIKE '%145 Lemans Dr%' OR
    address ILIKE '%150 Cleveland St%' OR
    address ILIKE '%159 Adams Rd%' OR
    address ILIKE '%166 Tullyton Rd%' OR
    address ILIKE '%177 Craton St%' OR
    address ILIKE '%188 Square St%' OR
    address ILIKE '%203 Long Twelve St%' OR
    address ILIKE '%213 Mason Rd%' OR
    address ILIKE '%220 Cleveland St%' OR
    address ILIKE '%243 Artemus Ward%' OR
    address ILIKE '%253 Idlewood St%' OR
    address ILIKE '%2611 W Springs Hwy%' OR
    address ILIKE '%296 Shelter Bay Dr%' OR
    address ILIKE '%302 Austin St%' OR
    address ILIKE '%303 Granite St%' OR
    address ILIKE '%304 Deere Xing%' OR
    address ILIKE '%3050 S Livingston St%' OR
    address ILIKE '%307 Moorehead St%' OR
    address ILIKE '%31 Nutty Dr%' OR
    address ILIKE '%313 C St%' OR
    address ILIKE '%340 Lake Forest%' OR
    address ILIKE '%341 S High Top%' OR
    address ILIKE '%351 High St%' OR
    address ILIKE '%361 High Bottom St%' OR
    address ILIKE '%37 Caroline St%' OR
    address ILIKE '%405 Holland Mem Church Rd%' OR
    address ILIKE '%407 Bonner Rd%' OR
    address ILIKE '%407 Holland Mem Church Rd%' OR
    address ILIKE '%409 Holland Mem Church Rd%' OR
    address ILIKE '%411 Holland Mem Church Rd%' OR
    address ILIKE '%419 Holland Mem Church Rd%' OR
    address ILIKE '%423 Holland Mem Church Rd%' OR
    address ILIKE '%424 Dewberry Rd%' OR
    address ILIKE '%425 Holland Mem Church Rd%' OR
    address ILIKE '%425 Ridge Rd%' OR
    address ILIKE '%429 Holland Mem Church Rd%' OR
    address ILIKE '%433 Holland Mem Church Rd%' OR
    address ILIKE '%4750 S Pine St%' OR
    address ILIKE '%4760 S Pine St%' OR
    address ILIKE '%501 Green Willow%' OR
    address ILIKE '%504 Grubb St%' OR
    address ILIKE '%52 Humility Ln%' OR
    address ILIKE '%555 Old Mill Rd%' OR
    address ILIKE '%5667 N Main St%' OR
    address ILIKE '%601 Capps%' OR
    address ILIKE '%605 Capps%' OR
    address ILIKE '%609 Capps%' OR
    address ILIKE '%61 Nutty Middle St%' OR
    address ILIKE '%707 Capps%' OR
    address ILIKE '%711 Capps%' OR
    address ILIKE '%715 Capps%' OR
    address ILIKE '%726 Capps%' OR
    address ILIKE '%737 Winn St%' OR
    address ILIKE '%741 T Bishop Rd%' OR
    address ILIKE '%Weathers Road%'
ORDER BY address; 