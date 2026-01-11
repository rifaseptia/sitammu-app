'use server'

import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

interface MonthlyStats {
    month: string // YYYY-MM
    total_visitors: number
    total_revenue: number
    anak_count: number
    dewasa_count: number
    wna_count: number
    cash_amount: number
    qris_amount: number
    report_count: number
}

interface DestinationRanking {
    destination_id: string
    destination_name: string
    destination_code: string
    total_visitors: number
    total_revenue: number
    report_count: number
}

interface DemographicStats {
    total_anak: number
    total_dewasa: number
    total_wna: number
    dewasa_male: number
    dewasa_female: number
    anak_male: number
    anak_female: number
}

interface PaymentStats {
    total_cash: number
    total_qris: number
    cash_percentage: number
    qris_percentage: number
}

/**
 * Get monthly statistics for a given year
 */
export async function getMonthlyStats(year?: number, destinationId?: string): Promise<ApiResponse<MonthlyStats[]>> {
    try {
        const supabase = await createClient()
        const targetYear = year || new Date().getFullYear()

        let query = supabase
            .from('daily_reports')
            .select('*')
            .gte('report_date', `${targetYear}-01-01`)
            .lte('report_date', `${targetYear}-12-31`)
            .eq('status', 'submitted')

        if (destinationId) {
            query = query.eq('destination_id', destinationId)
        }

        const { data, error } = await query

        if (error) throw error

        // Group by month
        const monthlyMap: Record<string, MonthlyStats> = {}

        for (let m = 1; m <= 12; m++) {
            const month = `${targetYear}-${String(m).padStart(2, '0')}`
            monthlyMap[month] = {
                month,
                total_visitors: 0,
                total_revenue: 0,
                anak_count: 0,
                dewasa_count: 0,
                wna_count: 0,
                cash_amount: 0,
                qris_amount: 0,
                report_count: 0,
            }
        }

        for (const report of data || []) {
            const month = report.report_date.substring(0, 7)
            if (monthlyMap[month]) {
                monthlyMap[month].total_visitors += report.total_visitors || 0
                monthlyMap[month].total_revenue += report.total_revenue || 0
                monthlyMap[month].anak_count += report.anak_count || 0
                monthlyMap[month].dewasa_count += report.dewasa_count || 0
                monthlyMap[month].wna_count += report.wna_count || 0
                monthlyMap[month].cash_amount += report.cash_amount || 0
                monthlyMap[month].qris_amount += report.qris_amount || 0
                monthlyMap[month].report_count += 1
            }
        }

        return { success: true, data: Object.values(monthlyMap) }
    } catch (error) {
        console.error('getMonthlyStats error:', error)
        return { success: false, error: 'Gagal mengambil data bulanan' }
    }
}

/**
 * Get destination rankings for a period
 */
export async function getDestinationRankings(options?: {
    month?: string // YYYY-MM
    year?: number
    destinationId?: string
}): Promise<ApiResponse<DestinationRanking[]>> {
    try {
        const supabase = await createClient()

        let query = supabase
            .from('daily_reports')
            .select(`
                destination_id,
                total_visitors,
                total_revenue,
                destination:destinations(id, code, name)
            `)
            .eq('status', 'submitted')

        if (options?.destinationId) {
            query = query.eq('destination_id', options.destinationId)
        }

        if (options?.month) {
            query = query
                .gte('report_date', `${options.month}-01`)
                .lte('report_date', `${options.month}-31`)
        } else if (options?.year) {
            query = query
                .gte('report_date', `${options.year}-01-01`)
                .lte('report_date', `${options.year}-12-31`)
        }

        const { data, error } = await query

        if (error) throw error

        // Aggregate by destination
        const destMap: Record<string, DestinationRanking> = {}

        for (const report of data || []) {
            const destId = report.destination_id
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const dest = report.destination as any

            if (!destMap[destId]) {
                destMap[destId] = {
                    destination_id: destId,
                    destination_name: dest?.name || 'Unknown',
                    destination_code: dest?.code || '',
                    total_visitors: 0,
                    total_revenue: 0,
                    report_count: 0,
                }
            }

            destMap[destId].total_visitors += report.total_visitors || 0
            destMap[destId].total_revenue += report.total_revenue || 0
            destMap[destId].report_count += 1
        }

        // Sort by visitors descending
        const rankings = Object.values(destMap).sort((a, b) => b.total_visitors - a.total_visitors)

        return { success: true, data: rankings }
    } catch (error) {
        console.error('getDestinationRankings error:', error)
        return { success: false, error: 'Gagal mengambil ranking destinasi' }
    }
}

/**
 * Get demographic statistics
 */
