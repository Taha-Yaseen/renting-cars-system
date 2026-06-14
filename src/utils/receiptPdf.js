import { jsPDF } from 'jspdf'
import { BUSINESS_OWNER } from '../config/business'
import { daysBetween, formatDate, todayISO } from './dates'
import { deriveRentalStatus, getEffectiveRentalCost, getRentalDailyRate } from './calculations'
import { formatNumber } from './format'

const MARGIN = 20
const PAGE_WIDTH = 210
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

/**
 * @param {Object} params
 * @param {import('../types').Rental} params.rental
 * @param {import('../types').Car | undefined} params.car
 * @param {import('../types').Client | undefined} params.client
 * @param {string} params.locale
 * @param {Record<string, string>} params.labels
 */
export function downloadRentalReceipt({ rental, car, client, locale, labels }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = MARGIN

  const addLine = (text, options = {}) => {
    const {
      size = 10,
      style = 'normal',
      color = [60, 60, 60],
      gap = 6,
    } = options
    doc.setFontSize(size)
    doc.setFont('helvetica', style)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(String(text), CONTENT_WIDTH)
    doc.text(lines, MARGIN, y)
    y += lines.length * (size * 0.45) + gap
  }

  const addSectionTitle = (title) => {
    y += 2
    doc.setDrawColor(99, 102, 241)
    doc.setLineWidth(0.4)
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
    y += 8
    addLine(title, { size: 11, style: 'bold', color: [24, 24, 27], gap: 4 })
  }

  const addRow = (label, value) => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(113, 113, 122)
    doc.text(label, MARGIN, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(39, 39, 42)
    const valueLines = doc.splitTextToSize(String(value ?? '—'), CONTENT_WIDTH - 55)
    doc.text(valueLines, MARGIN + 55, y)
    y += Math.max(6, valueLines.length * 4.5)
  }

  doc.setFillColor(79, 70, 229)
  doc.rect(0, 0, PAGE_WIDTH, 36, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(labels.title, MARGIN, 16)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(BUSINESS_OWNER, MARGIN, 26)

  const effectiveEndDate = rental.endDate ?? todayISO()
  const duration = daysBetween(rental.startDate, effectiveEndDate)
  const total = getEffectiveRentalCost(rental, car)
  const rentalStatus = deriveRentalStatus(rental)
  const statusLabels = {
    Active: labels.statusActive,
    Overdue: labels.statusOverdue,
    Completed: labels.statusCompleted,
  }

  y = 48
  addRow(labels.receiptNo, rental.id.slice(-8).toUpperCase())
  addRow(
    labels.returnDate,
    rental.endDate ? formatDate(rental.endDate, locale) : labels.pendingReturn,
  )

  addSectionTitle(labels.vehicle)
  if (car) {
    addRow(labels.makeModel, `${car.make} ${car.model}`)
    addRow(labels.year, formatNumber(car.year, locale))
    addRow(labels.licensePlate, car.licensePlate)
  } else {
    addRow(labels.vehicle, labels.unknownCar)
  }

  addSectionTitle(labels.client)
  if (client) {
    addRow(labels.client, client.fullName)
    addRow(labels.phone, client.phone)
  } else {
    addRow(labels.client, labels.unknownClient)
  }

  addSectionTitle(labels.rentalDetails)
  const dailyRate = getRentalDailyRate(rental, car)
  const periodEnd = rental.endDate
    ? formatDate(rental.endDate, locale)
    : labels.openEnded
  addRow(
    labels.rentalPeriod,
    `${formatDate(rental.startDate, locale)} → ${periodEnd}`,
  )
  addRow(labels.dailyRate, `$${formatNumber(dailyRate, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
  addRow(labels.duration, labels.formatDays(duration))
  addRow(labels.status, statusLabels[rentalStatus] ?? rentalStatus)

  y += 4
  doc.setFillColor(238, 242, 255)
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 22, 2, 2, 'F')
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(79, 70, 229)
  doc.text(labels.totalPaid, MARGIN + 6, y + 10)
  doc.setFontSize(16)
  doc.setTextColor(24, 24, 27)
  doc.text(`$${formatNumber(total, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, MARGIN + 6, y + 18)

  y += 32
  addLine(labels.thankYou, { size: 9, color: [113, 113, 122], gap: 0 })

  const plate = car?.licensePlate?.replace(/\s+/g, '-') ?? 'rental'
  const dateStamp = new Date().toISOString().split('T')[0]
  doc.save(`receipt-${plate}-${dateStamp}.pdf`)
}
