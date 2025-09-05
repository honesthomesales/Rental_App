import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@rental-app/api'
import { RENT_CADENCE, LEASE_STATUS, type RentCadence, type LeaseStatus } from '../../../../src/lib/rentModel'

interface CreateLeaseRequest {
  tenant_id: string
  property_id: string
  rent: number
  rent_cadence: RentCadence
  rent_due_day: number | null
  lease_start_date: string
  lease_end_date: string
  move_in_fee?: number
  late_fee_amount?: number
  lease_pdf_url?: string | null
  status: LeaseStatus
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    const body: CreateLeaseRequest = await request.json()

    // Validate required fields
    if (!body.tenant_id || !body.property_id || !body.rent || 
        !body.lease_start_date || !body.lease_end_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate rent cadence
    if (!RENT_CADENCE.includes(body.rent_cadence)) {
      return NextResponse.json(
        { error: 'Invalid rent cadence' },
        { status: 400 }
      )
    }

    // Validate lease status
    if (!LEASE_STATUS.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid lease status' },
        { status: 400 }
      )
    }

    // Validate rent due day for monthly cadence
    if (body.rent_cadence === 'monthly' && (!body.rent_due_day || (body.rent_due_day !== 1 && body.rent_due_day !== 15))) {
      return NextResponse.json(
        { error: 'Rent due day must be 1 or 15 for monthly cadence' },
        { status: 400 }
      )
    }

    // Validate numeric fields
    if (body.rent < 0) {
      return NextResponse.json(
        { error: 'Rent amount must be positive' },
        { status: 400 }
      )
    }

    if (body.move_in_fee !== undefined && body.move_in_fee < 0) {
      return NextResponse.json(
        { error: 'Move-in fee must be positive' },
        { status: 400 }
      )
    }

    if (body.late_fee_amount !== undefined && body.late_fee_amount < 0) {
      return NextResponse.json(
        { error: 'Late fee amount must be positive' },
        { status: 400 }
      )
    }

    // Check for existing active lease for this tenant-property combination
    const { data: existingLease } = await supabase
      .from('RENT_leases')
      .select('id')
      .eq('tenant_id', body.tenant_id)
      .eq('property_id', body.property_id)
      .eq('status', 'active')
      .single()

    if (existingLease) {
      return NextResponse.json(
        { error: 'This tenant already has an active lease for this property' },
        { status: 400 }
      )
    }

    // Create the lease
    const { data: lease, error: leaseError } = await supabase
      .from('RENT_leases')
      .insert([{
        tenant_id: body.tenant_id,
        property_id: body.property_id,
        rent: body.rent,
        rent_cadence: body.rent_cadence,
        rent_due_day: body.rent_due_day,
        lease_start_date: body.lease_start_date,
        lease_end_date: body.lease_end_date,
        move_in_fee: body.move_in_fee || 0,
        late_fee_amount: body.late_fee_amount || 0,
        lease_pdf_url: body.lease_pdf_url,
        status: body.status
      }])
      .select()
      .single()

    if (leaseError) {
      console.error('Error creating lease:', leaseError)
      return NextResponse.json(
        { error: 'Failed to create lease' },
        { status: 500 }
      )
    }

    // Generate rent periods using the RPC function
    console.log('Calling rent_generate_periods with lease ID:', lease.id)
    console.log('Supabase client type:', typeof supabase)
    console.log('RPC method available:', typeof (supabase as any).rpc)
    
    try {
      const { data, error: periodsError } = await (supabase as any).rpc('rent_generate_periods', {
        p_lease_id: lease.id
      })
      
      console.log('RPC response data:', data)
      console.log('RPC response error:', periodsError)

      if (periodsError) {
        console.error('Error generating periods:', periodsError)
        // Note: We don't fail the entire operation if period generation fails
        // The lease is still created, but periods will need to be generated manually
        console.warn('Lease created but period generation failed. Periods can be generated manually.')
      } else {
        console.log('Successfully generated periods for lease:', lease.id)
      }
    } catch (rpcError) {
      console.error('RPC call failed with exception:', rpcError)
      console.warn('Lease created but period generation failed. Periods can be generated manually.')
    }

    // Return the created lease with related data
    const { data: fullLease, error: fetchError } = await supabase
      .from('RENT_leases')
      .select(`
        *,
        RENT_tenants!inner(first_name, last_name),
        RENT_properties!inner(name, address)
      `)
      .eq('id', lease.id)
      .single()

    if (fetchError) {
      console.error('Error fetching created lease:', fetchError)
      // Return the basic lease data even if we can't fetch the full details
      return NextResponse.json({ lease })
    }

    return NextResponse.json({ 
      lease: fullLease,
      message: 'Lease created successfully' 
    })

  } catch (error) {
    console.error('Error in create-and-generate API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
