import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Bill from '@/models/Bill'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid bill id',
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

    return NextResponse.json({
      success: true,
      bill,
    })
  } catch (error) {
    console.error('Bill fetch error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch bill',
      },
      { status: 500 }
    )
  }
}