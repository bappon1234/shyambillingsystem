'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import { Plus, Trash2, FileText } from 'lucide-react'

type BillItem = {
  sl: number
  description: string
  packQty: number
  unitType: 'patta' | 'pc'
  qty: number
  mrp: number
  discount: number
}

export default function NewBillPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    paymentMethod: 'Cash',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    amountReceived: 0,
    items: [
      {
        sl: 1,
        description: '',
        packQty: 10,
        unitType: 'patta' as 'patta' | 'pc',
        qty: 1,
        mrp: 0,
        discount: 0,
      },
    ] as BillItem[],
  })

  const updateItem = (index: number, field: keyof BillItem, value: string | number) => {
    const items = [...form.items]
    items[index] = {
      ...items[index],
      [field]:
        field === 'description' || field === 'unitType'
          ? value
          : Number(value),
    } as BillItem

    setForm({ ...form, items })
  }

  const addRow = () => {
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          sl: form.items.length + 1,
          description: '',
          packQty: 10,
          unitType: 'patta',
          qty: 1,
          mrp: 0,
          discount: 0,
        },
      ],
    })
  }

  const removeRow = (index: number) => {
    const items = form.items
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, sl: i + 1 }))
    setForm({ ...form, items })
  }

  const summary = useMemo(() => {
    const updated = form.items.map((item) => {
      const packRate = item.mrp - (item.mrp * item.discount) / 100
      const rate = item.unitType === 'pc' ? packRate / (item.packQty || 1) : packRate
      const total = rate * item.qty
      return { ...item, rate, total }
    })

    const subtotal = updated.reduce((sum, item) => {
      const base =
        item.unitType === 'pc'
          ? (item.mrp / (item.packQty || 1)) * item.qty
          : item.mrp * item.qty
      return sum + base
    }, 0)

    const totalDiscount = updated.reduce((sum, item) => {
      const base =
        item.unitType === 'pc'
          ? (item.mrp / (item.packQty || 1)) * item.qty
          : item.mrp * item.qty
      return sum + (base - item.total)
    }, 0)

    const totalBeforeRound = updated.reduce((sum, item) => sum + item.total, 0)
    const grandTotal = Math.round(totalBeforeRound)
    const roundOff = grandTotal - totalBeforeRound
    const balance = grandTotal - Number(form.amountReceived || 0)

    return { updated, subtotal, totalDiscount, roundOff, grandTotal, balance }
  }, [form])

  const generateBill = async () => {
    if (!form.customerName || !form.customerPhone) {
      alert('Customer name and phone required')
      return
    }

    const invalid = form.items.some(
      (item) => !item.description || item.qty <= 0 || item.mrp <= 0 || item.packQty <= 0
    )

    if (invalid) {
      alert('Please fill all medicine details properly')
      return
    }

    try {
      setLoading(true)

      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || 'Failed to generate bill')
        return
      }

      router.push(`/bills/${data._id}`)
    } catch (error) {
      console.error(error)
      alert('Server error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
  <AppHeader />
  <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
    <div className="min-h-screen bg-[#f4f6f8] py-8 px-4">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white shadow-lg border border-slate-200">
        <div className="border-b px-6 py-5">
          <h1 className="text-3xl font-bold text-slate-900">New Bill</h1>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Invoice Number
              </label>
              <input
                value="Auto Generate"
                readOnly
                className="w-full rounded-xl border bg-slate-100 px-4 py-3 text-slate-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Date
              </label>
              <input
                value={new Date().toLocaleDateString('en-GB')}
                readOnly
                className="w-full rounded-xl border bg-slate-100 px-4 py-3 text-slate-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Payment Mode
              </label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full rounded-xl border px-4 py-3"
              >
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Customer Name *
              </label>
              <input
                type="text"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                placeholder="Enter customer name"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Phone Number *
              </label>
              <input
                type="text"
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                placeholder="Enter phone number"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Address
              </label>
              <input
                type="text"
                value={form.customerAddress}
                onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                placeholder="Enter address"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="border-b px-3 py-3 text-left">SL</th>
                  <th className="border-b px-3 py-3 text-left">Description</th>
                  <th className="border-b px-3 py-3 text-left">1 Patta = Pc</th>
                  <th className="border-b px-3 py-3 text-left">Unit</th>
                  <th className="border-b px-3 py-3 text-left">Qty</th>
                  <th className="border-b px-3 py-3 text-left">MRP</th>
                  <th className="border-b px-3 py-3 text-left">Disc %</th>
                  <th className="border-b px-3 py-3 text-left">Rate</th>
                  <th className="border-b px-3 py-3 text-left">Total</th>
                  <th className="border-b px-3 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, index) => {
                  const packRate = item.mrp - (item.mrp * item.discount) / 100
                  const rate = item.unitType === 'pc' ? packRate / (item.packQty || 1) : packRate
                  const total = rate * item.qty

                  return (
                    <tr key={index}>
                      <td className="border-b px-3 py-2">
                        <input
                          value={item.sl}
                          readOnly
                          className="w-14 rounded-md border bg-slate-50 px-2 py-2"
                        />
                      </td>
                      <td className="border-b px-3 py-2">
                        <input
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="Item name"
                          className="w-full rounded-md border px-3 py-2"
                        />
                      </td>
                      <td className="border-b px-3 py-2">
                        <input
                          type="number"
                          value={item.packQty}
                          onChange={(e) => updateItem(index, 'packQty', e.target.value)}
                          className="w-28 rounded-md border px-3 py-2"
                        />
                      </td>
                      <td className="border-b px-3 py-2">
                        <select
                          value={item.unitType}
                          onChange={(e) => updateItem(index, 'unitType', e.target.value)}
                          className="w-24 rounded-md border px-3 py-2"
                        >
                          <option value="patta">patta</option>
                          <option value="pc">pc</option>
                        </select>
                      </td>
                      <td className="border-b px-3 py-2">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateItem(index, 'qty', e.target.value)}
                          className="w-20 rounded-md border px-3 py-2"
                        />
                      </td>
                      <td className="border-b px-3 py-2">
                        <input
                          type="number"
                          value={item.mrp}
                          onChange={(e) => updateItem(index, 'mrp', e.target.value)}
                          className="w-28 rounded-md border px-3 py-2"
                        />
                      </td>
                      <td className="border-b px-3 py-2">
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) => updateItem(index, 'discount', e.target.value)}
                          className="w-24 rounded-md border px-3 py-2"
                        />
                      </td>
                      <td className="border-b px-3 py-2 font-medium">
                        ₹{rate.toFixed(2)}
                      </td>
                      <td className="border-b px-3 py-2 font-semibold">
                        ₹{total.toFixed(2)}
                      </td>
                      <td className="border-b px-3 py-2 text-center">
                        <button
                          onClick={() => removeRow(index)}
                          disabled={form.items.length === 1}
                          className="rounded-md bg-red-50 p-2 text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <button
            onClick={addRow}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white font-semibold"
          >
            <Plus size={18} />
            Add Item
          </button>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Amount Received
            </label>
            <input
              type="number"
              value={form.amountReceived}
              onChange={(e) => setForm({ ...form, amountReceived: Number(e.target.value) })}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div className="rounded-xl bg-slate-50 p-5 border">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{summary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Total Discount:</span>
                <span>-₹{summary.totalDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Round Off:</span>
                <span>₹{summary.roundOff.toFixed(2)}</span>
              </div>
              <div className="mt-3 border-t pt-3 flex justify-between text-3xl font-bold">
                <span>Grand Total:</span>
                <span className="text-green-600">₹{summary.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Balance:</span>
                <span className="text-green-600">₹{summary.balance.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={generateBill}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-4 text-lg font-bold text-white disabled:opacity-50"
          >
            <FileText size={20} />
            {loading ? 'Generating Bill...' : 'Generate Bill'}
          </button>
        </div>
      </div>
    </div>
    </div>
    </>
  )
}