'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import AppHeader from '@/components/AppHeader'
import {
  FaFileInvoice,
  FaCalendarDay,
  FaMoneyBillWave,
  FaClock,
  FaPlus,
} from 'react-icons/fa'

type DashboardSummary = {
  totalBills: number
  todayBills: number
  totalSales: number
  pendingBalance: number
}

export default function DashboardPage() {
  const [active, setActive] = useState('')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<DashboardSummary>({
    totalBills: 0,
    todayBills: 0,
    totalSales: 0,
    pendingBalance: 0,
  })

  useEffect(() => {
    const fetchDashboardSummary = async () => {
      try {
        setLoading(true)

        const res = await fetch('/api/dashboard/summary', {
          method: 'GET',
          cache: 'no-store',
        })

        const data = await res.json()

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch dashboard summary')
        }

        setSummary({
          totalBills: data.totalBills || 0,
          todayBills: data.todayBills || 0,
          totalSales: data.totalSales || 0,
          pendingBalance: data.pendingBalance || 0,
        })
      } catch (error) {
        console.error('Dashboard fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardSummary()
  }, [])

  const cards = [
    {
      title: 'Total Bills',
      value: loading ? '...' : summary.totalBills.toLocaleString('en-IN'),
      icon: FaFileInvoice,
      link: '/bills/history',
      color: 'bg-blue-500',
    },
    {
      title: 'Today Bills',
      value: loading ? '...' : summary.todayBills.toLocaleString('en-IN'),
      icon: FaCalendarDay,
      link: '/bills/today',
      color: 'bg-green-500',
    },
    {
      title: 'Total Sales',
      value: loading ? '...' : `₹${summary.totalSales.toLocaleString('en-IN')}`,
      icon: FaMoneyBillWave,
      link: '/bills/history',
      color: 'bg-purple-500',
    },
    {
      title: 'Pending Balance',
      value: loading ? '...' : `₹${summary.pendingBalance.toLocaleString('en-IN')}`,
      icon: FaClock,
      link: '/bills/pending',
      color: 'bg-red-500',
    },
  ]

  return (
    <>
  <AppHeader />
  <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800 sm:text-3xl">
        Dashboard
      </h1>

      <Link href="/bills/new">
        <div
          onClick={() => setActive('new')}
          className={`mb-6 flex cursor-pointer items-center justify-between rounded-2xl p-6 transition ${
            active === 'new'
              ? 'bg-blue-700 text-white shadow-xl'
              : 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
          }`}
        >
          <div>
            <h2 className="text-xl font-bold">+ Create New Bill</h2>
            <p className="text-sm opacity-90">Generate invoice quickly</p>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
            <FaPlus size={22} />
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon

          return (
            <Link key={card.title} href={card.link}>
              <div
                onClick={() => setActive(card.title)}
                className={`flex cursor-pointer items-center justify-between rounded-2xl p-5 transition ${
                  active === card.title
                    ? 'bg-gray-800 text-white shadow-xl'
                    : 'bg-white shadow-md hover:shadow-xl'
                }`}
              >
                <div>
                  <p
                    className={`text-sm ${
                      active === card.title ? 'text-gray-300' : 'text-gray-500'
                    }`}
                  >
                    {card.title}
                  </p>

                  <h2 className="mt-1 text-xl font-bold">{card.value}</h2>
                </div>

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${
                    active === card.title ? 'bg-gray-600' : card.color
                  }`}
                >
                  <Icon size={20} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
</>
  )
}