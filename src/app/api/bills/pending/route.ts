import { NextResponse } from 'next/server'
import {connectDB} from '@/lib/db'
import Bill from '@/models/Bill'

export async function GET() {
  try {
    await connectDB()

    const bills = await Bill.find({
      balance: { $gt: 0 },
    }).sort({ createdAt: -1 })

    const totalPending = bills.reduce(
      (sum, bill) => sum + Number(bill.balance || 0),
      0
    )

    return NextResponse.json({
      success: true,
      bills,
      totalPending,
    })
  } catch (error) {
    console.error('Pending bills fetch error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch pending bills',
      },
      { status: 500 }
    )
  }
}