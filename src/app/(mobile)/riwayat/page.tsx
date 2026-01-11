'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Clock, ChevronRight, Users, Banknote, CheckCircle2, FileEdit } from 'lucide-react'

import { useAuthStore } from '@/lib/stores/auth-store'
import { getRecentReports } from '@/actions/reports'
import { formatDateShort, formatRupiah, cn } from '@/lib/utils'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import type { DailyReport } from '@/types'

export default function RiwayatPage() {
    const router = useRouter()
    const { user } = useAuthStore()

    const [reports, setReports] = React.useState<DailyReport[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        async function load() {
            if (!user?.destination_id) return

            const result = await getRecentReports(user.destination_id, 14)
            if (result.success && result.data) {
                setReports(result.data)
            }
            setIsLoading(false)
        }
        load()
    }, [user?.destination_id])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="px-4 py-6 space-y-4">
            {/* Header */}
            <header>
                <h1 className="text-xl font-bold text-gray-900">Riwayat Laporan</h1>
                <p className="text-sm text-gray-600">14 hari terakhir</p>
            </header>

            {reports.length === 0 ? (
                <Card>
                    <CardContent className="pt-6 text-center">
                        <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-gray-700 mb-2">
                            Belum Ada Riwayat
                        </h2>
                        <p className="text-gray-500">
                            Riwayat laporan akan muncul di sini
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {reports.map((report) => (
                        <Card
                            key={report.id}
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => {
                                // Navigate based on status
                                if (report.status === 'submitted') {
                                    router.push('/laporan')
                                } else {
                                    router.push('/input')
                                }
                            }}
                        >
                            <CardContent className="py-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-900">
                                                {formatDateShort(report.report_date)}
                                            </span>
                                            <Badge className={cn(
                                                'text-xs',
                                                report.status === 'submitted'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                            )}>
                                                {report.status === 'submitted' ? (
                                                    <><CheckCircle2 className="w-3 h-3 mr-1" />Submitted</>
                                                ) : (
                                                    <><FileEdit className="w-3 h-3 mr-1" />Draft</>
                                                )}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                {report.total_visitors.toLocaleString('id-ID')} orang
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Banknote className="w-4 h-4" />
                                                {formatRupiah(report.total_revenue, { compact: true })}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
