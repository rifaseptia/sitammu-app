'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { BottomNav } from '@/components/mobile/bottom-nav'
import { AppFooter } from '@/components/app-footer'

export default function MobileLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const { isAuthenticated, isLoading, checkSession, updateActivity } = useAuthStore()

    // Force stop loading after 2s to prevent infinite loading
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isLoading) {
                useAuthStore.getState().setLoading(false)
            }
        }, 2000)
        return () => clearTimeout(timer)
    }, [isLoading])

    // initial check and interval check
    useEffect(() => {
        const check = () => {
            // Only check if we're not loading (or if heavy loading persists)
            if (!checkSession()) {
                router.replace('/login')
            }
        }

        // Check immediately
        check()

        // And periodically
        const interval = setInterval(check, 10000)
        return () => clearInterval(interval)
    }, [checkSession, router])

    // Interaction listeners to keep session alive
    useEffect(() => {
        const handleActivity = () => updateActivity()
        window.addEventListener('click', handleActivity)
        window.addEventListener('touchstart', handleActivity)
        window.addEventListener('keypress', handleActivity)

        return () => {
            window.removeEventListener('click', handleActivity)
            window.removeEventListener('touchstart', handleActivity)
            window.removeEventListener('keypress', handleActivity)
        }
    }, [updateActivity])

    // Strict redirect if no auth
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/login')
        }
    }, [isAuthenticated, isLoading, router])

    // Show loading state during hydration
    if (isLoading) {
        return (
            <div className="h-[100dvh] bg-gray-50 flex items-center justify-center p-4 font-ios">
                <div className="animate-pulse text-gray-400 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="text-xs text-zinc-900 underline mt-4"
                    >
                        Klik jika loading terlalu lama
                    </button>
                </div>
            </div>
        )
    }

    // Don't render if not authenticated
    if (!isAuthenticated) {
        // Fallback UI with manual login button if redirect is slow/blocked
        return (
            <div className="h-[100dvh] bg-gray-50 flex items-center justify-center p-4 font-ios">
                <div className="text-center space-y-4">
                    <p className="text-gray-500">Sesi Anda telah berakhir</p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2 rounded-full font-bold shadow-lg active:scale-95 transition-transform"
                    >
                        Masuk Kembali
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[100dvh] bg-gray-50 overflow-hidden flex flex-col select-none touch-pan-y font-ios">
            <main className="flex-1 overflow-y-auto scrollbar-hide max-w-md w-full mx-auto flex flex-col pb-24 safe-area-top">
                <div className="flex-1">
                    {children}
                </div>

                <AppFooter />
            </main>
            <BottomNav />
        </div>
    )
}
