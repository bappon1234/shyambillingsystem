export const dynamic = 'force-dynamic'
export const revalidate = 0

import Link from 'next/link'
import { Eye } from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import { connectDB } from '@/lib/db'
import Bill from '@/models/Bill'

async function getTodayBills() {
  await connectDB()

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  const bills = await Bill.find({
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  })
    .sort({ createdAt: -1 })
    .lean()

  return bills.map((bill: any) => ({
    ...bill,
    _id: bill._id.toString(),
  }))
}

export default async function TodayBillsPage() {
  const bills = await getTodayBills()

  const todaySales = bills.reduce(
    (sum: number, bill: any) => sum + Number(bill.grandTotal || 0),
    0
  )

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                  Today Bills
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  All invoices generated today with live billing data
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Today Summary</p>
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">Bills Count</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {bills.length.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Today Sales</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      ₹{todaySales.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-800">
                  Today Invoice List
                </h2>
                <p className="text-sm text-slate-500">
                  View today generated invoice details
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[950px] w-full">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200 text-sm text-slate-600">
                      <th className="px-5 py-4 text-left font-semibold">Invoice No</th>
                      <th className="px-5 py-4 text-left font-semibold">Customer</th>
                      <th className="px-5 py-4 text-left font-semibold">Phone</th>
                      <th className="px-5 py-4 text-left font-semibold">Payment</th>
                      <th className="px-5 py-4 text-left font-semibold">Grand Total</th>
                      <th className="px-5 py-4 text-left font-semibold">Date</th>
                      <th className="px-5 py-4 text-center font-semibold">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {bills.length > 0 ? (
                      bills.map((bill: any) => (
                        <tr
                          key={bill._id}
                          className="border-b border-slate-100 transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4 font-semibold text-slate-800">
                            {bill.invoiceNo}
                          </td>
                          <td className="px-5 py-4 text-slate-700">{bill.customerName}</td>
                          <td className="px-5 py-4 text-slate-600">{bill.customerPhone}</td>
                          <td className="px-5 py-4 text-slate-600">
                            {bill.paymentMethod || '-'}
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-600">
                              ₹{Number(bill.grandTotal || 0).toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-500">
                            {bill.createdAt
                              ? new Date(bill.createdAt).toLocaleDateString('en-GB')
                              : '-'}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <Link
                              href={`/bills/${bill._id}`}
                              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                            >
                              <Eye size={16} />
                              View
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-500">
                              No bills found for today
                            </div>
                            <p className="mt-3 text-sm text-slate-400">
                              Today generated invoices will appear here
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}