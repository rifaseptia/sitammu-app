'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

export interface TicketUsageItem {
    id: string
    category: 'anak' | 'dewasa' | 'wna'
    block_no: string
    start_no: string
    end_no: string
    count: number
    report_date: string
    destination_name: string
    destination_id: string
}

/**
 * Get all ticket usage from all reports
 */
export async function getTicketUsage(): Promise<ApiResponse<TicketUsageItem[]>> {
    try {
        const supabase = await createClient()

        // Fetch all reports with their destinations
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

        // Flatten ticket blocks from all reports
        const ticketUsage: TicketUsageItem[] = []

        reports?.forEach((report: any) => {
            if (!report.ticket_blocks || !Array.isArray(report.ticket_blocks)) return

            report.ticket_blocks.forEach((block: any, index: number) => {
                ticketUsage.push({
                    id: `${report.id}-${index}`,
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

        return { success: true, data: ticketUsage }
    } catch (error) {
        console.error('Get ticket usage error:', error)
        return { success: false, error: 'Gagal memuat data tiket' }
    }
}
