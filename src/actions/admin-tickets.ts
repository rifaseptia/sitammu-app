'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-guard'
import type { ApiResponse } from '@/types'

export interface TicketUsageItem {
    id: string
    category: string // 'anak' | 'dewasa' | 'wna' | Attraction Name
    block_no: string
    start_no: string
    end_no: string
    count: number
    report_date: string
    destination_name: string
    destination_id: string
}

/**
 * Get all ticket usage from all reports (including attractions)
 */
export async function getTicketUsage(adminUserId: string): Promise<ApiResponse<TicketUsageItem[]>> {
    try {
        // Validate admin access
        const auth = await requireAdmin(adminUserId)
        if (!auth.success) {
            return { success: false, error: auth.error }
        }

        const supabase = await createClient()
        const ticketUsage: TicketUsageItem[] = []

        // 1. Fetch MAIN reports (Tiket Masuk)
        const { data: reports, error } = await supabase
            .from('daily_reports')
            .select(`
                id,
                report_date,
                ticket_blocks,
                destination:destinations(id, name)
            `)
            .not('ticket_blocks', 'is', null)
            .order('report_date', { ascending: false })

        if (error) throw error

        reports?.forEach((report: any) => {
            if (!report.ticket_blocks || !Array.isArray(report.ticket_blocks)) return

            report.ticket_blocks.forEach((block: any, index: number) => {
                ticketUsage.push({
                    id: `main-${report.id}-${index}`,
                    category: block.category || 'dewasa',
                    block_no: block.block_no || '',
                    start_no: block.start_no || '',
                    end_no: block.end_no || '',
                    count: block.count || 0,
                    report_date: report.report_date,
                    destination_name: report.destination?.name || 'Unknown',
                    destination_id: report.destination?.id || '',
                })
            })
        })

        // 2. Fetch ATTRACTION reports
        const { data: attReports, error: attError } = await supabase
            .from('attraction_reports')
            .select(`
                id,
                ticket_blocks,
                attraction:attractions(name),
                report:daily_reports(
                    report_date,
                    destination:destinations(id, name)
                )
            `)
            .not('ticket_blocks', 'is', null)
        // We can't easily sort by joined validation date here without a complex join, 
        // but we'll sort the final array in JS.

        if (attError) {
            console.error('Error fetching attraction reports:', attError)
            // Continue with just main reports if attraction fails
        } else {
            attReports?.forEach((ar: any) => {
                if (!ar.ticket_blocks || !Array.isArray(ar.ticket_blocks)) return
                // Check if empty array
                if (ar.ticket_blocks.length === 0) return

                const reportDate = ar.report?.report_date
                // If the parent report was deleted, report might be null (cascade delete should prevent this but safer to check)
                if (!reportDate) return

                ar.ticket_blocks.forEach((block: any, index: number) => {
                    ticketUsage.push({
                        id: `att-${ar.id}-${index}`,
                        category: ar.attraction?.name || 'Atraksi',
                        block_no: block.block_no || '',
                        start_no: block.start_no || '',
                        end_no: block.end_no || '',
                        count: block.count || 0,
                        report_date: reportDate,
                        destination_name: ar.report?.destination?.name || 'Unknown',
                        destination_id: ar.report?.destination?.id || '',
                    })
                })
            })
        }

        // Sort by date DESC
        ticketUsage.sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime())

        return { success: true, data: ticketUsage }
    } catch (error) {
        console.error('Get ticket usage error:', error)
        return { success: false, error: 'Gagal memuat data tiket' }
    }
}
