'use client'

import { useEffect, useRef, useState } from 'react'
import { FileDown, MessageCircle, Printer } from 'lucide-react'

type BillItem = {
  sl: number
  description: string
  qty: number
  mrp: number
  discount: number
  rate: number
  total: number
}

type Bill = {
  _id: string
  invoiceNo: string
  customerName: string
  customerPhone: string
  customerAddress: string
  paymentMethod: string
  items: BillItem[]
  subtotal: number
  totalDiscount: number
  roundOff: number
  grandTotal: number
  amountReceived: number
  balance: number
  amountInWords: string
  createdAt: string
}

const DESKTOP_BILL_WIDTH = 980

export default function BillPreviewClient({ bill }: { bill: Bill }) {
  const previewOuterRef = useRef<HTMLDivElement>(null)
  const previewInnerRef = useRef<HTMLDivElement>(null)
  const pdfBillRef = useRef<HTMLDivElement>(null)

  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [scale, setScale] = useState(1)
  const [scaledHeight, setScaledHeight] = useState(0)

  useEffect(() => {
    const updatePreviewScale = () => {
      if (!previewOuterRef.current || !previewInnerRef.current) return

      const availableWidth = previewOuterRef.current.clientWidth - 8
      const nextScale =
        availableWidth < DESKTOP_BILL_WIDTH ? availableWidth / DESKTOP_BILL_WIDTH : 1

      setScale(nextScale)
      setScaledHeight(previewInnerRef.current.offsetHeight * nextScale)
    }

    updatePreviewScale()

    const resizeObserver = new ResizeObserver(() => {
      updatePreviewScale()
    })

    if (previewOuterRef.current) resizeObserver.observe(previewOuterRef.current)
    if (previewInnerRef.current) resizeObserver.observe(previewInnerRef.current)

    window.addEventListener('resize', updatePreviewScale)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updatePreviewScale)
    }
  }, [bill])

  const sanitizeNodeStyles = (root: HTMLElement) => {
    const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))]

    elements.forEach((el) => {
      const computed = window.getComputedStyle(el)

      const checkUnsupported = (value: string) =>
        value.includes('lab(') ||
        value.includes('oklab(') ||
        value.includes('lch(') ||
        value.includes('oklch(')

      if (checkUnsupported(computed.color || '')) el.style.color = '#111827'
      if (checkUnsupported(computed.backgroundColor || '')) el.style.backgroundColor = '#ffffff'
      if (checkUnsupported(computed.borderTopColor || '')) el.style.borderTopColor = '#cbd5e1'
      if (checkUnsupported(computed.borderRightColor || '')) el.style.borderRightColor = '#cbd5e1'
      if (checkUnsupported(computed.borderBottomColor || '')) el.style.borderBottomColor = '#cbd5e1'
      if (checkUnsupported(computed.borderLeftColor || '')) el.style.borderLeftColor = '#cbd5e1'

      if (computed.backgroundImage && computed.backgroundImage !== 'none') {
        el.style.backgroundImage = 'none'
      }

      el.style.boxShadow = 'none'
      el.style.backdropFilter = 'none'
      el.style.filter = 'none'
      el.style.webkitFilter = 'none'
    })
  }

  const forcePdfColors = (root: HTMLElement) => {
    root.style.background = '#ffffff'
    root.style.color = '#111827'

    const title = root.querySelector('[data-pdf-title]') as HTMLElement | null
    if (title) title.style.color = '#1e3a8a'

    root.querySelectorAll('[data-pdf-blue="true"]').forEach((el) => {
      ; (el as HTMLElement).style.color = '#1e3a8a'
    })

    root.querySelectorAll('[data-pdf-red="true"]').forEach((el) => {
      ; (el as HTMLElement).style.color = '#ef4444'
    })

    root.querySelectorAll('[data-pdf-muted="true"]').forEach((el) => {
      ; (el as HTMLElement).style.color = '#64748b'
    })

    root.querySelectorAll('[data-pdf-softbg="true"]').forEach((el) => {
      ; (el as HTMLElement).style.backgroundColor = '#f8fafc'
    })

    const thead = root.querySelector('[data-pdf-thead]') as HTMLElement | null
    if (thead) thead.style.backgroundColor = '#e2e8f0'
  }

  const buildPdf = async () => {
    if (!pdfBillRef.current) return null

    let wrapper: HTMLDivElement | null = null

    try {
      const html2canvas = (await import('html2canvas')).default
      const jspdf = await import('jspdf/dist/jspdf.umd.min.js')

      wrapper = document.createElement('div')
      wrapper.style.position = 'fixed'
      wrapper.style.left = '-100000px'
      wrapper.style.top = '0'
      wrapper.style.width = `${DESKTOP_BILL_WIDTH}px`
      wrapper.style.background = '#ffffff'
      wrapper.style.margin = '0'
      wrapper.style.padding = '0'
      wrapper.style.zIndex = '-1'

      const cloned = pdfBillRef.current.cloneNode(true) as HTMLElement
      cloned.style.display = 'block'
      cloned.style.width = `${DESKTOP_BILL_WIDTH}px`
      cloned.style.minWidth = `${DESKTOP_BILL_WIDTH}px`
      cloned.style.maxWidth = `${DESKTOP_BILL_WIDTH}px`
      cloned.style.background = '#ffffff'
      cloned.style.color = '#111827'
      cloned.style.transform = 'none'
      cloned.style.boxShadow = 'none'

      wrapper.appendChild(cloned)
      document.body.appendChild(wrapper)

      sanitizeNodeStyles(cloned)
      forcePdfColors(cloned)

      const canvas = await html2canvas(cloned, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
      })

      // A5 portrait in mm = 148 x 210
      const pdf = new jspdf.jsPDF('p', 'mm', 'a5')
      const imgData = canvas.toDataURL('image/png')

      const pageWidth = 148
      const pageHeight = 210
      const margin = 5

      const usableWidth = pageWidth - margin * 2
      const usableHeight = pageHeight - margin * 2

      let imgWidth = usableWidth
      let imgHeight = (canvas.height * imgWidth) / canvas.width

      if (imgHeight <= usableHeight) {
        const x = (pageWidth - imgWidth) / 2
        const y = margin
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight, '', 'FAST')
      } else {
        const pageCanvas = document.createElement('canvas')
        const pageCtx = pageCanvas.getContext('2d')
        if (!pageCtx) throw new Error('Canvas context not available')

        const pxPageHeight = Math.floor((canvas.width * usableHeight) / usableWidth)

        let renderedHeight = 0
        let pageIndex = 0

        while (renderedHeight < canvas.height) {
          const sliceHeight = Math.min(pxPageHeight, canvas.height - renderedHeight)

          pageCanvas.width = canvas.width
          pageCanvas.height = sliceHeight

          pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height)
          pageCtx.drawImage(
            canvas,
            0,
            renderedHeight,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight
          )

          const pageData = pageCanvas.toDataURL('image/png')
          const pageRenderHeight = (sliceHeight * usableWidth) / canvas.width

          if (pageIndex > 0) pdf.addPage()
          pdf.addImage(pageData, 'PNG', margin, margin, usableWidth, pageRenderHeight, '', 'FAST')

          renderedHeight += sliceHeight
          pageIndex++
        }
      }

      return pdf
    } finally {
      if (wrapper && document.body.contains(wrapper)) {
        document.body.removeChild(wrapper)
      }
    }
  }

  const downloadPDF = async () => {
    if (downloading || printing) return

    try {
      setDownloading(true)
      const pdf = await buildPdf()
      if (!pdf) return
      pdf.save(`${bill.invoiceNo}.pdf`)
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('PDF download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = async () => {
    if (printing || downloading) return

    try {
      setPrinting(true)
      const pdf = await buildPdf()
      if (!pdf) return

      const blobUrl = pdf.output('bloburl')
      const printWindow = window.open(blobUrl, '_blank')

      if (!printWindow) {
        alert('Please allow popups to print the invoice.')
        return
      }

      const tryPrint = () => {
        try {
          printWindow.focus()
          printWindow.print()
        } catch (err) {
          console.error('Print failed:', err)
        }
      }

      printWindow.onload = tryPrint
      setTimeout(tryPrint, 1200)
    } catch (error) {
      console.error('Print failed:', error)
      alert('Print failed. Please try again.')
    } finally {
      setPrinting(false)
    }
  }

  const shareWhatsApp = () => {
    const phone = bill.customerPhone.replace(/\D/g, '')

    const itemsText = bill.items
      .map(
        (item) =>
          `${item.sl}. ${item.description} | Qty: ${item.qty} | MRP: ₹${item.mrp.toFixed(
            2
          )} | Rate: ₹${item.rate.toFixed(2)} | Total: ₹${item.total.toFixed(2)}`
      )
      .join('\n')

    const message =
      `Invoice No: ${bill.invoiceNo}\n` +
      `Customer: ${bill.customerName}\n` +
      `Phone: ${bill.customerPhone}\n` +
      `Address: ${bill.customerAddress || '-'}\n` +
      `Payment: ${bill.paymentMethod}\n\n` +
      `Medicines:\n${itemsText}\n\n` +
      `Subtotal: ₹${bill.subtotal.toFixed(2)}\n` +
      `Discount: ₹${bill.totalDiscount.toFixed(2)}\n` +
      `Round Off: ₹${bill.roundOff.toFixed(2)}\n` +
      `Grand Total: ₹${bill.grandTotal.toFixed(2)}\n` +
      `Amount Received: ₹${bill.amountReceived.toFixed(2)}\n` +
      `Balance: ₹${bill.balance.toFixed(2)}`

    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const BillDesktopMarkup = ({ pdf = false }: { pdf?: boolean }) => (
    <div
      className="mx-auto border border-slate-300 bg-white p-8"
      style={{
        width: `${DESKTOP_BILL_WIDTH}px`,
        minWidth: `${DESKTOP_BILL_WIDTH}px`,
        maxWidth: `${DESKTOP_BILL_WIDTH}px`,
        backgroundColor: '#ffffff',
        color: '#111827',
        boxShadow: pdf ? 'none' : '0 10px 25px rgba(0,0,0,0.08)',
      }}
    >
      <div className="border-b-[3px] border-slate-300 pb-4 text-center">
        <p
          {...(pdf ? { 'data-pdf-muted': 'true' } : {})}
          className="-mt-6 mb-6 text-lg font-semibold tracking-[0.3em] text-black-500"
        >
          INVOICE
        </p>

        <h1
          {...(pdf ? { 'data-pdf-title': true } : {})}
          className="text-4xl font-extrabold tracking-wider text-blue-900"
        >
          SHYAM DENTAL PHARMACY
        </h1>

        <p
          {...(pdf ? { 'data-pdf-muted': 'true' } : {})}
          className="mt-4 text-base text-slate-500"
        >
          MAIN ROAD, SRIBHUMI-788710 (ASSAM)
        </p>
        <p
          {...(pdf ? { 'data-pdf-muted': 'true' } : {})}
          className="text-base text-slate-500"
        >
          Phone: +91 8724071677 | Email: contactshyamdentalclinic@gmail.com
        </p>
        <p
          {...(pdf ? { 'data-pdf-muted': 'true' } : {})}
          className="text-base text-slate-500"
        >
          License No: D.L.NO:KMJ/ONL/R-1027&amp;1028
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-10">
        <div className="text-[18px] leading-8">
          <p className="font-bold">Invoice To:</p>
          <p className="break-words">{bill.customerName}</p>
          <p className="break-words">{bill.customerPhone}</p>
          <p className="break-words">{bill.customerAddress}</p>
        </div>

        <div className="text-right text-[18px] leading-8">
          <p>
            <span className="font-bold">Invoice No:</span> {bill.invoiceNo}
          </p>
          <p>
            <span className="font-bold">Date:</span>{' '}
            {new Date(bill.createdAt).toLocaleDateString('en-GB')}
          </p>
          <p>
            <span className="font-bold">Payment:</span> {bill.paymentMethod}
          </p>
        </div>
      </div>

      <div className="mt-8 overflow-hidden border border-slate-300">
        <table className="w-full text-[18px]">
          <thead
            {...(pdf ? { 'data-pdf-thead': true } : {})}
            className="bg-slate-200"
          >
            <tr>
              <th className="border-b px-4 py-3 text-left">SL</th>
              <th className="border-b px-4 py-3 text-left">Description</th>
              <th className="border-b px-4 py-3 text-center">Qty</th>
              <th className="border-b px-4 py-3 text-right">MRP</th>
              <th className="border-b px-4 py-3 text-center">Disc%</th>
              <th className="border-b px-4 py-3 text-right">Rate</th>
              <th className="border-b px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item) => (
              <tr key={item.sl}>
                <td className="border-b px-4 py-3">{item.sl}</td>
                <td className="border-b px-4 py-3">{item.description}</td>
                <td className="border-b px-4 py-3 text-center">{item.qty}</td>
                <td className="border-b px-4 py-3 text-right">₹{item.mrp.toFixed(2)}</td>
                <td className="border-b px-4 py-3 text-center">{item.discount}%</td>
                <td className="border-b px-4 py-3 text-right">₹{item.rate.toFixed(2)}</td>
                <td className="border-b px-4 py-3 text-right">₹{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex justify-end">
        <div className="w-full max-w-md space-y-3 text-[18px]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{bill.subtotal.toFixed(2)}</span>
          </div>
          <div
            {...(pdf ? { 'data-pdf-red': 'true' } : {})}
            className="flex justify-between text-red-500"
          >
            <span>Total Discount:</span>
            <span>-₹{bill.totalDiscount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Round Off:</span>
            <span>₹{bill.roundOff.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t-[3px] border-slate-300 pt-3 text-[20px] font-bold">
            <span>Grand Total:</span>
            <span>₹{bill.grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount Received:</span>
            <span>₹{bill.amountReceived.toFixed(2)}</span>
          </div>
          <div
            {...(pdf ? { 'data-pdf-red': 'true' } : {})}
            className="flex justify-between text-red-500"
          >
            <span>Due Balance:</span>
            <span>₹{bill.balance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div
        {...(pdf ? { 'data-pdf-softbg': 'true' } : {})}
        className="mt-8 rounded bg-slate-100 p-4"
      >
        <p className="text-[18px] font-bold">Amount in Words:</p>
        <p className="mt-1 text-[18px] italic">{bill.amountInWords}</p>
      </div>

      <div className="mt-8">
        <p className="text-[18px] font-bold">Terms & Conditions:</p>
        <p
          {...(pdf ? { 'data-pdf-muted': 'true' } : {})}
          className="mt-1 text-[18px] text-slate-600"
        >
          Thank you for your business! Please check medicines before leaving the counter.
        </p>
      </div>

      <div className="mt-16 flex items-end justify-between text-[18px]">
        <div className="w-[260px] shrink-0 text-center">
          <div className="h-16" />
          <div className="border-t border-slate-300 pt-3">Customer Signature</div>
        </div>

        <div className="w-[320px] shrink-0 text-center">
          <div
            {...(pdf ? { 'data-pdf-blue': 'true' } : {})}
            className="mb-3 font-semibold text-blue-900"
          >
            Shyam Dental Pharmacy
          </div>
          <div className="h-16" />
          <div className="border-t border-slate-300 pt-3">Authorized Signatory</div>
        </div>
      </div>

      <div className="mt-10 border-t pt-5 relative">

  {/* Center Content */}
  <div className="text-center">
    <p
      {...(pdf ? { 'data-pdf-muted': 'true' } : {})}
      className="text-[18px] text-slate-500"
    >
      Thank you for your business!
    </p>

    <p
      {...(pdf ? { 'data-pdf-red': 'true' } : {})}
      className="mt-1 text-[13px] tracking-wide text-red-500"
    >
      Powered by BN Tech Innovations
    </p>
  </div>

  {/* Right side QR */}
  <div className="mt-4 absolute right-50 top-1/2 -translate-y-1/2 flex flex-col items-center">
    <img
      src="/bnqr.png"
      alt="QR Code"
      className="h-10 w-10 object-contain"
    />
    <p className="mt-1 text-[11px] text-slate-500">
      Scan to contact us
    </p>
  </div>

</div>

<div className="mt-1 border-t border-dashed border-gray-400" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#eef1f4] px-3 py-4">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            <FileDown size={18} />
            {downloading ? 'Downloading...' : 'Download PDF'}
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-900"
          >
            <Printer size={18} />
            Print
          </button>

          <button
            onClick={shareWhatsApp}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
          >
            <MessageCircle size={18} />
            WhatsApp Share
          </button>
        </div>

        {/* Responsive exact desktop preview */}
        <div
          ref={previewOuterRef}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white/40 p-2 sm:p-4"
        >
          <div
            style={{
              height: scaledHeight || 'auto',
              position: 'relative',
            }}
          >
            <div
              ref={previewInnerRef}
              style={{
                width: `${DESKTOP_BILL_WIDTH}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              <BillDesktopMarkup />
            </div>
          </div>
        </div>

        {/* Hidden PDF template */}
        <div className="pointer-events-none fixed left-[-10000px] top-0 opacity-0">
          <div ref={pdfBillRef}>
            <BillDesktopMarkup pdf />
          </div>
        </div>
      </div>
    </div>
  )
} 