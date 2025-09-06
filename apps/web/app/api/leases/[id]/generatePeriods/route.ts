import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@rental-app/api'

export async function generateStaticParams(): Promise<{ id: string }[]> {
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

    console.log('Generating periods for lease:', leaseId)

    // Call the SQL RPC function to generate periods
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      )
    }

    const { data, error } = await (supabase as any).rpc('RENT_generate_periods', {
      lease_id: leaseId
    })

    if (error) {
      console.error('Error generating periods:', error)
      return NextResponse.json(
        { error: 'Failed to generate periods', details: error.message },
        { status: 500 }
      )
    }

    console.log('Periods generated successfully:', data)

    return NextResponse.json({
      success: true,
      message: 'Periods generated successfully',
      data: data
    })

  } catch (error) {
    console.error('Unexpected error generating periods:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
