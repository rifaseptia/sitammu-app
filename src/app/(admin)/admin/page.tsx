'use client'

import * as React from 'react'
import {
    Users,
    Banknote,
    CheckCircle2,
    Clock,
    FileEdit,
    Building2,
    Loader2
} from 'lucide-react'

import { getAllDestinationsStatus, getAdminSummary } from '@/actions/admin'
import { formatRupiah, formatNumber, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Summary {
    totalDestinations: number
    totalVisitorsToday: number
    totalRevenueToday: number
    submittedCount: number
    pendingCount: number
    draftCount: number
}

interface DestinationStatus {
    destination_id: string
    code: string
    name: string
    report_id: string | null
    status: string | null
    total_visitors: number | null
    total_revenue: number | null
    submitted_at: string | null
    daily_status: 'pending' | 'draft' | 'submitted'
}

export default function AdminDashboard() {
    const [summary, setSummary] = React.useState<Summary | null>(null)
    const [destinations, setDestinations] = React.useState<DestinationStatus[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        async function load() {
            const [summaryResult, destResult] = await Promise.all([
                getAdminSummary(),
                getAllDestinationsStatus(),
            ])

            if (summaryResult.success && summaryResult.data) {
                setSummary(summaryResult.data)
            }

            if (destResult.success && destResult.data) {
                setDestinations(destResult.data as DestinationStatus[])
            }

            setIsLoading(false)
        }
        load()
    }, [])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'submitted':
                return (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Submitted
                    </Badge>
                )
            case 'draft':
                return (
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                        <FileEdit className="w-3 h-3 mr-1" />
                        Draft
                    </Badge>
                )
            default:
                return (
                    <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                    </Badge>
                )
        }
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500">{formatDate(new Date())}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Destinasi</CardTitle>
                        <Building2 className="w-4 h-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.totalDestinations || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Pengunjung</CardTitle>
                        <Users className="w-4 h-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(summary?.totalVisitorsToday || 0)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Pendapatan</CardTitle>
                        <Banknote className="w-4 h-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatRupiah(summary?.totalRevenueToday || 0, { compact: true })}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Laporan Masuk - Highlight Card */}
            <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-full">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-green-600">Laporan Masuk Hari Ini</p>
                                <p className="text-3xl font-bold text-green-700">
                                    {summary?.submittedCount || 0} <span className="text-lg font-normal text-green-500">/ {summary?.totalDestinations || 0} destinasi</span>
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">{summary?.pendingCount || 0} belum lapor</p>
                            {summary?.draftCount !== undefined && summary.draftCount > 0 && (
                                <p className="text-sm text-yellow-600">{summary.draftCount} draft</p>
                            )}
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-4">
                        <div className="w-full bg-green-100 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${summary?.totalDestinations ? (summary.submittedCount / summary.totalDestinations) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Status Per Destinasi */}
            <Card>
                <CardHeader>
                    <CardTitle>Status Destinasi Hari Ini</CardTitle>
                    <CardDescription>Rekapitulasi status pelaporan harian</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                        {destinations.map((dest) => (
                            <div
                                key={dest.destination_id}
                                className="flex items-center justify-between py-4"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{dest.name}</span>
                                        <span className="text-xs text-gray-500">({dest.code})</span>
                                    </div>
                                    {getStatusBadge(dest.daily_status)}
                                </div>

                                <div className="text-right">
                                    {dest.daily_status === 'submitted' ? (
                                        <div>
                                            <p className="font-medium">
                                                {formatNumber(dest.total_visitors || 0)} pengunjung
                                            </p>
                                            <p className="text-sm text-green-600">
                                                {formatRupiah(dest.total_revenue || 0)}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400">
                                            {dest.daily_status === 'draft' ? 'Draft tersimpan' : 'Belum ada data'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