export async function getDemographicStats(options?: {
    month?: string
    year?: number
    destinationId?: string
}): Promise<ApiResponse<DemographicStats>> {
    try {
        const supabase = await createClient()

        let query = supabase
            .from('daily_reports')
            .select('anak_count, dewasa_count, wna_count, dewasa_male, dewasa_female, anak_male, anak_female')
            .eq('status', 'submitted')

        if (options?.destinationId) {
            query = query.eq('destination_id', options.destinationId)
        }

        if (options?.month) {
            query = query
                .gte('report_date', `${options.month}-01`)
                .lte('report_date', `${options.month}-31`)
        } else if (options?.year) {
            query = query
                .gte('report_date', `${options.year}-01-01`)
                .lte('report_date', `${options.year}-12-31`)
        }

        const { data, error } = await query

        if (error) throw error

        const stats: DemographicStats = {
            total_anak: 0,
            total_dewasa: 0,
            total_wna: 0,
            dewasa_male: 0,
            dewasa_female: 0,
            anak_male: 0,
            anak_female: 0,
        }

        for (const report of data || []) {
            stats.total_anak += report.anak_count || 0
            stats.total_dewasa += report.dewasa_count || 0
            stats.total_wna += report.wna_count || 0
            stats.dewasa_male += report.dewasa_male || 0
            stats.dewasa_female += report.dewasa_female || 0
            stats.anak_male += (report as any).anak_male || 0
            stats.anak_female += (report as any).anak_female || 0
        }

        return { success: true, data: stats }
    } catch (error) {
        console.error('getDemographicStats error:', error)
        return { success: false, error: 'Gagal mengambil data demografi' }
    }
}

/**
 * Get payment method statistics
 */
export async function getPaymentStats(options?: {
    month?: string
    year?: number
    destinationId?: string
}): Promise<ApiResponse<PaymentStats>> {
    try {
        const supabase = await createClient()

        let query = supabase
            .from('daily_reports')
            .select('cash_amount, qris_amount')
            .eq('status', 'submitted')

        if (options?.destinationId) {
            query = query.eq('destination_id', options.destinationId)
        }

        if (options?.month) {
            query = query
                .gte('report_date', `${options.month}-01`)
                .lte('report_date', `${options.month}-31`)
        } else if (options?.year) {
            query = query
                .gte('report_date', `${options.year}-01-01`)
                .lte('report_date', `${options.year}-12-31`)
        }

        const { data, error } = await query

        if (error) throw error

        let total_cash = 0
        let total_qris = 0

        for (const report of data || []) {
            total_cash += report.cash_amount || 0
            total_qris += report.qris_amount || 0
        }

        const total = total_cash + total_qris

        return {
            success: true,
            data: {
                total_cash,
                total_qris,
                cash_percentage: total > 0 ? Math.round((total_cash / total) * 100) : 0,
                qris_percentage: total > 0 ? Math.round((total_qris / total) * 100) : 0,
            }
        }
    } catch (error) {
        console.error('getPaymentStats error:', error)
        return { success: false, error: 'Gagal mengambil data pembayaran' }
    }
}

/**
 * Get current month vs last month comparison
 */
export async function getMonthlyComparison(destinationId?: string): Promise<ApiResponse<{
    current: { visitors: number; revenue: number }
    previous: { visitors: number; revenue: number }
    change: { visitors: number; revenue: number } // percentage
}>> {
    try {
        const supabase = await createClient()
        const now = new Date()
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const previousMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`

        // Get current month
        let currentQuery = supabase
            .from('daily_reports')
            .select('total_visitors, total_revenue')
            .gte('report_date', `${currentMonth}-01`)
            .lte('report_date', `${currentMonth}-31`)
            .eq('status', 'submitted')

        if (destinationId) {
            currentQuery = currentQuery.eq('destination_id', destinationId)
        }

        const { data: currentData } = await currentQuery

        // Get previous month
        let previousQuery = supabase
            .from('daily_reports')
            .select('total_visitors, total_revenue')
            .gte('report_date', `${previousMonth}-01`)
            .lte('report_date', `${previousMonth}-31`)
            .eq('status', 'submitted')

        if (destinationId) {
            previousQuery = previousQuery.eq('destination_id', destinationId)
        }

        const { data: previousData } = await previousQuery

        const current = {
            visitors: currentData?.reduce((sum, r) => sum + (r.total_visitors || 0), 0) || 0,
            revenue: currentData?.reduce((sum, r) => sum + (r.total_revenue || 0), 0) || 0,
        }

        const previous = {
            visitors: previousData?.reduce((sum, r) => sum + (r.total_visitors || 0), 0) || 0,
            revenue: previousData?.reduce((sum, r) => sum + (r.total_revenue || 0), 0) || 0,
        }

        const change = {
            visitors: previous.visitors > 0
                ? Math.round(((current.visitors - previous.visitors) / previous.visitors) * 100)
                : current.visitors > 0 ? 100 : 0,
            revenue: previous.revenue > 0
                ? Math.round(((current.revenue - previous.revenue) / previous.revenue) * 100)
                : current.revenue > 0 ? 100 : 0,
        }

        return { success: true, data: { current, previous, change } }
    } catch (error) {
        console.error('getMonthlyComparison error:', error)
        return { success: false, error: 'Gagal mengambil perbandingan bulanan' }
    }
}
