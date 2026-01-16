'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import {
    LogOut,
    LayoutDashboard,
    MapPin,
    Users,
    ClipboardList,
    FileText,
    BarChart3,
    Ticket,
    Star,
    Menu,
    X,
    ChevronRight
} from 'lucide-react'
import { logoutAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { APP } from '@/lib/constants'

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
        label: 'Atraksi',
        href: '/admin/atraksi',
        icon: Star,
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
    const { user, isAuthenticated, logout } = useAuthStore()
    const [isHydrated, setIsHydrated] = React.useState(false)
    const [sidebarOpen, setSidebarOpen] = React.useState(false)

    // Wait for zustand to hydrate from localStorage
    React.useEffect(() => {
        setIsHydrated(true)
    }, [])

    React.useEffect(() => {
        if (!isHydrated) return

        if (!isAuthenticated) {
            router.push('/login')
            return
        }

        if (user?.role !== 'admin') {
            router.push('/dashboard')
            return
        }
    }, [isAuthenticated, user?.role, router, isHydrated])

    // Close sidebar when route changes
    React.useEffect(() => {
        setSidebarOpen(false)
    }, [pathname])

    const handleLogout = async () => {
        if (user?.id) {
            await logoutAction(user.id)
        }
        logout()
        router.push('/login')
    }

    if (!isHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">Memuat...</div>
            </div>
        )
    }

    if (!isAuthenticated || user?.role !== 'admin') {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b-2 border-gray-100">
                <div className="flex items-center justify-between h-16 px-4">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-xl hover:bg-gray-100"
                    >
                        <Menu className="w-6 h-6 text-gray-600" />
                    </button>
                    <span className="font-bold text-gray-900">{APP.name} Admin</span>
                    <div className="w-10" />
                </div>
            </header>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-50 bg-black/50"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed top-0 left-0 z-50 h-full w-72 bg-white border-r-2 border-gray-100 transition-transform duration-300 flex flex-col",
                "lg:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Sidebar Header */}
                <div className="flex items-center justify-between h-20 px-6 border-b-2 border-gray-100">
                    <div>
                        <h1 className="text-xl font-black text-gray-900">{APP.name}</h1>
                        <p className="text-xs text-gray-500 font-medium">Admin Panel</p>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 rounded-xl hover:bg-gray-100"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                                    isActive
                                        ? "bg-pink-50 text-pink-600 border-2 border-pink-200"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-2 border-transparent"
                                )}
                            >
                                <item.icon className={cn(
                                    "w-5 h-5",
                                    isActive ? "text-pink-600" : "text-gray-400"
                                )} />
                                <span>{item.label}</span>
                                {isActive && (
                                    <ChevronRight className="w-4 h-4 ml-auto text-pink-400" />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* User & Logout */}
                <div className="p-4 border-t-2 border-gray-100">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                            <span className="text-pink-600 font-bold">
                                {user?.name?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500">Administrator</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="w-full h-12 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-5 h-5 mr-2" />
                        Keluar
                    </Button>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 text-center border-t border-gray-50">
                    <p className="text-[10px] text-gray-400 font-medium">
                        {APP.name} v{APP.version}
                    </p>
                </div>
            </aside>

            {/* Main Content */}
            <main className={cn(
                "min-h-screen transition-all duration-300",
                "lg:ml-72",
                "pt-16 lg:pt-0"
            )}>
                <div className="p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
