'use client'

export default function SimpleHeader() {
  return (
    <div className="mb-6 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-4">

        {/* Logo Text */}
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-md">
          SD
        </div>

        {/* Name */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
            Shyam Dental Pharmacy
          </h1>
          <p className="text-sm text-slate-500">Billing System</p>
        </div>

      </div>
    </div>
  )
}