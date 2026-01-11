'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { UserWithDestination } from '@/types'

// No aggressive timeout, session persists
// But we keep lastActivity just in case we need it later (e.g. 4h timeout)
const SESSION_TIMEOUT = 4 * 60 * 60 * 1000 // 4 hours

interface AuthState {
    user: UserWithDestination | null
    isAuthenticated: boolean
    isLoading: boolean
    lastActivity: number

    // Actions
    setUser: (user: UserWithDestination | null) => void
    login: (user: UserWithDestination) => void
    logout: () => void
    setLoading: (loading: boolean) => void
    updateActivity: () => void
    checkSession: () => boolean
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: true,
            lastActivity: Date.now(),

            setUser: (user) => set({
                user,
                isAuthenticated: !!user,
                isLoading: false,
                lastActivity: Date.now()
            }),

            login: (user) => set({
                user,
                isAuthenticated: true,
                isLoading: false,
                lastActivity: Date.now()
            }),

            logout: () => set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                lastActivity: 0
            }),

            setLoading: (isLoading) => set({ isLoading }),

            updateActivity: () => set({ lastActivity: Date.now() }),

            checkSession: () => {
                const { lastActivity, isAuthenticated, logout } = get()
                if (!isAuthenticated) return false

                const now = Date.now()
                // Only logout if inactive for 24 hours
                if (now - lastActivity > SESSION_TIMEOUT) {
                    logout()
                    return false
                }

                // Update activity (auto-renew)
                set({ lastActivity: now })
                return true
            }
        }),
        {
            name: 'sitammu-auth',
            // Revert to localStorage (default)
            // Session persists even if browser is closed
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                lastActivity: state.lastActivity,
            }),
        }
    )
)

// Helper hooks
export const useUser = () => useAuthStore((state) => state.user)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useIsKoordinator = () => useAuthStore((state) => state.user?.role === 'koordinator')
export const useIsAdmin = () => useAuthStore((state) => state.user?.role === 'admin')
