import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import type { Car, Client, Rental } from '../types'
import { BUSINESS_OWNER } from '../config/business'
import { daysBetween, formatDate, todayISO } from './dates'
import { deriveRentalStatus, getEffectiveRentalCost, getRentalDailyRate } from './calculations'
import { formatNumber } from './format'

// A4 width at 96dpi, used as the off-screen render width so 1px ≈ 1/96in.
const PAGE_WIDTH_PX = 794
const MARGIN_PX = 76
const CONTENT_WIDTH_PX = PAGE_WIDTH_PX - MARGIN_PX * 2
const PAGE_WIDTH_MM = 210

export interface ReceiptLabels {
  title: string
  receiptNo: string
  returnDate: string
  vehicle: string
  makeModel: string
  year: string
  licensePlate: string
  client: string
  phone: string
  rentalDetails: string
  rentalPeriod: string
  periodSeparator: string
  dailyRate: string
  duration: string
  formatDays: (count: number) => string
  totalPaid: string
  status: string
  statusActive: string
  statusOverdue: string
  statusCompleted: string
  openEnded: string
  pendingReturn: string
  unknownCar: string
  unknownClient: string
  thankYou: string
}

interface ReceiptParams {
  rental: Rental
  car: Car | undefined
  client: Client | undefined
  locale: string
  labels: ReceiptLabels
}

