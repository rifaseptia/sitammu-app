'use client'

import * as React from 'react'
import Link from 'next/link'
import {
    Users,
    Banknote,
    CheckCircle2,
    Clock,
    FileEdit,
    Building2,
    Loader2,
    Calendar,
    ChevronRight,
    BarChart3,
    MapPin
} from 'lucide-react'

import { getAllDestinationsStatus, getAdminSummary } from '@/actions/admin'
import { formatRupiah, formatNumber, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

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
                <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
            </div>
        )
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'submitted':
                return (
                    <Badge className="bg-green-100 text-green-700 border-0 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Submitted
                    </Badge>
                )
            case 'draft':
                return (
                    <Badge className="bg-yellow-100 text-yellow-700 border-0 font-bold">
                        <FileEdit className="w-3.5 h-3.5 mr-1" />
                        Draft
                    </Badge>
                )
            default:
                return (
                    <Badge className="bg-gray-100 text-gray-600 border-0 font-bold">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        Pending
                    </Badge>
                )
        }
    }

    const submissionRate = summary?.totalDestinations
        ? Math.round((summary.submittedCount / summary.totalDestinations) * 100)
        : 0

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>
                    <div className="flex items-center gap-2 text-gray-500 mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(new Date())}</span>
                    </div>
                </div>
                <Link
                    href="/admin/analytics"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-600 hover:border-pink-200 hover:text-pink-600 transition-colors font-medium"
                >
                    <BarChart3 className="w-4 h-4" />
                    Lihat Analytics
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </header>

            {/* Summary Cards - 4 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Destinasi */}
                <div className="border-2 border-gray-200 rounded-2xl bg-white p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-gray-500">Total Destinasi</span>
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-gray-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-gray-900">{summary?.totalDestinations || 0}</p>
                    <p className="text-sm text-gray-400 mt-1">destinasi terdaftar</p>
                </div>

                {/* Total Pengunjung */}
                <div className="border-2 border-gray-200 rounded-2xl bg-white p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-gray-500">Pengunjung Hari Ini</span>
                        <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-pink-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-gray-900">{formatNumber(summary?.totalVisitorsToday || 0)}</p>
                    <p className="text-sm text-gray-400 mt-1">total pengunjung</p>
                </div>

                {/* Total Pendapatan */}
                <div className="border-2 border-gray-200 rounded-2xl bg-white p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-gray-500">Pendapatan Hari Ini</span>
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                            <Banknote className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-gray-900">{formatRupiah(summary?.totalRevenueToday || 0, { compact: true })}</p>
                    <p className="text-sm text-gray-400 mt-1">total pendapatan</p>
                </div>

                {/* Laporan Masuk */}
                <div className="border-2 border-green-200 rounded-2xl bg-green-50 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-green-600">Laporan Masuk</span>
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-green-700">
                        {summary?.submittedCount || 0}
                        <span className="text-lg font-bold text-green-500">/{summary?.totalDestinations || 0}</span>
                    </p>
                    <div className="mt-3">
                        <div className="w-full bg-green-200 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${submissionRate}%` }}
                            />
                        </div>
                        <p className="text-sm text-green-600 mt-1 font-medium">{submissionRate}% sudah submit</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats Row */}
            {(summary?.pendingCount || summary?.draftCount) ? (
                <div className="flex flex-wrap gap-4">
                    {summary?.pendingCount ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span className="font-bold">{summary.pendingCount}</span>
                            <span>belum lapor</span>
                        </div>
                    ) : null}
                    {summary?.draftCount ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-100 text-yellow-700">
                            <FileEdit className="w-4 h-4" />
                            <span className="font-bold">{summary.draftCount}</span>
                            <span>draft</span>
                        </div>
                    ) : null}
                </div>
            ) : null}

            {/* Status Per Destinasi */}
            <section className="border-2 border-gray-200 rounded-2xl bg-white overflow-hidden">
                <div className="px-6 py-5 border-b-2 border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Status Destinasi Hari Ini</h2>
                    <p className="text-sm text-gray-500 mt-1">Rekapitulasi status pelaporan harian</p>
                </div>

                {/* Desktop Table */}
                <div className="hidden lg:block">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-bold text-gray-500">Destinasi</th>
                                <th className="text-left px-6 py-4 text-sm font-bold text-gray-500">Status</th>
                                <th className="text-right px-6 py-4 text-sm font-bold text-gray-500">Pengunjung</th>
                                <th className="text-right px-6 py-4 text-sm font-bold text-gray-500">Pendapatan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {destinations.map((dest) => (
                                <tr key={dest.destination_id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
                                                <MapPin className="w-5 h-5 text-pink-600" />
                                            </div>
                                            <span className="font-bold text-gray-900">{dest.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(dest.daily_status)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {dest.daily_status === 'submitted' ? (
                                            <span className="font-bold text-gray-900">
                                                {formatNumber(dest.total_visitors || 0)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {dest.daily_status === 'submitted' ? (
                                            <span className="font-bold text-green-600">
                                                {formatRupiah(dest.total_revenue || 0)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden divide-y-2 divide-gray-100">
                    {destinations.map((dest) => (
                        <div key={dest.destination_id} className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-pink-600" />
                                    </div>
                                    <span className="font-bold text-gray-900">{dest.name}</span>
                                </div>
                                {getStatusBadge(dest.daily_status)}
                            </div>
                            {dest.daily_status === 'submitted' && (
                                <div className="flex items-center justify-between text-sm pl-13">
                                    <span className="text-gray-500">
                                        <Users className="w-4 h-4 inline mr-1" />
                                        {formatNumber(dest.total_visitors || 0)} orang
                                    </span>
                                    <span className="font-bold text-green-600">
                                        {formatRupiah(dest.total_revenue || 0)}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
