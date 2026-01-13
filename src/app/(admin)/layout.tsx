'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { LogOut, LayoutDashboard, MapPin, Users, ClipboardList, FileText, BarChart3, Ticket } from 'lucide-react'
import { logoutAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AppFooter } from '@/components/app-footer'

const navItems = [
    {
        label: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
    },
    {
        label: 'Analytics',
        href: '/admin/analytics',
        icon: BarChart3,
    },
    {
        label: 'Laporan',
        href: '/admin/laporan',
        icon: FileText,
    },
    {
        label: 'Tiket',
        href: '/admin/tiket',
        icon: Ticket,
    },
    {
        label: 'Destinasi',
        href: '/admin/destinasi',
        icon: MapPin,
    },
    {
        label: 'Petugas',
        href: '/admin/petugas',
        icon: Users,
    },
    {
        label: 'Penugasan',
        href: '/admin/penugasan',
        icon: ClipboardList,
    },
]

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const { user, isAuthenticated, isLoading, logout } = useAuthStore()
    const [isHydrated, setIsHydrated] = React.useState(false)

    // Wait for zustand to hydrate from localStorage
    React.useEffect(() => {
        setIsHydrated(true)
    }, [])

    React.useEffect(() => {
        // Don't redirect until hydration is complete
        if (!isHydrated) return

        // Redirect to login if not authenticated
        if (!isAuthenticated) {
            router.push('/login')
            return
        }

        // Redirect to dashboard if not admin
        if (user?.role !== 'admin') {
            router.push('/dashboard')
            return
        }
    }, [isAuthenticated, user?.role, router, isHydrated])

    const handleLogout = async () => {
        if (user?.id) {
            await logoutAction(user.id)
        }
        logout()
        router.push('/login')
    }

    // Show loading while hydrating
    if (!isHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-gray-500">Memuat...</div>
            </div>
        )
    }

    // Don't render if not admin
    if (!isAuthenticated || user?.role !== 'admin') {
        return null
    }


    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-gray-900">
                                SITAMMU Admin
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">{user?.name}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Keluar
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-1 overflow-x-auto">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
                                        isActive
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    )}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </nav>

            {/* Main content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {/* Footer */}
            <AppFooter className="border-t bg-white mt-auto py-6" />
        </div>
    )
}
