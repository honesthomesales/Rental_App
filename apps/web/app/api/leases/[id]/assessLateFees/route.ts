import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@rental-app/api'

export async function generateStaticParams() {
  // Required for static export
  return []
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leaseId = params.id

    if (!leaseId) {
      return NextResponse.json(
        { error: 'Lease ID is required' },
        { status: 400 }
      )
    }

    console.log('Assessing late fees for lease:', leaseId)

    // Call the SQL RPC function to assess late fees
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      )
    }

    const { data, error } = await (supabase as any).rpc('RENT_assess_late_fees', {
      lease_id: leaseId
    })

    if (error) {
      console.error('Error assessing late fees:', error)
      return NextResponse.json(
        { error: 'Failed to assess late fees', details: error.message },
        { status: 500 }
      )
    }

    console.log('Late fees assessed successfully:', data)

    return NextResponse.json({
      success: true,
      message: 'Late fees assessed successfully',
      data: data
    })

  } catch (error) {
    console.error('Unexpected error assessing late fees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
