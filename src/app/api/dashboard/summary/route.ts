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

    const [totalBills, todayBills, totalSalesAgg, pendingBalanceAgg] = await Promise.all([
      Bill.countDocuments(),
      Bill.countDocuments({
        createdAt: {
          $gte: startOfToday,
          $lte: endOfToday,
        },
      }),
      Bill.aggregate([
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$grandTotal' },
          },
        },
      ]),
      Bill.aggregate([
        {
          $group: {
            _id: null,
            pendingBalance: { $sum: '$balance' },
          },
        },
      ]),
    ])

    const totalSales = totalSalesAgg[0]?.totalSales || 0
    const pendingBalance = pendingBalanceAgg[0]?.pendingBalance || 0

    return NextResponse.json({
      success: true,
      totalBills,
      todayBills,
      totalSales,
      pendingBalance,
    })
  } catch (error) {
    console.error('Dashboard summary error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch dashboard summary',
      },
      { status: 500 }
    )
  }
}