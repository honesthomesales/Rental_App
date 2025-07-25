-- Seed data for rental management app

-- Insert sample properties
INSERT INTO properties (name, address, city, state, zip_code, property_type, status, bedrooms, bathrooms, square_feet, year_built, purchase_price, purchase_date, current_value, monthly_rent, is_for_rent, is_for_sale, insurance_policy_number, insurance_provider, insurance_expiry_date, insurance_premium, owner_name, owner_phone, owner_email, notes) VALUES
('Sunset Mobile Home Park Lot 101', '123 Main St, Lot 101', 'Austin', 'TX', '78701', 'singlewide', 'rented', 2, 1.0, 1000, 2015, 250000.00, '2020-03-15', 280000.00, 1800.00, true, false, 'POL-001-2024', 'State Farm', '2024-12-31', 1200.00, 'John Smith', '512-555-0101', 'john@example.com', 'Great location near downtown'),
('Oak Ridge House', '456 Oak Ridge Dr', 'Austin', 'TX', '78703', 'house', 'rented', 3, 2.5, 2100, 2010, 450000.00, '2019-07-20', 520000.00, 2800.00, true, false, 'POL-002-2024', 'Allstate', '2024-11-30', 1800.00, 'John Smith', '512-555-0101', 'john@example.com', 'Beautiful oak trees in backyard'),
('Riverside Doublewide', '789 Riverside Blvd, Lot 5B', 'Austin', 'TX', '78701', 'doublewide', 'owner_finance', 3, 2.0, 1800, 2018, 320000.00, '2021-01-10', 350000.00, 2200.00, true, false, 'POL-003-2024', 'Liberty Mutual', '2024-10-15', 900.00, 'John Smith', '512-555-0101', 'john@example.com', 'Spacious doublewide with great views'),
('Mobile Home Park Lot 15', '321 Park Ave, Lot 15', 'Austin', 'TX', '78704', 'singlewide', 'empty', 2, 1.5, 1200, 2005, 180000.00, '2018-11-05', 220000.00, 1400.00, true, false, 'POL-004-2024', 'Farmers', '2024-09-30', 800.00, 'John Smith', '512-555-0101', 'john@example.com', 'Affordable singlewide in quiet park');

-- Insert sample bank accounts
INSERT INTO bank_accounts (name, account_number, routing_number, bank_name, account_type, current_balance, outstanding_checks, notes) VALUES
('Main Operating Account', '1234567890', '021000021', 'Chase Bank', 'checking', 45000.00, 2500.00, 'Primary account for rental income and expenses'),
('Savings Account', '0987654321', '021000021', 'Chase Bank', 'savings', 125000.00, 0.00, 'Emergency fund and property purchase savings'),
('Property Management Account', '1122334455', '021000021', 'Chase Bank', 'checking', 15000.00, 800.00, 'Dedicated account for property management expenses');

-- Insert sample loans
INSERT INTO loans (property_id, lender_name, loan_number, original_amount, current_balance, interest_rate, monthly_payment, start_date, end_date, payment_day, notes) VALUES
((SELECT id FROM properties WHERE name = 'Oak Ridge House'), 'Wells Fargo', 'WF-2020-001', 360000.00, 320000.00, 0.0375, 1850.00, '2019-07-20', '2049-07-20', 1, '30-year fixed rate mortgage'),
((SELECT id FROM properties WHERE name = 'Downtown Condo'), 'Bank of America', 'BOA-2021-002', 256000.00, 240000.00, 0.0325, 1200.00, '2021-01-10', '2051-01-10', 10, '30-year fixed rate mortgage');

