import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Bill from '@/models/Bill'
import Counter from '@/models/Counter'

function numberToWords(num: number) {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ]
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function convert(n: number): string {
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '')
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '')
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '')
    return String(n)
  }

  return `${convert(num)} Only`
}

export async function GET() {
  try {
    await connectDB()
    const bills = await Bill.find().sort({ createdAt: -1 })
    return NextResponse.json(bills)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Failed to fetch bills' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await connectDB()
    const data = await req.json()

    if (!data.customerName || !data.customerPhone || !data.items?.length) {
      return NextResponse.json(
        { message: 'Customer name, phone and items are required' },
        { status: 400 }
      )
    }

    const counter = await Counter.findOneAndUpdate(
      { name: 'bill_invoice' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    )

    const invoiceNo = `SDP${String(counter.seq).padStart(4, '0')}`

    const items = data.items.map((item: any, index: number) => {
      const packQty = Number(item.packQty || 1)
      const qty = Number(item.qty || 0)
      const mrp = Number(item.mrp || 0)
      const discount = Number(item.discount || 0)
      const unitType = item.unitType || 'patta'

      const discountedPackRate = mrp - (mrp * discount) / 100
      const rate = unitType === 'pc' ? discountedPackRate / packQty : discountedPackRate
      const total = rate * qty

      return {
        sl: index + 1,
        description: item.description,
        packQty,
        unitType,
        qty,
        mrp,
        discount,
        rate: Number(rate.toFixed(2)),
        total: Number(total.toFixed(2)),
      }
    })

    const subtotal = items.reduce((sum: number, item: any) => {
      const base = item.unitType === 'pc'
        ? (item.mrp / item.packQty) * item.qty
        : item.mrp * item.qty
      return sum + base
    }, 0)

    const totalDiscount = items.reduce((sum: number, item: any) => {
      const base = item.unitType === 'pc'
        ? (item.mrp / item.packQty) * item.qty
        : item.mrp * item.qty

      const discounted = item.rate * item.qty
      return sum + (base - discounted)
    }, 0)

    const totalBeforeRound = items.reduce((sum: number, item: any) => sum + item.total, 0)
    const grandTotal = Math.round(totalBeforeRound)
    const roundOff = Number((grandTotal - totalBeforeRound).toFixed(2))
    const amountReceived = Number(data.amountReceived || 0)
    const balance = Number((grandTotal - amountReceived).toFixed(2))

    const bill = await Bill.create({
      invoiceNo,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
      paymentMethod: data.paymentMethod || 'Cash',
      items,
      subtotal: Number(subtotal.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      roundOff,
      grandTotal,
      amountReceived,
      balance,
      amountInWords: numberToWords(grandTotal),
      createdBy: data.createdBy || null,
    })

    return NextResponse.json(bill, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Bill creation failed' }, { status: 500 })
  }
}