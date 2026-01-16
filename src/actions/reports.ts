'use server'

import { createAdminClient } from '@/lib/supabase/server'
import type { ApiResponse, TodayReportStatus, DailyReport } from '@/types'
import { getTodayDateString } from '@/lib/utils'

/**
 * Get today's report status for a destination
 */
export async function getTodayReportStatus(
    destinationId: string
): Promise<ApiResponse<TodayReportStatus>> {
    try {
        const supabase = createAdminClient()
        const today = getTodayDateString()

        // Get destination info
        const { data: destination, error: destError } = await supabase
            .from('destinations')
            .select('id, code, name')
            .eq('id', destinationId)
            .single()

        if (destError || !destination) {
            return { success: false, error: 'Destinasi tidak ditemukan' }
        }

        // Get today's report if exists
        const { data: report, error: reportError } = await supabase
            .from('daily_reports')
            .select('id, status, total_visitors, total_revenue, submitted_at')
            .eq('destination_id', destinationId)
            .eq('report_date', today)
            .maybeSingle()

        const status: TodayReportStatus = {
            destination_id: destination.id,
            code: destination.code,
            name: destination.name,
            report_id: report?.id ?? null,
            status: report?.status ?? null,
            total_visitors: report?.total_visitors ?? null,
            total_revenue: report?.total_revenue ?? null,
            submitted_at: report?.submitted_at ?? null,
            daily_status: !report ? 'pending' : report.status === 'draft' ? 'draft' : 'submitted',
        }

        return { success: true, data: status }
    } catch (error) {
        console.error('Get today report status error:', error)
        return { success: false, error: 'Gagal memuat status' }
    }
}

/**
 * Get today's report for a destination
 */
export async function getTodayReport(
    destinationId: string
): Promise<ApiResponse<DailyReport | null>> {
    try {
        const supabase = createAdminClient()
        const today = getTodayDateString()

        const { data, error } = await supabase
            .from('daily_reports')
            .select('*')
            .eq('destination_id', destinationId)
            .eq('report_date', today)
            .maybeSingle()

        if (error) throw error

        return { success: true, data }
    } catch (error) {
        console.error('Get today report error:', error)
        return { success: false, error: 'Gagal memuat laporan' }
    }
}

/**
 * Get report for a specific date
 */
export async function getReportByDate(
    destinationId: string,
    reportDate: string
): Promise<ApiResponse<DailyReport | null>> {
    try {
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('daily_reports')
            .select('*')
            .eq('destination_id', destinationId)
            .eq('report_date', reportDate)
            .maybeSingle()

        if (error) throw error

        return { success: true, data }
    } catch (error) {
        console.error('Get report by date error:', error)
        return { success: false, error: 'Gagal memuat laporan' }
    }
}

/**
 * Get recent reports for a destination
 */
export async function getRecentReports(
    destinationId: string,
    limit: number = 7
): Promise<ApiResponse<DailyReport[]>> {
    try {
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('daily_reports')
            .select('*')
            .eq('destination_id', destinationId)
            .order('report_date', { ascending: false })
            .limit(limit)

        if (error) throw error

        return { success: true, data: data ?? [] }
    } catch (error) {
        console.error('Get recent reports error:', error)
        return { success: false, error: 'Gagal memuat riwayat' }
    }
}
