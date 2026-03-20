import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Bill from '@/models/Bill'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    const { id } = await params
    const body = await req.json()
    const payAmount = Number(body.amount)

    if (isNaN(payAmount) || payAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please enter a valid payment amount',
        },
        { status: 400 }
      )
    }

    const bill = await Bill.findById(id)

    if (!bill) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bill not found',
        },
        { status: 404 }
      )
    }

    const currentReceived = Number(bill.amountReceived || 0)
    const currentBalance = Number(bill.balance || 0)

    if (currentBalance <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'This bill is already fully paid',
        },
        { status: 400 }
      )
    }

    if (payAmount > currentBalance) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payment amount cannot be greater than pending balance',
        },
        { status: 400 }
      )
    }

    bill.amountReceived = currentReceived + payAmount
    bill.balance = currentBalance - payAmount

    if (bill.balance < 0) {
      bill.balance = 0
    }

    await bill.save()

    return NextResponse.json({
      success: true,
      message: 'Payment updated successfully',
      bill,
    })
  } catch (error) {
    console.error('Payment update error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update payment',
      },
      { status: 500 }
    )
  }
}