import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@rental-app/api'

export async function POST(request: NextRequest) {
  try {
    // supabase is already imported from @rental-app/api
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    // Parse request body for optional as_of date
    const body = await request.json().catch(() => ({}))
    const asOfDate = body.as_of || new Date().toISOString().split('T')[0]

    // Call the resync function
    const { data, error } = await (supabase as any).rpc('RENT_resync_all', {
      p_as_of: asOfDate
    })

    if (error) {
      console.error('Error calling RENT_resync_all:', error)
      return NextResponse.json(
        { error: 'Failed to resync rent periods', details: error.message },
        { status: 500 }
      )
    }

    // Process results
    const results = data || []
    const totalPeriods = results.length
    const overpaidCount = results.filter((r: any) => r.note === 'overpaid').length
    const totalRemainingDue = results.reduce((sum: number, r: any) => sum + parseFloat(r.remaining_due || 0), 0)

    return NextResponse.json({
      success: true,
      summary: {
        total_periods: totalPeriods,
        overpaid_count: overpaidCount,
        total_remaining_due: totalRemainingDue,
        as_of_date: asOfDate
      },
      details: results
    })

  } catch (error) {
    console.error('Error in resync API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
