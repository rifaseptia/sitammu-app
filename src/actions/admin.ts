'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, TodayReportStatus } from '@/types'

/**
 * Get all destinations with today's report status
 */
export async function getAllDestinationsStatus(): Promise<ApiResponse<TodayReportStatus[]>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('v_today_report_status')
            .select('*')
            .order('name')

        if (error) throw error

        return {
            success: true,
            data: data ?? [],
        }
    } catch (error) {
        console.error('Get all destinations status error:', error)
        return {
            success: false,
            error: 'Gagal memuat status destinasi',
        }
    }
}

/**
 * Get summary statistics for admin dashboard
 */
export async function getAdminSummary(): Promise<ApiResponse<{
    totalDestinations: number
    totalVisitorsToday: number
    totalRevenueToday: number
    submittedCount: number
    pendingCount: number
    draftCount: number
}>> {
    try {
        const supabase = await createClient()

        // Get today's status for all destinations
        const { data: todayStatus, error: statusError } = await supabase
            .from('v_today_report_status')
            .select('*')

        if (statusError) throw statusError

        const destinations = todayStatus ?? []

        // Calculate summary
        let totalVisitorsToday = 0
        let totalRevenueToday = 0
        let submittedCount = 0
        let pendingCount = 0
        let draftCount = 0

        destinations.forEach(d => {
            if (d.daily_status === 'submitted') {
                submittedCount++
                totalVisitorsToday += d.total_visitors || 0
                totalRevenueToday += d.total_revenue || 0
            } else if (d.daily_status === 'draft') {
                draftCount++
            } else {
                pendingCount++
            }
        })

        return {
            success: true,
            data: {
                totalDestinations: destinations.length,
                totalVisitorsToday,
                totalRevenueToday,
                submittedCount,
                pendingCount,
                draftCount,
            },
        }
    } catch (error) {
        console.error('Get admin summary error:', error)
        return {
            success: false,
            error: 'Gagal memuat ringkasan',
        }
    }
}

/**
 * Get weekly summary data for all destinations
 */
export async function getWeeklySummary(): Promise<ApiResponse<{
    destination_id: string
    code: string
    name: string
    week_start: string
    report_count: number
    total_visitors: number
    total_revenue: number
}[]>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('v_weekly_summary')
            .select('*')
            .order('week_start', { ascending: false })
            .limit(21) // 3 destinations × 7 weeks

        if (error) throw error

        return {
            success: true,
            data: data ?? [],
        }
    } catch (error) {
        console.error('Get weekly summary error:', error)
        return {
            success: false,
            error: 'Gagal memuat ringkasan mingguan',
        }
    }
}
