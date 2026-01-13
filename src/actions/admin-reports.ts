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
        ticket_blocks: any[] // JSONB
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
    } catch (error: any) {
        console.error('editReportWithLog error:', error)
        return { success: false, error: `Gagal memperbarui laporan: ${error?.message || JSON.stringify(error)}` }
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

/**
 * Create a manual report (for admin to input past/missed reports)
 */
export async function createManualReport(data: {
    destination_id: string
    report_date: string
    anak_count: number
    dewasa_count: number
    dewasa_male: number
    dewasa_female: number
    anak_male?: number
    anak_female?: number
    wna_count: number
    wna_countries?: Record<string, number>
    cash_amount: number
    qris_amount: number
    ticket_blocks?: Array<{
        category: string
        block_no: string
        start_no: string
        end_no: string
        count: number
    }>
    notes?: string
    created_by: string
}): Promise<ApiResponse<DailyReport>> {
    try {
        const supabase = await createClient()

        // 1. Check if report already exists for this date/destination
        const { data: existing, error: checkError } = await supabase
            .from('daily_reports')
            .select('id')
            .eq('destination_id', data.destination_id)
            .eq('report_date', data.report_date)
            .maybeSingle()

        if (checkError) throw checkError

        if (existing) {
            return {
                success: false,
                error: 'Laporan untuk tanggal dan destinasi ini sudah ada'
            }
        }

        // 2. Calculate revenue based on ticket prices
        const TICKET_PRICES = { anak: 5000, dewasa: 15000, wna: 50000 }
        const anak_revenue = data.anak_count * TICKET_PRICES.anak
        const dewasa_revenue = data.dewasa_count * TICKET_PRICES.dewasa
        const wna_revenue = data.wna_count * TICKET_PRICES.wna

        // 3. Create the report
        const { data: newReport, error: insertError } = await supabase
            .from('daily_reports')
            .insert({
                destination_id: data.destination_id,
                report_date: data.report_date,
                anak_count: data.anak_count,
                dewasa_count: data.dewasa_count,
                dewasa_male: data.dewasa_male,
                dewasa_female: data.dewasa_female,
                anak_male: data.anak_male || 0,
                anak_female: data.anak_female || 0,
                wna_count: data.wna_count,
                wna_countries: data.wna_countries || {},
                anak_revenue,
                dewasa_revenue,
                wna_revenue,
                cash_amount: data.cash_amount,
                qris_amount: data.qris_amount,
                ticket_blocks: data.ticket_blocks || [],
                notes: data.notes ? `[Input Manual] ${data.notes}` : '[Input Manual oleh Admin]',
                status: 'submitted',
                submitted_by: data.created_by,
                submitted_at: new Date().toISOString(),
                created_by: data.created_by,
            })
            .select()
            .single()

        if (insertError) throw insertError

        return {
            success: true,
            data: newReport,
            message: 'Laporan berhasil ditambahkan'
        }
    } catch (error) {
        console.error('createManualReport error:', error)
        return { success: false, error: 'Gagal menambahkan laporan' }
    }
}

/**
 * Delete a report (admin only)
 */
export async function deleteReport(
    reportId: string,
    deletedBy: string,
    reason?: string
): Promise<ApiResponse<null>> {
    try {
        const supabase = await createClient()

        console.log('[deleteReport] Starting delete for reportId:', reportId, 'by user:', deletedBy)

        // Get report info for logging
        const { data: report, error: fetchError } = await supabase
            .from('daily_reports')
            .select('id, report_date, destination_id, destination:destinations(name)')
            .eq('id', reportId)
            .single()

        console.log('[deleteReport] Fetch result:', { report, fetchError })

        if (fetchError || !report) {
            console.log('[deleteReport] Report not found')
            return { success: false, error: 'Laporan tidak ditemukan' }
        }

        // Delete the report
        const { error: deleteError, count } = await supabase
            .from('daily_reports')
            .delete({ count: 'exact' })
            .eq('id', reportId)

        console.log('[deleteReport] Delete result:', { deleteError, count })

        if (deleteError) {
            console.error('[deleteReport] Delete error:', deleteError)
            throw deleteError
        }

        // Verify deletion was successful
        if (count === 0) {
            console.log('[deleteReport] No rows deleted - possible RLS issue')
            return { success: false, error: 'Tidak dapat menghapus - periksa izin akses database' }
        }

        // Log the deletion
        await supabase.from('activity_logs').insert({
            user_id: deletedBy,
            destination_id: report.destination_id,
            action: 'delete_report',
            details: {
                report_id: reportId,
                report_date: report.report_date,
                destination_name: (report.destination as unknown as { name: string } | null)?.name || 'Unknown',
                reason: reason || 'Data salah input',
            },
        })

        console.log('[deleteReport] Successfully deleted report')

        return {
            success: true,
            message: 'Laporan berhasil dihapus'
        }
    } catch (error) {
        console.error('deleteReport error:', error)
        return { success: false, error: 'Gagal menghapus laporan' }
    }
}
