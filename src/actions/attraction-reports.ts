'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, AttractionReport } from '@/types'

/**
 * Get attraction reports for a specific daily report
 */
export async function getAttractionReports(
    reportId: string
): Promise<ApiResponse<AttractionReport[]>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('attraction_reports')
            .select('*')
            .eq('report_id', reportId)

        if (error) throw error

        return { success: true, data: data ?? [] }
    } catch (error: any) {
        console.error('Get attraction reports error:', error)
        return { success: false, error: error?.message || 'Gagal memuat data atraksi' }
    }
}

/**
 * Save attraction report (upsert)
 */
export async function saveAttractionReport(input: {
    report_id: string
    attraction_id: string
    visitor_count: number
    ticket_blocks: any[]
    revenue: number
}): Promise<ApiResponse<AttractionReport>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('attraction_reports')
            .upsert({
                report_id: input.report_id,
                attraction_id: input.attraction_id,
                visitor_count: input.visitor_count,
                ticket_blocks: input.ticket_blocks,
                revenue: input.revenue,
            }, {
                onConflict: 'report_id,attraction_id'
            })
            .select()
            .single()

        if (error) throw error

        return { success: true, data }
    } catch (error: any) {
        console.error('Save attraction report error:', error)
        return { success: false, error: error?.message || 'Gagal menyimpan data atraksi' }
    }
}

/**
 * Save multiple attraction reports at once
 */
export async function saveAllAttractionReports(
    reportId: string,
    attractionData: Array<{
        attraction_id: string
        visitor_count: number
        ticket_blocks: any[]
        revenue: number
    }>
): Promise<ApiResponse<null>> {
    try {
        const supabase = await createClient()

        // Prepare data with report_id
        const records = attractionData.map(item => ({
            report_id: reportId,
            attraction_id: item.attraction_id,
            visitor_count: item.visitor_count,
            ticket_blocks: item.ticket_blocks,
            revenue: item.revenue,
        }))

        // Delete existing and insert new (simpler than upsert for multiple)
        await supabase
            .from('attraction_reports')
            .delete()
            .eq('report_id', reportId)

        if (records.length > 0) {
            const { error } = await supabase
                .from('attraction_reports')
                .insert(records)

            if (error) throw error
        }

        return { success: true, data: null }
    } catch (error: any) {
        console.error('Save all attraction reports error:', error)
        return { success: false, error: error?.message || 'Gagal menyimpan data atraksi' }
    }
}
