import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/db'
import User from '@/models/User'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    await connectDB()

    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 400 })
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )
     const response = NextResponse.json({ message: 'Login success' })
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })

    return response
  } catch (error) {
    return NextResponse.json({ message: 'Login failed' }, { status: 500 })
  }
}