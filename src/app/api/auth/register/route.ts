import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import User from '@/models/User'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    await connectDB()

    const exists = await User.findOne({ email })
    if (exists) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    })

    return NextResponse.json(
      {
        message: 'Registered successfully',
        user,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('REGISTER API ERROR:', error)
    return NextResponse.json(
      {
        message: error.message || 'Register failed',
      },
      { status: 500 }
    )
  }
}