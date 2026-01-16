'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import type { User, Destination, UserWithDestination, ApiResponse } from '@/types'

export interface LoginPayload {
    destination_id: string
    user_id: string
    pin: string
}

export async function loginAction(
    payload: LoginPayload
): Promise<ApiResponse<UserWithDestination>> {
    try {
        // Use admin client because RLS blocks access before login
        const supabase = createAdminClient()

        // Fetch user with destination
        const { data: user, error: userError } = await supabase
            .from('users')
            .select(`
        *,
        destination:destinations(*)
      `)
            .eq('id', payload.user_id)
            .eq('is_active', true)
            .single()

        if (userError || !user) {
            return {
                success: false,
                error: 'Pengguna tidak ditemukan',
            }
        }

        // Verify PIN
        const isValidPin = await bcrypt.compare(payload.pin, user.pin_hash)

        if (!isValidPin) {
            return {
                success: false,
                error: 'PIN salah',
            }
        }

        // Update last login
        await supabase
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', user.id)

        // Log activity securely using Admin Client
        const adminClient = createAdminClient()
        await adminClient.from('activity_logs').insert({
            user_id: user.id,
            destination_id: payload.destination_id,
            action: 'login',
            details: { method: 'pin' },
        })

        // Remove pin_hash from response
        const { pin_hash, ...safeUser } = user

        return {
            success: true,
            data: safeUser as UserWithDestination,
            message: 'Login berhasil',
        }
    } catch (error) {
        console.error('Login error:', error)
        return {
            success: false,
            error: 'Terjadi kesalahan sistem',
        }
    }
}

export async function getDestinations(): Promise<ApiResponse<Destination[]>> {
    try {
        // Use admin client because this is called before login (no session exists)
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('destinations')
            .select('*')
            .eq('is_active', true)
            .order('name')

        if (error) throw error

        return {
            success: true,
            data: data ?? [],
        }
    } catch (error) {
        console.error('Get destinations error:', error)
        return {
            success: false,
            error: 'Gagal memuat destinasi',
        }
    }
}

export async function getUsersByDestination(
    destinationId: string
): Promise<ApiResponse<Pick<User, 'id' | 'name' | 'role'>[]>> {
    try {
        // Use admin client because this is called before login (no session exists)
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('users')
            .select('id, name, role')
            .eq('destination_id', destinationId)
            .eq('is_active', true)
            .order('role')
            .order('name')

        if (error) throw error

        return {
            success: true,
            data: data ?? [],
        }
    } catch (error) {
        console.error('Get users error:', error)
        return {
            success: false,
            error: 'Gagal memuat daftar petugas',
        }
    }
}

export async function logoutAction(userId: string): Promise<ApiResponse<null>> {
    try {
        const supabase = await createClient()

        // Log activity securely
        const adminClient = createAdminClient()
        await adminClient.from('activity_logs').insert({
            user_id: userId,
            action: 'logout',
        })

        return {
            success: true,
            message: 'Logout berhasil',
        }
    } catch (error) {
        console.error('Logout error:', error)
        return {
            success: false,
            error: 'Terjadi kesalahan',
        }
    }
}

/**
 * Get admin users (users without destination_id)
 */
export async function getAdminUsers(): Promise<ApiResponse<Pick<User, 'id' | 'name' | 'role'>[]>> {
    try {
        // Use admin client because this is called before login (no session exists)
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('users')
            .select('id, name, role')
            .is('destination_id', null)
            .eq('role', 'admin')
            .eq('is_active', true)
            .order('name')

        if (error) throw error

        return {
            success: true,
            data: data ?? [],
        }
    } catch (error) {
        console.error('Get admin users error:', error)
        return {
            success: false,
            error: 'Gagal memuat daftar admin',
        }
    }
}

/**
 * Login for admin users (no destination required)
 */
export async function adminLoginAction(
    payload: { user_id: string; pin: string }
): Promise<ApiResponse<UserWithDestination>> {
    try {
        // Use admin client because RLS blocks access before login
        const supabase = createAdminClient()

        // Fetch admin user
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', payload.user_id)
            .eq('role', 'admin')
            .eq('is_active', true)
            .single()

        if (userError || !user) {
            return {
                success: false,
                error: 'Admin tidak ditemukan',
            }
        }

        // Verify PIN
        const isValidPin = await bcrypt.compare(payload.pin, user.pin_hash)

        if (!isValidPin) {
            return {
                success: false,
                error: 'PIN salah',
            }
        }

        // Update last login
        await supabase
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', user.id)

        // Log activity
        // Log activity securely
        const adminClient = createAdminClient()
        await adminClient.from('activity_logs').insert({
            user_id: user.id,
            action: 'login',
            details: { method: 'pin', role: 'admin' },
        })

        // Remove pin_hash from response
        const { pin_hash, ...safeUser } = user

        return {
            success: true,
            data: { ...safeUser, destination: null } as UserWithDestination,
            message: 'Login berhasil',
        }
    } catch (error) {
        console.error('Admin login error:', error)
        return {
            success: false,
            error: 'Terjadi kesalahan sistem',
        }
    }
}
