'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { ApiResponse, Attraction, AttractionWithDestination } from '@/types'

/**
 * Get all attractions (with destination info)
 */
export async function getAllAttractions(): Promise<ApiResponse<AttractionWithDestination[]>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('attractions')
            .select(`
                *,
                destination:destinations(*)
            `)
            .order('destination_id')
            .order('sort_order')

        if (error) throw error

        return { success: true, data: data ?? [] }
    } catch (error) {
        console.error('Get attractions error:', error)
        return { success: false, error: 'Gagal memuat atraksi' }
    }
}

/**
 * Get attractions for a specific destination
 */
export async function getAttractionsByDestination(
    destinationId: string
): Promise<ApiResponse<Attraction[]>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('attractions')
            .select('*')
            .eq('destination_id', destinationId)
            .eq('is_active', true)
            .order('sort_order')

        if (error) throw error

        return { success: true, data: data ?? [] }
    } catch (error) {
        console.error('Get attractions by destination error:', error)
        return { success: false, error: 'Gagal memuat atraksi' }
    }
}

/**
 * Create attraction
 */
export async function createAttraction(input: {
    destination_id: string
    name: string
    price: number
    requires_ticket_block: boolean
    sort_order?: number
}): Promise<ApiResponse<Attraction>> {
    try {
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('attractions')
            .insert({
                destination_id: input.destination_id,
                name: input.name,
                price: input.price,
                requires_ticket_block: input.requires_ticket_block,
                sort_order: input.sort_order || 0,
            })
            .select()
            .single()

        if (error) throw error

        return { success: true, data, message: 'Atraksi berhasil ditambahkan' }
    } catch (error: any) {
        console.error('Create attraction error:', error)
        return { success: false, error: error?.message || 'Gagal menambahkan atraksi' }
    }
}

/**
 * Update attraction
 */
export async function updateAttraction(
    id: string,
    updates: Partial<{
        name: string
        price: number
        requires_ticket_block: boolean
        is_active: boolean
        sort_order: number
    }>
): Promise<ApiResponse<Attraction>> {
    try {
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('attractions')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return { success: true, data, message: 'Atraksi berhasil diupdate' }
    } catch (error) {
        console.error('Update attraction error:', error)
        return { success: false, error: 'Gagal mengupdate atraksi' }
    }
}

/**
 * Delete attraction
 */
export async function deleteAttraction(id: string): Promise<ApiResponse<null>> {
    try {
        const supabase = createAdminClient()

        const { error } = await supabase
            .from('attractions')
            .delete()
            .eq('id', id)

        if (error) throw error

        return { success: true, data: null, message: 'Atraksi berhasil dihapus' }
    } catch (error) {
        console.error('Delete attraction error:', error)
        return { success: false, error: 'Gagal menghapus atraksi' }
    }
}
