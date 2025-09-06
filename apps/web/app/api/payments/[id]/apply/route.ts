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
    const paymentId = params.id

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    console.log('Applying payment:', paymentId)

    // Call the SQL RPC function to apply payment
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      )
    }

    const { data, error } = await (supabase as any).rpc('RENT_apply_payment', {
      payment_id: paymentId
    })

    if (error) {
      console.error('Error applying payment:', error)
      return NextResponse.json(
        { error: 'Failed to apply payment', details: error.message },
        { status: 500 }
      )
    }

    console.log('Payment applied successfully:', data)

    return NextResponse.json({
      success: true,
      message: 'Payment applied successfully',
      data: data
    })

  } catch (error) {
    console.error('Unexpected error applying payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
