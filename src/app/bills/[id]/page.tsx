import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/db'
import Bill from '@/models/Bill'
import BillPreviewClient from './BillPreviewClient'

export default async function BillPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  await connectDB()
  const bill = await Bill.findById(id).lean()

  if (!bill) return notFound()

  return <BillPreviewClient bill={JSON.parse(JSON.stringify(bill))} />
}