function buildReceiptElement({ rental, car, client, locale, labels }: ReceiptParams): HTMLDivElement {
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  const fontFamily =
    locale === 'ar'
      ? '"Noto Sans Arabic", "Inter", sans-serif'
      : '"Inter", sans-serif'

  const root = document.createElement('div')
  root.style.width = `${PAGE_WIDTH_PX}px`
  root.style.background = '#ffffff'
  root.style.fontFamily = fontFamily
  root.style.color = '#3c3c3c'

  const text = (
    parent: HTMLElement,
    value: string,
    style: Partial<CSSStyleDeclaration>,
    textDir: 'ltr' | 'rtl' | 'fixed' = 'fixed',
  ) => {
    const el = document.createElement('div')
    el.textContent = value
    el.setAttribute('dir', textDir === 'fixed' ? dir : textDir)
    Object.assign(el.style, { textAlign: 'left', ...style })
    parent.appendChild(el)
    return el
  }

  // Header
  const header = document.createElement('div')
  Object.assign(header.style, {
    background: 'rgb(79, 70, 229)',
    height: '136px',
    padding: `0 ${MARGIN_PX}px`,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  })
  text(header, labels.title, { color: '#ffffff', fontSize: '24px', fontWeight: '700' })
  text(header, BUSINESS_OWNER, { color: '#ffffff', fontSize: '13px', marginTop: '8px' }, 'ltr')
  root.appendChild(header)

  const body = document.createElement('div')
  Object.assign(body.style, {
    padding: `24px ${MARGIN_PX}px 32px`,
    boxSizing: 'border-box',
  })
  root.appendChild(body)

  const addRow = (label: string, value: string | number | null | undefined, valueDir: 'ltr' | 'rtl' | 'fixed' = 'fixed') => {
    const row = document.createElement('div')
    Object.assign(row.style, {
      display: 'flex',
      gap: '12px',
      marginBottom: '10px',
      lineHeight: '1.4',
    })
    const labelEl = text(row, label, {
      flex: `0 0 208px`,
      fontSize: '13px',
      fontWeight: '700',
      color: 'rgb(113, 113, 122)',
    })
    labelEl.style.width = '208px'
    text(
      row,
      String(value ?? '—'),
      { flex: '1', fontSize: '13px', color: 'rgb(39, 39, 42)' },
      valueDir,
    )
    body.appendChild(row)
  }

  const addSectionTitle = (title: string) => {
    const wrap = document.createElement('div')
    Object.assign(wrap.style, {
      borderTop: '1px solid rgb(99, 102, 241)',
      marginTop: '16px',
      paddingTop: '12px',
      marginBottom: '8px',
    })
    text(wrap, title, { fontSize: '15px', fontWeight: '700', color: 'rgb(24, 24, 27)' })
    body.appendChild(wrap)
  }

  const effectiveEndDate = rental.endDate ?? todayISO()
  const duration = daysBetween(rental.startDate, effectiveEndDate)
  const total = getEffectiveRentalCost(rental, car)
  const rentalStatus = deriveRentalStatus(rental)
  const statusLabels: Record<string, string> = {
    Active: labels.statusActive,
    Overdue: labels.statusOverdue,
    Completed: labels.statusCompleted,
  }

  addRow(labels.receiptNo, rental.id.slice(-8).toUpperCase(), 'ltr')
  addRow(labels.returnDate, rental.endDate ? formatDate(rental.endDate, locale) : labels.pendingReturn)

  addSectionTitle(labels.vehicle)
  if (car) {
    addRow(labels.makeModel, `${car.make} ${car.model}`)
    addRow(labels.year, car.year, 'ltr')
    addRow(labels.licensePlate, car.licensePlate, 'ltr')
  } else {
    addRow(labels.vehicle, labels.unknownCar)
  }

  addSectionTitle(labels.client)
  if (client) {
    addRow(labels.client, client.fullName)
    addRow(labels.phone, client.phone, 'ltr')
  } else {
    addRow(labels.client, labels.unknownClient)
  }

  addSectionTitle(labels.rentalDetails)
  const dailyRate = getRentalDailyRate(rental, car)
  const periodEnd = rental.endDate ? formatDate(rental.endDate, locale) : labels.openEnded
  addRow(
    labels.rentalPeriod,
    `${formatDate(rental.startDate, locale)} ${labels.periodSeparator} ${periodEnd}`,
  )
  addRow(
    labels.dailyRate,
    `$${formatNumber(dailyRate, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  )
  addRow(labels.duration, labels.formatDays(duration))
  addRow(labels.status, statusLabels[rentalStatus] ?? rentalStatus)

  const totalBox = document.createElement('div')
  Object.assign(totalBox.style, {
    background: 'rgb(238, 242, 255)',
    borderRadius: '6px',
    padding: '16px 24px',
    marginTop: '16px',
    boxSizing: 'border-box',
    width: `${CONTENT_WIDTH_PX}px`,
  })
  text(totalBox, labels.totalPaid, { fontSize: '15px', fontWeight: '700', color: 'rgb(79, 70, 229)' })
  text(
    totalBox,
    `$${formatNumber(total, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    { fontSize: '21px', fontWeight: '700', color: 'rgb(24, 24, 27)', marginTop: '6px' },
  )
  body.appendChild(totalBox)

  text(body, labels.thankYou, { fontSize: '12px', color: 'rgb(113, 113, 122)', marginTop: '24px' })

  return root
}

export async function downloadRentalReceipt({ rental, car, client, locale, labels }: ReceiptParams): Promise<void> {
  const element = buildReceiptElement({ rental, car, client, locale, labels })
  Object.assign(element.style, { position: 'fixed', top: '0', left: '-10000px' })
  document.body.appendChild(element)

  // html2canvas 1.x can't parse oklch(), which Tailwind v4's utility classes on
  // <body> resolve to. Pin body to legacy rgb colors for the duration of the
  // capture so its ancestor background/color don't trip html2canvas's parser.
  const prevBodyBackground = document.body.style.backgroundColor
  const prevBodyColor = document.body.style.color
  document.body.style.backgroundColor = '#fafafa'
  document.body.style.color = '#18181b'

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready
    }
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
    const imgData = canvas.toDataURL('image/png')
    const pageHeightMm = (canvas.height / canvas.width) * PAGE_WIDTH_MM
    const doc = new jsPDF({ unit: 'mm', format: [PAGE_WIDTH_MM, pageHeightMm] })
    doc.addImage(imgData, 'PNG', 0, 0, PAGE_WIDTH_MM, pageHeightMm)

    const plate = car?.licensePlate?.replace(/\s+/g, '-') ?? 'rental'
    const dateStamp = new Date().toISOString().split('T')[0]
    doc.save(`receipt-${plate}-${dateStamp}.pdf`)
  } finally {
    document.body.style.backgroundColor = prevBodyBackground
    document.body.style.color = prevBodyColor
    document.body.removeChild(element)
  }
}
