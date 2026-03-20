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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const payAmount = Number(amount)

    if (isNaN(payAmount) || payAmount <= 0) {
      alert('Please enter valid amount')
      return
    }

    if (payAmount > pendingBalance) {
      alert('Amount cannot be greater than pending balance')
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

      if (!data.success) {
        alert(data.message || 'Payment failed')
        return
      }

      alert('Payment updated successfully')
      router.push('/bills/pending')
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Something went wrong')
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
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter payment amount"
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setAmount(String(pendingBalance))}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
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