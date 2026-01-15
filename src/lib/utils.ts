import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

/**
 * Merge Tailwind classes dengan clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// Format Currency
// ============================================

/**
 * Format angka ke Rupiah
 * @example formatRupiah(15000) => "Rp 15.000"
 * @example formatRupiah(15000, { prefix: false }) => "15.000"
 */
export function formatRupiah(
  amount: number,
  options?: { prefix?: boolean; compact?: boolean }
): string {
  const { prefix = true, compact = false } = options ?? {}

  if (compact && amount >= 1000000) {
    const value = amount / 1000000
    return `${prefix ? 'Rp ' : ''}${value.toLocaleString('id-ID')} jt`
  }

  if (compact && amount >= 1000) {
    const value = amount / 1000
    return `${prefix ? 'Rp ' : ''}${value.toLocaleString('id-ID')} rb`
  }

  const formatted = amount.toLocaleString('id-ID')
  return prefix ? `Rp ${formatted}` : formatted
}

/**
 * Parse string Rupiah ke number
 * @example parseRupiah("Rp 15.000") => 15000
 */
export function parseRupiah(value: string): number {
  return parseInt(value.replace(/[^\d]/g, ''), 10) || 0
}

// ============================================
// Format Date & Time
// ============================================

/**
 * Format tanggal ke format Indonesia
 * @example formatDate(new Date()) => "Jumat, 10 Januari 2025"
 */
export function formatDate(
  date: Date | string,
  formatStr: string = 'EEEE, dd MMMM yyyy'
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, formatStr, { locale: id })
}

/**
 * Format tanggal pendek
 * @example formatDateShort(new Date()) => "10 Jan 2025"
 */
export function formatDateShort(date: Date | string): string {
  return formatDate(date, 'dd MMM yyyy')
}

/**
 * Format waktu
 * @example formatTime(new Date()) => "18:30"
 */
export function formatTime(date: Date | string): string {
  return formatDate(date, 'HH:mm')
}

/**
 * Format waktu relatif
 * @example formatRelativeTime(new Date()) => "baru saja"
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: id })
}

/**
 * Get tanggal hari ini dalam format YYYY-MM-DD (WIB timezone)
 * Fixed for Vercel server which uses UTC
 */
export function getTodayDateString(): string {
  // Use Asia/Jakarta timezone (WIB = UTC+7)
  const now = new Date()
  const wibDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  const year = wibDate.getFullYear()
  const month = String(wibDate.getMonth() + 1).padStart(2, '0')
  const day = String(wibDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ============================================
// Number Formatting
// ============================================

/**
 * Format angka dengan separator ribuan
 * @example formatNumber(1500) => "1.500"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('id-ID')
}

/**
 * Hitung persentase
 * @example calculatePercentage(25, 100) => 25
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

/**
 * Format persentase
 * @example formatPercentage(25, 100) => "25%"
 */
export function formatPercentage(value: number, total: number): string {
  return `${calculatePercentage(value, total)}%`
}

// ============================================
// Validation Helpers
// ============================================

/**
 * Validasi jumlah dewasa dengan gender
 */
export function validateDewasaGender(
  total: number,
  male: number,
  female: number
): boolean {
  return male + female === total
}

/**
 * Validasi jumlah WNA dengan negara
 */
export function validateWnaCountries(
  total: number,
  countries: Record<string, number>
): boolean {
  const sum = Object.values(countries).reduce((acc, val) => acc + val, 0)
  return sum === total
}

/**
 * Validasi pembayaran
 */
export function validatePayment(
  totalRevenue: number,
  cash: number,
  qris: number
): boolean {
  return cash + qris === totalRevenue
}

// ============================================
// String Helpers
// ============================================

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Generate greeting berdasarkan waktu (WIB)
 */
export function getGreeting(): string {
  const now = new Date()
  const wibDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  const hour = wibDate.getHours()
  if (hour < 12) return 'Selamat Pagi'
  if (hour < 15) return 'Selamat Siang'
  if (hour < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}
