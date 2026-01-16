'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ApiResponse, Destination } from '@/types'

/**
 * Get all destinations for admin management
 */
export async function getAllDestinations(): Promise<ApiResponse<Destination[]>> {
    try {
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('destinations')
            .select('*')
            .order('name')

        if (error) throw error

        return {
            success: true,
            data: data ?? [],
        }
    } catch (error) {
        console.error('Get all destinations error:', error)
        return {
            success: false,
            error: 'Gagal memuat destinasi',
        }
    }
}

/**
 * Update destination
 */
export async function updateDestination(
    id: string,
    data: { name: string; location: string; is_active: boolean }
): Promise<ApiResponse<Destination>> {
    try {
        const supabase = createAdminClient()

        const { data: updated, error } = await supabase
            .from('destinations')
            .update({
                name: data.name,
                location: data.location,
                is_active: data.is_active,
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/admin')
        revalidatePath('/admin/destinasi')

        return {
            success: true,
            data: updated,
            message: 'Destinasi berhasil diperbarui',
        }
    } catch (error) {
        console.error('Update destination error:', error)
        return {
            success: false,
            error: 'Gagal memperbarui destinasi',
        }
    }
}

/**
 * Create new destination
 */
export async function createDestination(
    data: { code: string; name: string; location: string }
): Promise<ApiResponse<Destination>> {
    try {
        const supabase = createAdminClient()

        const { data: created, error } = await supabase
            .from('destinations')
            .insert({
                code: data.code,
                name: data.name,
                location: data.location,
                is_active: true,
            })
            .select()
            .single()

        if (error) throw error

        revalidatePath('/admin')
        revalidatePath('/admin/destinasi')

        return {
            success: true,
            data: created,
            message: 'Destinasi berhasil ditambahkan',
        }
    } catch (error) {
        console.error('Create destination error:', error)
        return {
            success: false,
            error: 'Gagal menambahkan destinasi',
        }
    }
}

/**
 * Toggle destination active status
 */
export async function toggleDestinationStatus(
    id: string,
    isActive: boolean
): Promise<ApiResponse<null>> {
    try {
        const supabase = createAdminClient()

        const { error } = await supabase
            .from('destinations')
            .update({ is_active: isActive })
            .eq('id', id)

        if (error) throw error

        revalidatePath('/admin')
        revalidatePath('/admin/destinasi')

        return {
            success: true,
            message: isActive ? 'Destinasi diaktifkan' : 'Destinasi dinonaktifkan',
        }
    } catch (error) {
        console.error('Toggle destination status error:', error)
        return {
            success: false,
            error: 'Gagal mengubah status destinasi',
        }
    }
}
