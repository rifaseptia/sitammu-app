'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import type { ApiResponse, User, Destination } from '@/types'

interface UserWithDestination extends User {
    destination: Destination | null
}

/**
 * Get all users with their destinations
 */
export async function getAllUsers(): Promise<ApiResponse<UserWithDestination[]>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('users')
            .select(`
        *,
        destination:destinations(*)
      `)
            .order('role')
            .order('name')

        if (error) throw error

        return {
            success: true,
            data: (data ?? []) as UserWithDestination[],
        }
    } catch (error) {
        console.error('Get all users error:', error)
        return {
            success: false,
            error: 'Gagal memuat petugas',
        }
    }
}

/**
 * Create new user
 */
export async function createUser(data: {
    name: string
    pin: string
    role: 'petugas' | 'koordinator' | 'admin'
    destination_id: string | null
}): Promise<ApiResponse<User>> {
    try {
        const supabase = createAdminClient()

        // Hash PIN
        const pinHash = await bcrypt.hash(data.pin, 10)

        const { data: created, error } = await supabase
            .from('users')
            .insert({
                name: data.name,
                pin_hash: pinHash,
                role: data.role,
                destination_id: data.destination_id,
                is_active: true,
            })
            .select()
            .single()

        if (error) throw error

        revalidatePath('/admin/petugas')

        return {
            success: true,
            data: created,
            message: 'Petugas berhasil ditambahkan',
        }
    } catch (error) {
        console.error('Create user error:', error)
        return {
            success: false,
            error: 'Gagal menambahkan petugas',
        }
    }
}

/**
 * Update user
 */
export async function updateUser(
    id: string,
    data: {
        name: string
        role: 'petugas' | 'koordinator' | 'admin'
        destination_id: string | null
        is_active: boolean
    }
): Promise<ApiResponse<User>> {
    try {
        const supabase = createAdminClient()

        const { data: updated, error } = await supabase
            .from('users')
            .update({
                name: data.name,
                role: data.role,
                destination_id: data.destination_id,
                is_active: data.is_active,
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/admin/petugas')

        return {
            success: true,
            data: updated,
            message: 'Petugas berhasil diperbarui',
        }
    } catch (error) {
        console.error('Update user error:', error)
        return {
            success: false,
            error: 'Gagal memperbarui petugas',
        }
    }
}

/**
 * Reset user PIN
 */
export async function resetUserPin(
    id: string,
    newPin: string
): Promise<ApiResponse<null>> {
    try {
        const supabase = createAdminClient()

        // Hash new PIN
        const pinHash = await bcrypt.hash(newPin, 10)

        const { error } = await supabase
            .from('users')
            .update({ pin_hash: pinHash })
            .eq('id', id)

        if (error) throw error

        return {
            success: true,
            message: 'PIN berhasil direset',
        }
    } catch (error) {
        console.error('Reset PIN error:', error)
        return {
            success: false,
            error: 'Gagal mereset PIN',
        }
    }
}

/**
 * Toggle user active status
 */
export async function toggleUserStatus(
    id: string,
    isActive: boolean
): Promise<ApiResponse<null>> {
    try {
        const supabase = createAdminClient()

        const { error } = await supabase
            .from('users')
            .update({ is_active: isActive })
            .eq('id', id)

        if (error) throw error

        revalidatePath('/admin/petugas')

        return {
            success: true,
            message: isActive ? 'Petugas diaktifkan' : 'Petugas dinonaktifkan',
        }
    } catch (error) {
        console.error('Toggle user status error:', error)
        return {
            success: false,
            error: 'Gagal mengubah status petugas',
        }
    }
}

/**
 * Delete user
 */
export async function deleteUser(id: string): Promise<ApiResponse<null>> {
    try {
        const supabase = createAdminClient()

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id)

        if (error) throw error

        revalidatePath('/admin/petugas')

        return {
            success: true,
            message: 'Petugas berhasil dihapus',
        }
    } catch (error) {
        console.error('Delete user error:', error)
        return {
            success: false,
            error: 'Gagal menghapus petugas',
        }
    }
}
