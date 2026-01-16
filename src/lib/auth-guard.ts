'use server'

import { createAdminClient } from '@/lib/supabase/server'

/**
 * Auth Guard - Server-side validation helpers
 * 
 * Karena aplikasi menggunakan custom PIN auth (bukan Supabase Auth),
 * kita perlu memvalidasi userId yang dikirim dari client.
 * 
 * Helper ini memastikan:
 * 1. User dengan ID tersebut ada di database
 * 2. User masih aktif (is_active = true)
 * 3. User memiliki role yang sesuai (untuk admin-only actions)
 */

export interface AuthResult {
    success: boolean
    userId?: string
    role?: 'petugas' | 'koordinator' | 'admin'
    destinationId?: string | null
    error?: string
}

/**
 * Validate that a user exists and is active
 * Use this at the start of server actions that require authentication
 */
export async function validateUser(userId: string | undefined | null): Promise<AuthResult> {
    if (!userId) {
        return {
            success: false,
            error: 'User ID tidak diberikan'
        }
    }

    try {
        const supabase = createAdminClient()

        const { data: user, error } = await supabase
            .from('users')
            .select('id, role, destination_id, is_active')
            .eq('id', userId)
            .single()

        if (error || !user) {
            return {
                success: false,
                error: 'User tidak ditemukan'
            }
        }

        if (!user.is_active) {
            return {
                success: false,
                error: 'Akun tidak aktif'
            }
        }

        return {
            success: true,
            userId: user.id,
            role: user.role,
            destinationId: user.destination_id
        }
    } catch (error) {
        console.error('validateUser error:', error)
        return {
            success: false,
            error: 'Gagal memvalidasi user'
        }
    }
}

/**
 * Require authenticated user - returns error response if not valid
 * Use: const auth = await requireAuth(userId); if (!auth.success) return { success: false, error: auth.error };
 */
export async function requireAuth(userId: string | undefined | null): Promise<AuthResult> {
    return validateUser(userId)
}

/**
 * Require admin role
 * Use for admin-only actions
 */
export async function requireAdmin(userId: string | undefined | null): Promise<AuthResult> {
    const auth = await validateUser(userId)

    if (!auth.success) {
        return auth
    }

    if (auth.role !== 'admin') {
        return {
            success: false,
            error: 'Akses ditolak - hanya admin'
        }
    }

    return auth
}

/**
 * Require koordinator or admin role
 * Use for koordinator-level actions
 */
export async function requireKoordinator(userId: string | undefined | null): Promise<AuthResult> {
    const auth = await validateUser(userId)

    if (!auth.success) {
        return auth
    }

    if (auth.role !== 'koordinator' && auth.role !== 'admin') {
        return {
            success: false,
            error: 'Akses ditolak - hanya koordinator atau admin'
        }
    }

    return auth
}

/**
 * Require user to belong to specific destination
 * Use for destination-specific actions
 */
export async function requireDestinationAccess(
    userId: string | undefined | null,
    destinationId: string
): Promise<AuthResult> {
    const auth = await validateUser(userId)

    if (!auth.success) {
        return auth
    }

    // Admin can access all destinations
    if (auth.role === 'admin') {
        return auth
    }

    // Others must match destination
    if (auth.destinationId !== destinationId) {
        return {
            success: false,
            error: 'Akses ditolak - destinasi tidak sesuai'
        }
    }

    return auth
}
