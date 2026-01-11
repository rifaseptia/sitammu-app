'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardEdit, History, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/stores/auth-store'

const navItems = [
    { href: '/dashboard', icon: Home, label: 'Beranda' },
    { href: '/input', icon: ClipboardEdit, label: 'Input' },
    { href: '/riwayat', icon: History, label: 'Riwayat' },
]

export function BottomNav() {
    const pathname = usePathname()
    const { logout } = useAuthStore()

    const handleLogout = () => {
        logout()
        window.location.href = '/login'
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg safe-area-bottom">
            <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center flex-1 h-full py-2 rounded-xl mx-1',
                                'transition-all duration-200',
                                isActive
                                    ? 'text-pink-600 bg-pink-50'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                            )}
                        >
                            <div className={cn(
                                'transition-transform duration-200',
                                isActive && '-translate-y-0.5'
                            )}>
                                <item.icon className={cn(
                                    'w-7 h-7',
                                    isActive && 'stroke-[2.5px]'
                                )} />
                            </div>
                            <span className={cn(
                                'text-sm mt-1',
                                isActive ? 'font-bold' : 'font-medium'
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}

                {/* Logout button */}
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center flex-1 h-full py-2 rounded-xl mx-1 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                >
                    <LogOut className="w-7 h-7" />
                    <span className="text-sm font-medium mt-1">Keluar</span>
                </button>
            </div>
        </nav>
    )
}
