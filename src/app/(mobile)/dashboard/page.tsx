'use client'

import * as React from 'react'
import Link from 'next/link'
import {
    MapPin,
    Calendar,
    Users,
    Banknote,
    ClipboardEdit,
    CheckCircle2,
    Clock,
    ChevronRight,
    AlertCircle
} from 'lucide-react'

import { APP } from '@/lib/constants'
import { useAuthStore } from '@/lib/stores/auth-store'
import { getTodayReportStatus } from '@/actions/reports'
import { formatDate, formatRupiah, getGreeting, cn } from '@/lib/utils'

import { Card, CardContent } from '@/components/ui/card'
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

    // Auto-refresh when tab becomes visible (sync across devices)
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

    const getStatusBadge = () => {
        if (!status) return null

        switch (status.daily_status) {
            case 'submitted':
                return (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Sudah Submit
                    </Badge>
                )
            case 'draft':
                return (
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                        <Clock className="w-3 h-3 mr-1" />
                        Draft
                    </Badge>
                )
            default:
                return (
                    <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Belum Input
                    </Badge>
                )
        }
    }

    return (
        <div className="px-4 py-6 space-y-6">
            {/* Header */}
            <header className="space-y-2">
                <p className="text-gray-500">{getGreeting()},</p>
                <h1 className="text-3xl font-bold text-gray-900">{user?.name}</h1>
                <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-5 h-5" />
                    <span className="text-base">{user?.destination?.name ?? 'Loading...'}</span>
                    {user?.role === 'koordinator' && (
                        <Badge variant="secondary" className="ml-1">
                            👑 Koordinator
                        </Badge>
                    )}
                </div>
            </header>

            {/* Today's Status Card */}
            <Card className="bg-gradient-to-br from-pink-600 to-pink-700 text-white border-0 shadow-lg">
                <CardContent className="pt-5 pb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 opacity-80" />
                            <span className="text-sm text-pink-100">
                                {formatDate(today)}
                            </span>
                        </div>
                        {getStatusBadge()}
                    </div>

                    {isLoading ? (
                        <div className="animate-pulse space-y-3">
                            <div className="h-8 bg-white/20 rounded w-1/2" />
                            <div className="h-6 bg-white/20 rounded w-1/3" />
                        </div>
                    ) : status?.daily_status === 'pending' ? (
                        <div className="space-y-4">
                            <div>
                                <p className="text-pink-100 text-sm mb-1">Status Hari Ini</p>
                                <p className="text-xl font-semibold">Belum ada laporan</p>
                            </div>
                            <Link href="/input">
                                <Button
                                    size="lg"
                                    className="w-full bg-white text-pink-700 hover:bg-pink-50 font-semibold"
                                >
                                    <ClipboardEdit className="w-5 h-5 mr-2" />
                                    Input Rekap Sekarang
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-pink-100 text-sm mb-1">Total Pengunjung</p>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5" />
                                        <span className="text-2xl font-bold">
                                            {status?.total_visitors?.toLocaleString('id-ID') ?? 0}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-pink-100 text-sm mb-1">Total Pendapatan</p>
                                    <div className="flex items-center gap-2">
                                        <Banknote className="w-5 h-5" />
                                        <span className="text-xl font-bold">
                                            {formatRupiah(status?.total_revenue ?? 0, { compact: true })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Link href={status?.daily_status === 'draft' ? '/input' : '/laporan'}>
                                <Button
                                    size="lg"
                                    className="w-full bg-white text-pink-700 hover:bg-pink-50 font-semibold"
                                >
                                    {status?.daily_status === 'draft' ? (
                                        <>
                                            <ClipboardEdit className="w-5 h-5 mr-2" />
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
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Menu Cepat</h2>
                <div className="grid grid-cols-2 gap-4">
                    <Link href="/input">
                        <Card className="hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-pink-200 active:scale-95">
                            <CardContent className="p-5 flex flex-col items-center gap-3 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg">
                                    <ClipboardEdit className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">Input</p>
                                    <p className="text-sm text-gray-500">Rekap Harian</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/riwayat">
                        <Card className="hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-green-200 active:scale-95">
                            <CardContent className="p-5 flex flex-col items-center gap-3 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                                    <Clock className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">Riwayat</p>
                                    <p className="text-sm text-gray-500">7 Hari Terakhir</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </section>

            {/* App Info */}
            <footer className="text-center pt-4">
                <p className="text-xs text-gray-400">
                    {APP.name} v{APP.version}
                </p>
                <p className="text-xs text-gray-400 italic">
                    {APP.tagline}
                </p>
            </footer>
        </div>
    )
}
