'use client'

import * as React from 'react'
import Link from 'next/link'
import {
    MapPin,
    Calendar,
    Users,
    Banknote,
    PenSquare,
    CheckCircle2,
    Clock,
    CalendarClock,
    AlertCircle,
    UserCircle,
    BarChart3
} from 'lucide-react'

import { useAuthStore } from '@/lib/stores/auth-store'
import { getTodayReportStatus } from '@/actions/reports'
import { formatDate, formatRupiah, getGreeting, cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import type { TodayReportStatus } from '@/types'

export default function DashboardPage() {
    const { user } = useAuthStore()
    const [status, setStatus] = React.useState<TodayReportStatus | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)

    // Load status
    const loadStatus = React.useCallback(async () => {
        if (!user?.destination_id) {
            setIsLoading(false)
            return
        }

        const result = await getTodayReportStatus(user.destination_id)
        if (result.success && result.data) {
            setStatus(result.data)
        }
        setIsLoading(false)
    }, [user?.destination_id])

    // Initial load
    React.useEffect(() => {
        loadStatus()
    }, [loadStatus])

    // Auto-refresh when tab becomes visible
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user?.destination_id) {
                loadStatus()
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [loadStatus, user?.destination_id])

    const today = new Date()

    const getStatusInfo = () => {
        if (!status) return { label: 'Memuat...', color: 'bg-gray-100 text-gray-600', icon: Clock }

        switch (status.daily_status) {
            case 'submitted':
                return { label: 'Sudah Submit', color: 'bg-green-100 text-green-700', icon: CheckCircle2 }
            case 'draft':
                return { label: 'Draft', color: 'bg-yellow-100 text-yellow-700', icon: Clock }
            default:
                return { label: 'Belum Input', color: 'bg-gray-100 text-gray-600', icon: AlertCircle }
        }
    }

    const statusInfo = getStatusInfo()

    return (
        <div className="px-5 py-6 space-y-8">
            {/* Header */}
            <header className="space-y-2">
                <p className="text-base text-gray-500">{getGreeting()},</p>
                <div>
                    <h1 className="text-3xl font-black text-gray-900">{user?.name}</h1>
                    {user?.role === 'koordinator' && (
                        <p className="text-sm font-medium text-pink-600 mt-1">Koordinator</p>
                    )}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-6 h-6 text-pink-600" />
                    <span className="text-xl font-bold">{user?.destination?.name ?? 'Loading...'}</span>
                </div>
            </header>

            {/* Today's Status Card */}
            <section className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white">
                {/* Card Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-5 h-5" />
                        <span className="text-base font-medium">{formatDate(today)}</span>
                    </div>
                    <Badge className={cn("border-0", statusInfo.color)}>
                        <statusInfo.icon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                    </Badge>
                </div>

                {/* Card Content */}
                <div className="p-5">
                    {isLoading ? (
                        <div className="animate-pulse space-y-4">
                            <div className="h-8 bg-gray-100 rounded-xl w-1/2" />
                            <div className="h-14 bg-gray-100 rounded-xl" />
                        </div>
                    ) : status?.daily_status === 'pending' ? (
                        <div className="space-y-5">
                            <div className="text-center py-4">
                                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-xl font-bold text-gray-900">Belum ada laporan</p>
                                <p className="text-base text-gray-500">Hari ini</p>
                            </div>
                            <Link href="/input">
                                <Button className="w-full h-14 text-lg font-bold rounded-xl bg-pink-600 hover:bg-pink-700 text-white">
                                    <PenSquare className="w-5 h-5 mr-2" />
                                    Input Rekap Sekarang
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 border border-gray-200 rounded-xl">
                                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                                        <Users className="w-5 h-5" />
                                        <span className="text-sm font-medium">Pengunjung</span>
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">
                                        {status?.total_visitors?.toLocaleString('id-ID') ?? 0}
                                    </p>
                                </div>
                                <div className="p-4 border border-gray-200 rounded-xl">
                                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                                        <Banknote className="w-5 h-5" />
                                        <span className="text-sm font-medium">Pendapatan</span>
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">
                                        {formatRupiah(status?.total_revenue ?? 0, { compact: true })}
                                    </p>
                                </div>
                            </div>

                            {/* Action Button */}
                            <Link href={status?.daily_status === 'draft' ? '/input' : '/laporan'}>
                                <Button className="w-full h-14 text-lg font-bold rounded-xl bg-pink-600 hover:bg-pink-700 text-white">
                                    {status?.daily_status === 'draft' ? (
                                        <>
                                            <PenSquare className="w-5 h-5 mr-2" />
                                            Lanjutkan Input
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-5 h-5 mr-2" />
                                            Lihat Laporan
                                        </>
                                    )}
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Quick Actions */}
            <section className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Menu Cepat</h2>
                <div className="grid grid-cols-2 gap-4">
                    <Link href="/input">
                        <div className="border-2 border-gray-200 rounded-2xl p-5 bg-white hover:border-pink-300 active:scale-[0.98] transition-all">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-pink-600 flex items-center justify-center">
                                    <PenSquare className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">Input</p>
                                    <p className="text-base text-gray-500">Rekap Harian</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/riwayat">
                        <div className="border-2 border-gray-200 rounded-2xl p-5 bg-white hover:border-pink-300 active:scale-[0.98] transition-all">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-pink-600 flex items-center justify-center">
                                    <CalendarClock className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">Riwayat</p>
                                    <p className="text-base text-gray-500">7 Hari Terakhir</p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <div className="border-2 border-gray-200 rounded-2xl p-5 bg-white opacity-60">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gray-400 flex items-center justify-center">
                                <BarChart3 className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-lg">Ringkasan</p>
                                <p className="text-base text-gray-500">Segera Hadir</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-2 border-gray-200 rounded-2xl p-5 bg-white opacity-60">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gray-400 flex items-center justify-center">
                                <UserCircle className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-lg">Profil</p>
                                <p className="text-base text-gray-500">Segera Hadir</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
