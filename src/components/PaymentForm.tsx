'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function PaymentForm({
  billId,
  pendingBalance,
}: {
  billId: string
  pendingBalance: number
}) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setError('')
    setSuccess('')

    const payAmount = Number(amount)

    if (isNaN(payAmount) || payAmount <= 0) {
      setError('Please enter valid amount')
      return
    }

    if (payAmount > pendingBalance) {
      setError('Amount cannot be greater than pending balance')
      return
    }

    try {
      setLoading(true)

      const res = await fetch(`/api/bills/pay/${billId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: payAmount }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.message || 'Payment failed')
        return
      }

      setSuccess('Payment updated successfully')
      setAmount('')

      router.push('/bills/pending')
      router.refresh()
    } catch (error) {
      console.error(error)
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Payment Amount
        </label>
        <input
          type="number"
          min="1"
          max={pendingBalance}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter payment amount"
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500"
        />
      </div>

      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-sm text-slate-500">Pending Balance</p>
        <p className="mt-1 text-lg font-bold text-red-500">
          ₹{Number(pendingBalance || 0).toLocaleString('en-IN')}
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-600">
          {success}
        </div>
      ) : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setAmount(String(pendingBalance))}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Full Payment
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Updating...' : 'Update Payment'}
        </button>
      </div>
    </form>
  )
}