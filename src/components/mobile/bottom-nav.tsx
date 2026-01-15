'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, PenSquare, CalendarClock, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/stores/auth-store'

const navItems = [
    { href: '/dashboard', icon: LayoutGrid, label: 'Beranda' },
    { href: '/input', icon: PenSquare, label: 'Input' },
    { href: '/riwayat', icon: CalendarClock, label: 'Riwayat' },
]

export function BottomNav() {
    const pathname = usePathname()
    const { logout } = useAuthStore()

    const handleLogout = () => {
        logout()
        window.location.href = '/login'
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-100 safe-area-bottom">
            <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-2">
                {navItems.map((item) => {
                    // /laporan should highlight Riwayat menu
                    const isActive = pathname === item.href ||
                        (item.href === '/riwayat' && pathname.startsWith('/laporan'))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center flex-1 h-full py-2 transition-all duration-200'
                            )}
                        >
                            <div className={cn(
                                'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200',
                                isActive
                                    ? 'bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg shadow-pink-200'
                                    : 'bg-transparent'
                            )}>
                                <item.icon className={cn(
                                    'w-6 h-6 transition-all',
                                    isActive ? 'text-white' : 'text-gray-400'
                                )} />
                            </div>
                            <span className={cn(
                                'text-xs mt-1.5 transition-all',
                                isActive ? 'font-bold text-pink-600' : 'font-medium text-gray-400'
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}

                {/* Logout button */}
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center flex-1 h-full py-2 transition-all duration-200 group"
                >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:bg-red-50 group-active:bg-red-100">
                        <LogOut className="w-6 h-6 text-gray-400 group-hover:text-red-500 transition-colors" />
                    </div>
                    <span className="text-xs font-medium mt-1.5 text-gray-400 group-hover:text-red-500 transition-colors">
                        Keluar
                    </span>
                </button>
            </div>
        </nav>
    )
}
