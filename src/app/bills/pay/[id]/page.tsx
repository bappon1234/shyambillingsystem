import AppHeader from '@/components/AppHeader'
import PaymentForm from '@/components/PaymentForm'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'

async function getBill(id: string) {
  const headerList = await headers()
  const host = headerList.get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'

  const res = await fetch(`${protocol}://${host}/api/bills/${id}`, {
    cache: 'no-store',
  })

  if (!res.ok) return null

  return res.json()
}

export default async function PayBillPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getBill(id)

  if (!data?.success || !data?.bill) {
    notFound()
  }

  const bill = data.bill

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 sm:p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
              Update Payment
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Enter customer payment and update pending balance
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Invoice No</p>
                <p className="mt-1 font-semibold text-slate-800">{bill.invoiceNo}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Customer Name</p>
                <p className="mt-1 font-semibold text-slate-800">{bill.customerName}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Phone</p>
                <p className="mt-1 font-semibold text-slate-800">{bill.customerPhone}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Date</p>
                <p className="mt-1 font-semibold text-slate-800">
                  {new Date(bill.createdAt).toLocaleDateString('en-GB')}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Grand Total</p>
                <p className="mt-1 font-semibold text-slate-800">
                  ₹{Number(bill.grandTotal || 0).toLocaleString('en-IN')}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Amount Received</p>
                <p className="mt-1 font-semibold text-slate-800">
                  ₹{Number(bill.amountReceived || 0).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm text-slate-500">Pending Balance</p>
                <p className="mt-1 text-xl font-bold text-red-500">
                  ₹{Number(bill.balance || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <PaymentForm
                billId={bill._id}
                pendingBalance={Number(bill.balance || 0)}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}