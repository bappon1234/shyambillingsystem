import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/db'
import User from '@/models/User'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { message: 'JWT_SECRET is missing on server' },
        { status: 500 }
      )
    }

    await connectDB()

    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 })
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    const response = NextResponse.json({
      message: 'Login success',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error: any) {
    console.error('LOGIN ERROR:', error)
    return NextResponse.json(
      { message: error?.message || 'Login failed' },
      { status: 500 }
    )
  }
}