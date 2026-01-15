'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Clock, ChevronRight, Users, Banknote, CheckCircle2, FileEdit, MapPin, Loader2 } from 'lucide-react'

import { useAuthStore } from '@/lib/stores/auth-store'
import { getRecentReports } from '@/actions/reports'
import { formatDateShort, formatRupiah, cn } from '@/lib/utils'

import { Badge } from '@/components/ui/badge'

import type { DailyReport } from '@/types'

export default function RiwayatPage() {
    const router = useRouter()
    const { user } = useAuthStore()

    const [reports, setReports] = React.useState<DailyReport[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    // Load reports
    const loadReports = React.useCallback(async () => {
        if (!user?.destination_id) {
            setIsLoading(false)
            return
        }

        const result = await getRecentReports(user.destination_id, 7)
        if (result.success && result.data) {
            setReports(result.data)
        }
        setIsLoading(false)
    }, [user?.destination_id])

    // Initial load
    React.useEffect(() => {
        loadReports()
    }, [loadReports])

    // Auto-refresh when tab becomes visible
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user?.destination_id) {
                loadReports()
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [loadReports, user?.destination_id])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
            </div>
        )
    }

    return (
        <div className="px-5 py-6 space-y-6">
            {/* Header */}
            <header className="space-y-1">
                <h1 className="text-2xl font-black text-gray-900">Riwayat Laporan</h1>
                <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-5 h-5 text-pink-600" />
                    <span className="text-lg font-bold">{user?.destination?.name}</span>
                </div>
                <p className="text-base text-gray-500">7 hari terakhir</p>
            </header>

            {reports.length === 0 ? (
                <div className="border-2 border-gray-200 rounded-2xl p-8 text-center bg-white">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-700 mb-2">
                        Belum Ada Riwayat
                    </h2>
                    <p className="text-gray-500">
                        Riwayat laporan akan muncul di sini
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reports.map((report) => (
                        <button
                            key={report.id}
                            className="w-full text-left border-2 border-gray-200 rounded-2xl bg-white p-5 transition-all active:scale-[0.98]"
                            onClick={() => {
                                router.push(`/laporan?date=${report.report_date}`)
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    {/* Date & Status */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-bold text-gray-900">
                                            {formatDateShort(report.report_date)}
                                        </span>
                                        <Badge className={cn(
                                            'font-bold border-0',
                                            report.status === 'submitted'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        )}>
                                            {report.status === 'submitted' ? (
                                                <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Submitted</>
                                            ) : (
                                                <><FileEdit className="w-3.5 h-3.5 mr-1" />Draft</>
                                            )}
                                        </Badge>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-5 text-base text-gray-600">
                                        <span className="flex items-center gap-2">
                                            <Users className="w-5 h-5 text-pink-600" />
                                            <span className="font-bold">{report.total_visitors.toLocaleString('id-ID')}</span>
                                            <span className="text-gray-400">orang</span>
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <Banknote className="w-5 h-5 text-green-600" />
                                            <span className="font-bold">{formatRupiah(report.total_revenue, { compact: true })}</span>
                                        </span>
                                    </div>
                                </div>

                                <ChevronRight className="w-6 h-6 text-gray-300" />
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