-- Insert sample tenants
INSERT INTO tenants (property_id, first_name, last_name, email, phone, emergency_contact_name, emergency_contact_phone, move_in_date, lease_start_date, lease_end_date, monthly_rent, security_deposit, payment_history, late_fees_owed, late_status, last_payment_date, notes, is_active) VALUES
((SELECT id FROM properties WHERE name = 'Sunset Mobile Home Park Lot 101'), 'Sarah', 'Johnson', 'sarah.johnson@email.com', '512-555-0201', 'Mike Johnson', '512-555-0202', '2023-06-01', '2023-06-01', '2024-05-31', 1800.00, 1800.00, '[{"date": "2024-01-01", "amount": 1800.00, "status": "completed"}, {"date": "2024-02-01", "amount": 1800.00, "status": "completed"}]'::jsonb, 0.00, 'on_time', '2024-02-01', 'Great tenant, always pays on time', true),
((SELECT id FROM properties WHERE name = 'Oak Ridge House'), 'David', 'Chen', 'david.chen@email.com', '512-555-0301', 'Lisa Chen', '512-555-0302', '2023-08-15', '2023-08-15', '2024-08-14', 2800.00, 2800.00, '[{"date": "2024-01-01", "amount": 2800.00, "status": "completed"}, {"date": "2024-02-01", "amount": 2800.00, "status": "completed"}]'::jsonb, 0.00, 'on_time', '2024-02-01', 'Family with two kids, very responsible', true),
((SELECT id FROM properties WHERE name = 'Riverside Doublewide'), 'Emily', 'Rodriguez', 'emily.rodriguez@email.com', '512-555-0401', 'Carlos Rodriguez', '512-555-0402', '2023-09-01', '2023-09-01', '2024-08-31', 2200.00, 2200.00, '[{"date": "2024-01-01", "amount": 2200.00, "status": "completed"}, {"date": "2024-02-01", "amount": 2200.00, "status": "completed"}]'::jsonb, 0.00, 'on_time', '2024-02-01', 'Young professional, works downtown', true),
((SELECT id FROM properties WHERE name = 'Mobile Home Park Lot 15'), 'ABC Coffee Shop', 'ABC Coffee', 'manager@abccoffee.com', '512-555-0501', 'Maria Garcia', '512-555-0502', '2023-03-01', '2023-03-01', '2025-02-28', 1400.00, 2800.00, '[{"date": "2024-01-01", "amount": 1400.00, "status": "completed"}, {"date": "2024-02-01", "amount": 1400.00, "status": "completed"}]'::jsonb, 0.00, 'on_time', '2024-02-01', 'Commercial tenant, 2-year lease', true);

