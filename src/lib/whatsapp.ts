// ============================================
// WhatsApp Message Generator for Daily Reports
// ============================================

import { formatRupiah, formatDate, formatNumber } from './utils'
import { POPULAR_COUNTRIES } from './constants'
import type { DailyReport, Destination } from '@/types'

/**
 * Get country name from code
 */
function getCountryName(code: string): string {
    return POPULAR_COUNTRIES.find(c => c.code === code)?.name || code
}

/**
 * Generate WhatsApp message for a daily report
 * Format sesuai requirement dengan format bold
 */
export function generateWhatsAppMessage(
    report: DailyReport,
    destination: Destination,
    attractionReports?: Array<{
        attraction_name: string
        revenue: number
        visitor_count: number
        is_toilet?: boolean
        ticket_blocks?: Array<{
            block_no: string
            start_no: string
            end_no: string
            count: number
        }>
    }>
): string {
    const lines: string[] = []

    // Header
    lines.push(`*LAPORAN HARIAN RETRIBUSI DESTINASI WISATA*`)
    lines.push(`${destination.name}`)
    lines.push(`Tanggal: ${formatDate(report.report_date, 'dd MMMM yyyy')}`)
    lines.push('')

    // Separator
    lines.push('━━━━━━━━━━━━━━━━━━━━')
    lines.push('')

    // Visitor Summary
    lines.push('*PENGUNJUNG*')
    lines.push(`• Anak-anak: ${formatNumber(report.anak_count)} orang`)
    // Add anak gender if available
    const anakMale = (report as any).anak_male ?? 0
    const anakFemale = (report as any).anak_female ?? 0
    if (report.anak_count > 0 && (anakMale > 0 || anakFemale > 0)) {
        lines.push(`  - Laki-laki: ${formatNumber(anakMale)}`)
        lines.push(`  - Perempuan: ${formatNumber(anakFemale)}`)
    }
    lines.push(`• Dewasa: ${formatNumber(report.dewasa_count)} orang`)
    lines.push(`  - Laki-laki: ${formatNumber(report.dewasa_male)}`)
    lines.push(`  - Perempuan: ${formatNumber(report.dewasa_female)}`)
    lines.push(`• WNA: ${formatNumber(report.wna_count)} orang`)

    // WNA Countries breakdown
    if (report.wna_count > 0 && report.wna_countries) {
        const countries = report.wna_countries as Record<string, number>
        const countryList = Object.entries(countries)
            .map(([code, count]) => `${getCountryName(code)}: ${count}`)
            .join(', ')
        lines.push(`  (${countryList})`)
    }

    lines.push('')
    lines.push(`*Total Pengunjung: ${formatNumber(report.total_visitors)} orang*`)
    lines.push('')

    // Separator
    lines.push('━━━━━━━━━━━━━━━━━━━━')
    lines.push('')

    // Ticket blocks
    const ticketBlocks = (report as any).ticket_blocks as Array<{
        category: string
        block_no: string
        start_no: string
        end_no: string
        count: number
    }> | undefined

    if (ticketBlocks && ticketBlocks.length > 0) {
        lines.push('━━━━━━━━━━━━━━━━━━━━')
        lines.push('')
        lines.push('*DATA TIKET*')

        const anakBlocks = ticketBlocks.filter(b => b.category === 'anak')
        const dewasaBlocks = ticketBlocks.filter(b => b.category === 'dewasa')
        const wnaBlocks = ticketBlocks.filter(b => b.category === 'wna')

        if (anakBlocks.length > 0) {
            lines.push('• Tiket Anak:')
            anakBlocks.forEach(b => {
                lines.push(`  Blok ${b.block_no}: ${b.start_no} - ${b.end_no} (${b.count} tiket)`)
            })
        }

        if (dewasaBlocks.length > 0) {
            lines.push('• Tiket Dewasa:')
            dewasaBlocks.forEach(b => {
                lines.push(`  Blok ${b.block_no}: ${b.start_no} - ${b.end_no} (${b.count} tiket)`)
            })
        }

        if (wnaBlocks.length > 0) {
            lines.push('• Tiket WNA:')
            wnaBlocks.forEach(b => {
                lines.push(`  Blok ${b.block_no}: ${b.start_no} - ${b.end_no} (${b.count} tiket)`)
            })
        }
        lines.push('')
    }

    // Attraction/Toilet Ticket Blocks
    if (attractionReports && attractionReports.some(a => a.ticket_blocks && a.ticket_blocks.length > 0)) {
        lines.push('━━━━━━━━━━━━━━━━━━━━')
        lines.push('')
        lines.push('*DATA TIKET ATRAKSI/TOILET*')

        attractionReports.forEach(att => {
            if (att.ticket_blocks && att.ticket_blocks.length > 0) {
                lines.push(`• ${att.attraction_name}:`)
                att.ticket_blocks.forEach(b => {
                    lines.push(`  Blok ${b.block_no}: ${b.start_no} - ${b.end_no} (${b.count} tiket)`)
                })
            } else if (att.visitor_count > 0) {
                // For non-ticket attractions like Toilet
                lines.push(`• ${att.attraction_name}: ${formatNumber(att.visitor_count)} pengunjung`)
            }
        })
        lines.push('')
    }

    // Notes
    if (report.notes) {
        lines.push('━━━━━━━━━━━━━━━━━━━━')
        lines.push('')
        lines.push('*CATATAN*')
        lines.push(report.notes)
        lines.push('')
    }

    // Revenue Breakdown Summary (NEW)
    lines.push('━━━━━━━━━━━━━━━━━━━━')
    lines.push('')
    lines.push('*RINGKASAN PENDAPATAN*')

    // Revenue Summary
    lines.push('*PENDAPATAN*')
    lines.push(`• Anak-anak: ${formatRupiah(report.anak_revenue)}`)
    lines.push(`• Dewasa: ${formatRupiah(report.dewasa_revenue)}`)
    lines.push(`• WNA: ${formatRupiah(report.wna_revenue)}`)

    // Payment breakdown
    lines.push('*PEMBAYARAN*')
    lines.push(`• Cash: ${formatRupiah(report.cash_amount)}`)
    lines.push(`• QRIS: ${formatRupiah(report.qris_amount)}`)
    lines.push('')
    lines.push(`*Total Pendapatan: ${formatRupiah(report.total_revenue)}*`)
    lines.push('')

    // Total tiket masuk = anak + dewasa + wna revenue
    const totalTiketMasuk = report.anak_revenue + report.dewasa_revenue + report.wna_revenue
    lines.push(`• Total Tiket Masuk: ${formatRupiah(totalTiketMasuk)}`)

    // Calculate attraction and toilet totals from attractionReports if provided
    if (attractionReports && attractionReports.length > 0) {
        const toiletReports = attractionReports.filter(a => a.is_toilet || a.attraction_name.toLowerCase().includes('toilet'))
        const atraksiReports = attractionReports.filter(a => !a.is_toilet && !a.attraction_name.toLowerCase().includes('toilet'))

        const totalAtraksi = atraksiReports.reduce((sum, a) => sum + a.revenue, 0)
        const totalToilet = toiletReports.reduce((sum, a) => sum + a.revenue, 0)

        if (totalAtraksi > 0) {
            lines.push(`• Total Tiket Atraksi: ${formatRupiah(totalAtraksi)}`)
        }
        if (totalToilet > 0) {
            lines.push(`• Total Tiket Toilet: ${formatRupiah(totalToilet)}`)
        }
    } else if ((report as any).attraction_revenue && (report as any).attraction_revenue > 0) {
        // Fallback: use attraction_revenue from report if no detailed breakdown
        lines.push(`• Total Atraksi/Toilet: ${formatRupiah((report as any).attraction_revenue)}`)
    }

    lines.push('')
    lines.push(`*Grand Total: ${formatRupiah(report.total_revenue)}*`)
    lines.push('')

    // Footer
    lines.push('━━━━━━━━━━━━━━━━━━━━')
    lines.push('_Dikirim via SITAMMU APP_')

    return lines.join('\n')
}

/**
 * Open WhatsApp with pre-filled message
 * Works on both mobile and desktop
 */
export function shareToWhatsApp(message: string): void {
    const encodedMessage = encodeURIComponent(message)
    const waUrl = `https://wa.me/?text=${encodedMessage}`

    // Open in new window/tab
    window.open(waUrl, '_blank')
}

/**
 * Copy message to clipboard
 */
export async function copyToClipboard(message: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(message)
        return true
    } catch (error) {
        console.error('Failed to copy:', error)
        return false
    }
}
