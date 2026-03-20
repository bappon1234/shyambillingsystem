import Link from 'next/link'
import { Eye } from 'lucide-react'
import AppHeader from '@/components/AppHeader'

async function getBills() {
  const res = await fetch('http://localhost:3000/api/bills', {
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error('Failed to fetch bills')
  }

  return res.json()
}

export default async function BillHistoryPage() {
  const bills = await getBills()

  return (
    <>
  <AppHeader />
  <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                Bill History
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                View all generated invoices with customer and payment details
              </p>
            </div>

            <div className="inline-flex w-fit items-center rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
              Total Bills: {bills.length}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-800">Invoices List</h2>
            <p className="text-sm text-slate-500">
              Click view to open full invoice preview
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-sm text-slate-600">
                  <th className="px-5 py-4 text-left font-semibold">Invoice No</th>
                  <th className="px-5 py-4 text-left font-semibold">Customer Name</th>
                  <th className="px-5 py-4 text-left font-semibold">Phone</th>
                  <th className="px-5 py-4 text-left font-semibold">Grand Total</th>
                  <th className="px-5 py-4 text-left font-semibold">Date</th>
                  <th className="px-5 py-4 text-center font-semibold">Action</th>
                </tr>
              </thead>

              <tbody>
                {bills.length > 0 ? (
                  bills.map((bill: any, index: number) => (
                    <tr
                      key={bill._id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">
                            {bill.invoiceNo}
                          </span>
                          <span className="text-xs text-slate-400">
                            #{index + 1}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">
                            {bill.customerName}
                          </span>
                          <span className="text-xs text-slate-400">
                            Customer
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {bill.customerPhone}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-600">
                          ₹{Number(bill.grandTotal || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {new Date(bill.createdAt).toLocaleDateString('en-GB')}
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
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-500">
                          No bills found
                        </div>
                        <p className="mt-3 text-sm text-slate-400">
                          Generated invoices will appear here
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