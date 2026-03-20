import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Bill from '@/models/Bill'

export async function GET() {
  try {
    await connectDB()

    const now = new Date()

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    )

    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    )

    const bills = await Bill.find({
      createdAt: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    }).sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      bills,
    })
  } catch (error) {
    console.error('Today bills fetch error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch today bills',
      },
      { status: 500 }
    )
  }
}