-- Insert sample transactions
INSERT INTO transactions (property_id, tenant_id, loan_id, bank_account_id, transaction_type, amount, description, transaction_date, payment_status, reference_number, notes) VALUES
((SELECT id FROM properties WHERE name = 'Sunset Mobile Home Park Lot 101'), (SELECT id FROM tenants WHERE first_name = 'Sarah' AND last_name = 'Johnson'), NULL, (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'rent_payment', 1800.00, 'January 2024 rent payment', '2024-01-01', 'completed', 'RENT-2024-01-001', 'On-time payment'),
((SELECT id FROM properties WHERE name = 'Sunset Mobile Home Park Lot 101'), (SELECT id FROM tenants WHERE first_name = 'Sarah' AND last_name = 'Johnson'), NULL, (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'rent_payment', 1800.00, 'February 2024 rent payment', '2024-02-01', 'completed', 'RENT-2024-02-001', 'On-time payment'),
((SELECT id FROM properties WHERE name = 'Oak Ridge House'), (SELECT id FROM tenants WHERE first_name = 'David' AND last_name = 'Chen'), NULL, (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'rent_payment', 2800.00, 'January 2024 rent payment', '2024-01-01', 'completed', 'RENT-2024-01-002', 'On-time payment'),
((SELECT id FROM properties WHERE name = 'Oak Ridge House'), (SELECT id FROM tenants WHERE first_name = 'David' AND last_name = 'Chen'), NULL, (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'rent_payment', 2800.00, 'February 2024 rent payment', '2024-02-01', 'completed', 'RENT-2024-02-002', 'On-time payment'),
((SELECT id FROM properties WHERE name = 'Riverside Doublewide'), (SELECT id FROM tenants WHERE first_name = 'Emily' AND last_name = 'Rodriguez'), NULL, (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'rent_payment', 2200.00, 'January 2024 rent payment', '2024-01-01', 'completed', 'RENT-2024-01-003', 'On-time payment'),
((SELECT id FROM properties WHERE name = 'Riverside Doublewide'), (SELECT id FROM tenants WHERE first_name = 'Emily' AND last_name = 'Rodriguez'), NULL, (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'rent_payment', 2200.00, 'February 2024 rent payment', '2024-02-01', 'completed', 'RENT-2024-02-003', 'On-time payment'),
((SELECT id FROM properties WHERE name = 'Mobile Home Park Lot 15'), (SELECT id FROM tenants WHERE first_name = 'ABC Coffee Shop'), NULL, (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'rent_payment', 1400.00, 'January 2024 rent payment', '2024-01-01', 'completed', 'RENT-2024-01-004', 'Commercial rent payment'),
((SELECT id FROM properties WHERE name = 'Mobile Home Park Lot 15'), (SELECT id FROM tenants WHERE first_name = 'ABC Coffee Shop'), NULL, (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'rent_payment', 1400.00, 'February 2024 rent payment', '2024-02-01', 'completed', 'RENT-2024-02-004', 'Commercial rent payment'),
(NULL, NULL, (SELECT id FROM loans WHERE loan_number = 'WF-2020-001'), (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'loan_payment', 1850.00, 'January 2024 mortgage payment', '2024-01-01', 'completed', 'LOAN-2024-01-001', 'Wells Fargo mortgage payment'),
(NULL, NULL, (SELECT id FROM loans WHERE loan_number = 'WF-2020-001'), (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'loan_payment', 1850.00, 'February 2024 mortgage payment', '2024-02-01', 'completed', 'LOAN-2024-02-001', 'Wells Fargo mortgage payment'),
(NULL, NULL, (SELECT id FROM loans WHERE loan_number = 'BOA-2021-002'), (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'loan_payment', 1200.00, 'January 2024 mortgage payment', '2024-01-10', 'completed', 'LOAN-2024-01-002', 'Bank of America mortgage payment'),
(NULL, NULL, (SELECT id FROM loans WHERE loan_number = 'BOA-2021-002'), (SELECT id FROM bank_accounts WHERE name = 'Main Operating Account'), 'loan_payment', 1200.00, 'February 2024 mortgage payment', '2024-02-10', 'completed', 'LOAN-2024-02-002', 'Bank of America mortgage payment');

-- Insert sample scraped payments
INSERT INTO scraped_payments (source, raw_data, extracted_amount, extracted_date, sender_name, sender_email, sender_phone, description, is_processed, proposed_property_id, proposed_tenant_id, proposed_transaction_type, confidence_score) VALUES
('gmail', '{"subject": "Rent Payment - Sarah Johnson", "body": "Hi, I sent the rent payment for March. Please confirm receipt.", "from": "sarah.johnson@email.com"}', 1800.00, '2024-03-01', 'Sarah Johnson', 'sarah.johnson@email.com', NULL, 'March 2024 rent payment from Sarah Johnson', false, (SELECT id FROM properties WHERE name = 'Sunset Apartments Unit 101'), (SELECT id FROM tenants WHERE first_name = 'Sarah' AND last_name = 'Johnson'), 'rent_payment', 0.95),
('sms', '{"message": "Sent $2800 for March rent. -David", "from": "+15125550301"}', 2800.00, '2024-03-01', 'David Chen', NULL, '512-555-0301', 'March 2024 rent payment from David Chen', false, (SELECT id FROM properties WHERE name = 'Oak Ridge House'), (SELECT id FROM tenants WHERE first_name = 'David' AND last_name = 'Chen'), 'rent_payment', 0.90),
('cashapp', '{"note": "March rent", "amount": 2200, "sender": "emily.r"}', 2200.00, '2024-03-01', 'Emily Rodriguez', NULL, NULL, 'March 2024 rent payment from Emily Rodriguez', false, (SELECT id FROM properties WHERE name = 'Downtown Condo'), (SELECT id FROM tenants WHERE first_name = 'Emily' AND last_name = 'Rodriguez'), 'rent_payment', 0.85); 

-- Query to find property by address and get its ID
-- Replace '123 Main St' with the actual property address you're looking for
SELECT id, address, monthly_rent 
FROM properties 
WHERE address ILIKE '%123 Main St%'
LIMIT 1;

-- Insert tenant using property_id from the query above
-- Replace 'property_id_here' with the actual property ID from the query above
INSERT INTO tenants (
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
INSERT INTO tenants (
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
FROM properties p
WHERE p.address ILIKE '%123 Main St%'
LIMIT 1;

-- Bulk insert multiple tenants for the same property
-- First get the property ID
WITH property_lookup AS (
    SELECT id, address, monthly_rent 
    FROM properties 
    WHERE address ILIKE '%123 Main St%'
    LIMIT 1
)
INSERT INTO tenants (
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
FROM properties p
LEFT JOIN tenants t ON p.id = t.property_id AND t.first_name IS NOT NULL AND t.first_name != ''
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
FROM properties 
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