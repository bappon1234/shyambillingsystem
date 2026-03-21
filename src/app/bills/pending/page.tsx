import Link from 'next/link'
import { Eye } from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import { connectDB } from '@/lib/db'
import Bill from '@/models/Bill'

async function getPendingBills() {
  await connectDB()

  const bills = await Bill.find({
    balance: { $gt: 0 },
  })
    .sort({ createdAt: -1 })
    .lean()

  const totalPending = bills.reduce(
    (sum: number, bill: any) => sum + Number(bill.balance || 0),
    0
  )

  return {
    bills: bills.map((bill: any) => ({
      ...bill,
      _id: bill._id.toString(),
    })),
    totalPending,
  }
}

export default async function PendingBillsPage() {
  const data = await getPendingBills()
  const bills = data.bills || []
  const totalPending = Number(data.totalPending || 0)

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                  Pending Balance
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  All customers with outstanding due balance
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Pending Summary</p>
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">Pending Bills</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {bills.length.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Pending</p>
                    <p className="text-2xl font-bold text-red-500">
                      ₹{totalPending.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-lg font-semibold text-slate-800">
                  Pending Customers
                </h2>
                <p className="text-sm text-slate-500">
                  View unpaid invoice details and dues
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1050px] w-full">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200 text-sm text-slate-600">
                      <th className="px-5 py-4 text-left font-semibold">Invoice No</th>
                      <th className="px-5 py-4 text-left font-semibold">Customer</th>
                      <th className="px-5 py-4 text-left font-semibold">Phone</th>
                      <th className="px-5 py-4 text-left font-semibold">Grand Total</th>
                      <th className="px-5 py-4 text-left font-semibold">Received</th>
                      <th className="px-5 py-4 text-left font-semibold">Pending</th>
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
                          <td className="px-5 py-4 text-slate-700">
                            ₹{Number(bill.grandTotal || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-5 py-4 text-slate-700">
                            ₹{Number(bill.amountReceived || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-500">
                              ₹{Number(bill.balance || 0).toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-500">
                            {bill.createdAt
                              ? new Date(bill.createdAt).toLocaleDateString('en-GB')
                              : '-'}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                href={`/bills/${bill._id}`}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                              >
                                <Eye size={16} />
                                View
                              </Link>

                              <Link
                                href={`/bills/pay/${bill._id}`}
                                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                              >
                                Pay
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-5 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-500">
                              No pending balance found
                            </div>
                            <p className="mt-3 text-sm text-slate-400">
                              All invoices are fully paid
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