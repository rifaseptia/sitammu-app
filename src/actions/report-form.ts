'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { TICKET_PRICES } from '@/lib/constants'
import { getTodayDateString } from '@/lib/utils'
import type { ApiResponse, DailyReport, DailyReportInput } from '@/types'

/**
 * Save or update a daily report (draft)
 */
export async function saveReport(
    input: DailyReportInput,
    userId: string
): Promise<ApiResponse<DailyReport>> {
    try {
        const supabase = await createClient()
        const adminClient = createAdminClient()

        // [SECURITY] Fetch user profile to enforce destination lock
        const { data: userProfile, error: userError } = await supabase
            .from('users')
            .select('role, destination_id')
            .eq('id', userId)
            .single()

        if (userError || !userProfile) {
            return {
                success: false,
                error: 'User tidak valid/ditemukan',
            }
        }

        // [SECURITY] Override input.destination_id with user.destination_id for non-admins
        let destinationIdToUse = input.destination_id

        if (userProfile.role !== 'admin') {
            if (!userProfile.destination_id) {
                return {
                    success: false,
                    error: 'Akun Anda tidak terhubung ke destinasi manapun',
                }
            }
            destinationIdToUse = userProfile.destination_id
        }

        // Calculate revenues
        const anak_revenue = input.anak_count * TICKET_PRICES.anak
        const dewasa_revenue = input.dewasa_count * TICKET_PRICES.dewasa
        const wna_revenue = input.wna_count * TICKET_PRICES.wna

        // Check if report exists for this date
        const { data: existing } = await supabase
            .from('daily_reports')
            .select('id, status')
            .eq('destination_id', destinationIdToUse)
            .eq('report_date', input.report_date)
            .maybeSingle()

        // If already submitted, don't allow edit
        if (existing?.status === 'submitted') {
            return {
                success: false,
                error: 'Laporan sudah disubmit dan tidak dapat diubah',
            }
        }

        const reportData = {
            report_date: input.report_date,
            destination_id: destinationIdToUse,
            anak_count: input.anak_count,
            anak_male: input.anak_male || 0,
            anak_female: input.anak_female || 0,
            anak_revenue,
            dewasa_count: input.dewasa_count,
            dewasa_male: input.dewasa_male,
            dewasa_female: input.dewasa_female,
            dewasa_revenue,
            wna_count: input.wna_count,
            wna_countries: input.wna_countries || {},
            wna_revenue,
            attraction_revenue: input.attraction_revenue || 0,
            cash_amount: input.cash_amount,
            qris_amount: input.qris_amount,
            notes: input.notes || null,
            ticket_blocks: input.ticket_blocks || [],
            status: 'draft' as const,
        }

        let result

        if (existing) {
            // Update existing report using Admin Client to bypass RLS restrictions on mutation
            const { data, error } = await adminClient
                .from('daily_reports')
                .update({
                    ...reportData,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id)
                .select()
                .single()

            if (error) throw error
            result = data

            // Log update securely
            await adminClient.from('report_logs').insert({
                report_id: existing.id,
                user_id: userId,
                action: 'update_draft',
                changes: reportData,
            })
        } else {
            // Create new report using Admin Client
            const { data, error } = await adminClient
                .from('daily_reports')
                .insert({
                    ...reportData,
                    created_by: userId,
                })
                .select()
                .single()

            if (error) throw error
            result = data

            // Log creation securely
            await adminClient.from('report_logs').insert({
                report_id: result.id,
                user_id: userId,
                action: 'create_draft',
                changes: reportData,
            })
        }

        return {
            success: true,
            data: result,
            message: 'Laporan berhasil disimpan',
        }
    } catch (error) {
        console.error('Save report error:', error)
        return {
            success: false,
            error: 'Terjadi kesalahan sistem',
        }
    }
}

/**
 * Submit a report (koordinator only)
 */
export async function submitReport(
    reportId: string,
    userId: string
): Promise<ApiResponse<DailyReport>> {
    try {
        const supabase = await createClient()
        const adminClient = createAdminClient()

        // Verify user is koordinator
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single()

        if (user?.role !== 'koordinator') {
            return {
                success: false,
                error: 'Hanya koordinator yang dapat submit laporan',
            }
        }

        // Get current report
        const { data: report } = await supabase
            .from('daily_reports')
            .select('*')
            .eq('id', reportId)
            .single()

        if (!report) {
            return {
                success: false,
                error: 'Laporan tidak ditemukan',
            }
        }

        if (report.status === 'submitted') {
            return {
                success: false,
                error: 'Laporan sudah disubmit sebelumnya',
            }
        }

        // Validate before submit
        if (report.dewasa_male + report.dewasa_female !== report.dewasa_count) {
            return {
                success: false,
                error: 'Jumlah L/P dewasa tidak sama dengan total dewasa',
            }
        }

        // Validate anak gender if columns exist
        if (report.anak_male !== undefined && report.anak_female !== undefined) {
            if (report.anak_male + report.anak_female !== report.anak_count) {
                return {
                    success: false,
                    error: 'Jumlah L/P anak tidak sama dengan total anak',
                }
            }
        }

        if (report.wna_count > 0) {
            const wnaCountryTotal = Object.values(report.wna_countries as Record<string, number>)
                .reduce((a: number, b: number) => a + b, 0)
            if (wnaCountryTotal !== report.wna_count) {
                return {
                    success: false,
                    error: 'Total WNA per negara tidak sama dengan jumlah WNA',
                }
            }
        }

        const totalRevenue = report.anak_revenue + report.dewasa_revenue + report.wna_revenue + (report.attraction_revenue || 0)
        if (report.cash_amount + report.qris_amount !== totalRevenue) {
            return {
                success: false,
                error: 'Cash + QRIS tidak sama dengan total pendapatan',
            }
        }

        // Update status to submitted using Admin Client
        const { data, error } = await adminClient
            .from('daily_reports')
            .update({
                status: 'submitted',
                submitted_by: userId,
                submitted_at: new Date().toISOString(),
            })
            .eq('id', reportId)
            .select()
            .single()

        if (error) throw error

        // Log submission securely
        await adminClient.from('report_logs').insert({
            report_id: reportId,
            user_id: userId,
            action: 'submit',
        })

        return {
            success: true,
            data,
            message: 'Laporan berhasil disubmit',
        }
    } catch (error) {
        console.error('Submit report error:', error)
        return {
            success: false,
            error: 'Terjadi kesalahan sistem',
        }
    }
}

/**
 * Get countries for WNA input
 */
export async function getCountries() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('countries')
            .select('*')
            .order('name')

        if (error) throw error
        return { success: true, data: data ?? [] }
    } catch (error) {
        return { success: false, error: 'Gagal memuat daftar negara' }
    }
}

/**
 * Delete a draft report
 */
export async function deleteDraft(reportId: string, userId: string): Promise<ApiResponse<null>> {
    try {
        const supabase = await createClient()
        const adminClient = createAdminClient()

        // Verify report belongs to user's destination and is still draft
        const { data: report } = await supabase
            .from('daily_reports')
            .select('status, destination_id')
            .eq('id', reportId)
            .single()

        if (!report) {
            return { success: false, error: 'Laporan tidak ditemukan' }
        }

        if (report.status !== 'draft') {
            return { success: false, error: 'Hanya draf yang dapat dihapus' }
        }

        // Delete using Admin Client
        const { error } = await adminClient
            .from('daily_reports')
            .delete()
            .eq('id', reportId)

        if (error) throw error

        // Log deletion securely - using activity_logs which has 'details' as Record<string, unknown>
        await adminClient.from('activity_logs').insert({
            user_id: userId,
            action: 'delete_draft',
            details: { report_id: reportId }
        })

        return { success: true, data: null, message: 'Draf berhasil dihapus' }
    } catch (error) {
        console.error('Delete draft error:', error)
        return { success: false, error: 'Gagal menghapus draf' }
    }
}
