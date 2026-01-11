'use server'

import { createClient } from '@/lib/supabase/server'
import type { DailyReport, ApiResponse, ReportEditLog, ReportEditLogWithUser } from '@/types'

/**
 * Get all reports for admin view
 */
export async function getAllReports(options?: {
    dateFrom?: string
    dateTo?: string
    destinationId?: string
    status?: 'draft' | 'submitted'
}): Promise<ApiResponse<DailyReport[]>> {
    try {
        const supabase = await createClient()

        let query = supabase
            .from('daily_reports')
            .select(`
                *,
                destination:destinations(id, code, name)
            `)
            .order('report_date', { ascending: false })

        if (options?.dateFrom) {
            query = query.gte('report_date', options.dateFrom)
        }
        if (options?.dateTo) {
            query = query.lte('report_date', options.dateTo)
        }
        if (options?.destinationId) {
            query = query.eq('destination_id', options.destinationId)
        }
        if (options?.status) {
            query = query.eq('status', options.status)
        }

        const { data, error } = await query.limit(100)

        if (error) throw error

        return { success: true, data: data || [] }
    } catch (error) {
        console.error('getAllReports error:', error)
        return { success: false, error: 'Gagal mengambil data laporan' }
    }
}

/**
 * Get a single report by ID for editing
 */
export async function getReportById(reportId: string): Promise<ApiResponse<DailyReport>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('daily_reports')
            .select(`
                *,
                destination:destinations(id, code, name)
            `)
            .eq('id', reportId)
            .single()

        if (error) throw error

        return { success: true, data }
    } catch (error) {
        console.error('getReportById error:', error)
        return { success: false, error: 'Gagal mengambil data laporan' }
    }
}

/**
 * Edit a report with audit logging
 */
export async function editReportWithLog(
    reportId: string,
    updates: Partial<{
        anak_count: number
        dewasa_count: number
        dewasa_male: number
        dewasa_female: number
        wna_count: number
        wna_countries: Record<string, number>
        cash_amount: number
        qris_amount: number
        notes: string
    }>,
    editorId: string,
    reason?: string
): Promise<ApiResponse<DailyReport>> {
    try {
        const supabase = await createClient()

        // 1. Get current report data
        const { data: currentReport, error: fetchError } = await supabase
            .from('daily_reports')
            .select('*')
            .eq('id', reportId)
            .single()

        if (fetchError || !currentReport) {
            throw new Error('Laporan tidak ditemukan')
        }

        // 2. Build changes object (only include fields that actually changed)
        const changes: Record<string, { old: unknown; new: unknown }> = {}
        const fieldsToUpdate: Record<string, unknown> = {}

        for (const [key, newValue] of Object.entries(updates)) {
            const oldValue = currentReport[key as keyof typeof currentReport]

            // Only track if value actually changed
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                changes[key] = { old: oldValue, new: newValue }
                fieldsToUpdate[key] = newValue
            }
        }

        // If nothing changed, return early
        if (Object.keys(changes).length === 0) {
            return { success: true, data: currentReport, message: 'Tidak ada perubahan' }
        }

        // 3. Recalculate revenue if counts changed - prices must match real prices!
        const TICKET_PRICES = { anak: 5000, dewasa: 15000, wna: 50000 }

        if ('anak_count' in fieldsToUpdate) {
            fieldsToUpdate.anak_revenue = (fieldsToUpdate.anak_count as number) * TICKET_PRICES.anak
        }
        if ('dewasa_count' in fieldsToUpdate) {
            fieldsToUpdate.dewasa_revenue = (fieldsToUpdate.dewasa_count as number) * TICKET_PRICES.dewasa
        }
        if ('wna_count' in fieldsToUpdate) {
            fieldsToUpdate.wna_revenue = (fieldsToUpdate.wna_count as number) * TICKET_PRICES.wna
        }

        // 4. Update the report
        const { data: updatedReport, error: updateError } = await supabase
            .from('daily_reports')
            .update({
                ...fieldsToUpdate,
                updated_at: new Date().toISOString(),
            })
            .eq('id', reportId)
            .select()
            .single()

        if (updateError) throw updateError

        // 5. Create audit log entry
        const { error: logError } = await supabase
            .from('report_edit_logs')
            .insert({
                report_id: reportId,
                edited_by: editorId,
                changes,
                reason: reason || null,
            })

        if (logError) {
            console.error('Failed to create edit log:', logError)
            // Don't fail the whole operation, just log the error
        }

        return {
            success: true,
            data: updatedReport,
            message: `Laporan berhasil diperbarui (${Object.keys(changes).length} field diubah)`
        }
    } catch (error) {
        console.error('editReportWithLog error:', error)
        return { success: false, error: 'Gagal memperbarui laporan' }
    }
}

/**
 * Get edit history for a report
 */
export async function getReportEditHistory(reportId: string): Promise<ApiResponse<ReportEditLogWithUser[]>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('report_edit_logs')
            .select(`
                *,
                editor:users(id, name, role)
            `)
            .eq('report_id', reportId)
            .order('edited_at', { ascending: false })

        if (error) throw error

        return { success: true, data: data || [] }
    } catch (error) {
        console.error('getReportEditHistory error:', error)
        return { success: false, error: 'Gagal mengambil riwayat edit' }
    }
}
