'use client'

import * as React from 'react'
import {
    TrendingUp,
    TrendingDown,
    Users,
    Banknote,
    MapPin,
    CreditCard,
    Wallet,
    Baby,
    UserCircle,
    Globe,
    Loader2
} from 'lucide-react'

import {
    getMonthlyStats,
    getDestinationRankings,
    getDemographicStats,
    getPaymentStats,
    getMonthlyComparison
} from '@/actions/analytics'
import { formatRupiah, formatNumber, cn } from '@/lib/utils'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface MonthlyStats {
    month: string
    total_visitors: number
    total_revenue: number
    report_count: number
}

interface DestinationRanking {
    destination_id: string
    destination_name: string
    destination_code: string
    total_visitors: number
    total_revenue: number
}

interface DemographicStats {
    total_anak: number
    total_dewasa: number
    total_wna: number
    dewasa_male: number
    dewasa_female: number
    anak_male: number
    anak_female: number
}

interface PaymentStats {
    total_cash: number
    total_qris: number
    cash_percentage: number
    qris_percentage: number
}

interface Comparison {
    current: { visitors: number; revenue: number }
    previous: { visitors: number; revenue: number }
    change: { visitors: number; revenue: number }
}

interface Destination {
    id: string
    code: string
    name: string
}

export default function AnalyticsPage() {
    const currentYear = new Date().getFullYear()
    const [selectedYear, setSelectedYear] = React.useState(currentYear)
    const [selectedDestination, setSelectedDestination] = React.useState<string>('')
    const [destinations, setDestinations] = React.useState<Destination[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    const [monthlyStats, setMonthlyStats] = React.useState<MonthlyStats[]>([])
    const [rankings, setRankings] = React.useState<DestinationRanking[]>([])
    const [demographics, setDemographics] = React.useState<DemographicStats | null>(null)
    const [payment, setPayment] = React.useState<PaymentStats | null>(null)
    const [comparison, setComparison] = React.useState<Comparison | null>(null)

    // Load destinations on mount
    React.useEffect(() => {
        async function loadDestinations() {
            const { getAllDestinations } = await import('@/actions/destinations')
            const result = await getAllDestinations()
            if (result.success && result.data) {
                setDestinations(result.data)
            }
        }
        loadDestinations()
    }, [])

    const destId = selectedDestination && selectedDestination !== 'all' ? selectedDestination : undefined

    const loadData = async () => {
        setIsLoading(true)
        const [monthlyResult, rankingResult, demoResult, paymentResult, compResult] = await Promise.all([
            getMonthlyStats(selectedYear, destId),
            getDestinationRankings({ year: selectedYear, destinationId: destId }),
            getDemographicStats({ year: selectedYear, destinationId: destId }),
            getPaymentStats({ year: selectedYear, destinationId: destId }),
            getMonthlyComparison(destId),
        ])

        if (monthlyResult.success) setMonthlyStats(monthlyResult.data || [])
        if (rankingResult.success) setRankings(rankingResult.data || [])
        if (demoResult.success) setDemographics(demoResult.data || null)
        if (paymentResult.success) setPayment(paymentResult.data || null)
        if (compResult.success) setComparison(compResult.data || null)

        setIsLoading(false)
    }

    React.useEffect(() => {
        loadData()
    }, [selectedYear, selectedDestination])

    const getMonthName = (month: string) => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
        const idx = parseInt(month.split('-')[1]) - 1
        return monthNames[idx] || month
    }

    const totalVisitors = demographics
        ? demographics.total_anak + demographics.total_dewasa + demographics.total_wna
        : 0

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-gray-500">
                        Laporan dan statistik manajemen
                        {selectedDestination && selectedDestination !== 'all' && destinations.find(d => d.id === selectedDestination) && (
                            <span className="font-medium text-gray-700"> - {destinations.find(d => d.id === selectedDestination)?.name}</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedDestination || 'all'} onValueChange={setSelectedDestination}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Semua Destinasi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Destinasi</SelectItem>
                            {destinations.map((dest) => (
                                <SelectItem key={dest.id} value={dest.id}>{dest.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                        <SelectTrigger className="w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
                                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Month-over-Month Comparison - Only show for current year */}
            {comparison && selectedYear === currentYear && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">
                                Pengunjung Bulan Ini
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-bold">{formatNumber(comparison.current.visitors)}</span>
                                <Badge className={cn(
                                    'flex items-center gap-1',
                                    comparison.change.visitors >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                )}>
                                    {comparison.change.visitors >= 0 ? (
                                        <TrendingUp className="w-3 h-3" />
                                    ) : (
                                        <TrendingDown className="w-3 h-3" />
                                    )}
                                    {comparison.change.visitors}%
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                vs bulan lalu: {formatNumber(comparison.previous.visitors)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">
                                Pendapatan Bulan Ini
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-bold">{formatRupiah(comparison.current.revenue, { compact: true })}</span>
                                <Badge className={cn(
                                    'flex items-center gap-1',
                                    comparison.change.revenue >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                )}>
                                    {comparison.change.revenue >= 0 ? (
                                        <TrendingUp className="w-3 h-3" />
                                    ) : (
                                        <TrendingDown className="w-3 h-3" />
                                    )}
                                    {comparison.change.revenue}%
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                vs bulan lalu: {formatRupiah(comparison.previous.revenue, { compact: true })}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Monthly Trend */}
            <Card>
                <CardHeader>
                    <CardTitle>Trend Bulanan {selectedYear}</CardTitle>
                    <CardDescription>Pengunjung dan pendapatan per bulan</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 px-2">Bulan</th>
                                    <th className="text-right py-2 px-2">Pengunjung</th>
                                    <th className="text-right py-2 px-2">Pendapatan</th>
                                    <th className="text-right py-2 px-2">Laporan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyStats.map((stat) => (
                                    <tr key={stat.month} className="border-b hover:bg-gray-50">
                                        <td className="py-2 px-2 font-medium">{getMonthName(stat.month)}</td>
                                        <td className="py-2 px-2 text-right">{formatNumber(stat.total_visitors)}</td>
                                        <td className="py-2 px-2 text-right">{formatRupiah(stat.total_revenue, { compact: true })}</td>
                                        <td className="py-2 px-2 text-right text-gray-500">{stat.report_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Demographics - Full Width Section with Multi-Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Demografi Pengunjung
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!demographics ? (
                        <p className="text-center text-gray-500 py-4">Belum ada data</p>
                    ) : (
                        <div className="space-y-6">
                            {/* Row 1: Category Stats + Percentage Bars */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Category Cards */}
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-3">Kategori Pengunjung</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center p-4 bg-gray-50 rounded-lg border">
                                            <Baby className="w-6 h-6 mx-auto text-gray-600 mb-2" />
                                            <p className="font-bold text-2xl">{formatNumber(demographics.total_anak)}</p>
                                            <p className="text-xs text-gray-500">Anak</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {totalVisitors > 0 ? ((demographics.total_anak / totalVisitors) * 100).toFixed(1) : 0}%
                                            </p>
                                        </div>
                                        <div className="text-center p-4 bg-gray-50 rounded-lg border">
                                            <UserCircle className="w-6 h-6 mx-auto text-gray-600 mb-2" />
                                            <p className="font-bold text-2xl">{formatNumber(demographics.total_dewasa)}</p>
                                            <p className="text-xs text-gray-500">Dewasa</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {totalVisitors > 0 ? ((demographics.total_dewasa / totalVisitors) * 100).toFixed(1) : 0}%
                                            </p>
                                        </div>
                                        <div className="text-center p-4 bg-gray-50 rounded-lg border">
                                            <Globe className="w-6 h-6 mx-auto text-gray-600 mb-2" />
                                            <p className="font-bold text-2xl">{formatNumber(demographics.total_wna)}</p>
                                            <p className="text-xs text-gray-500">WNA</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {totalVisitors > 0 ? ((demographics.total_wna / totalVisitors) * 100).toFixed(1) : 0}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Category Distribution Bar */}
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-3">Distribusi Kategori</p>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600">Dewasa</span>
                                                <span className="text-gray-500">{formatNumber(demographics.total_dewasa)}</span>
                                            </div>
                                            <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gray-600 rounded-full transition-all"
                                                    style={{ width: `${totalVisitors > 0 ? (demographics.total_dewasa / totalVisitors) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600">Anak</span>
                                                <span className="text-gray-500">{formatNumber(demographics.total_anak)}</span>
                                            </div>
                                            <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gray-500 rounded-full transition-all"
                                                    style={{ width: `${totalVisitors > 0 ? (demographics.total_anak / totalVisitors) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600">WNA</span>
                                                <span className="text-gray-500">{formatNumber(demographics.total_wna)}</span>
                                            </div>
                                            <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gray-400 rounded-full transition-all"
                                                    style={{ width: `${totalVisitors > 0 ? (demographics.total_wna / totalVisitors) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Gender Breakdown */}
                            <div className="border-t pt-6">
                                <p className="text-sm font-medium text-gray-500 mb-4">Rasio Gender</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Gender Dewasa */}
                                    {demographics.total_dewasa > 0 && (
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="font-medium text-gray-700">Dewasa</span>
                                                <span className="text-sm text-gray-500">{formatNumber(demographics.total_dewasa)} total</span>
                                            </div>
                                            <div className="flex h-8 rounded-full overflow-hidden bg-gray-200">
                                                <div
                                                    className="bg-gray-700 flex items-center justify-center text-xs text-white font-medium"
                                                    style={{ width: `${(demographics.dewasa_male / demographics.total_dewasa) * 100}%` }}
                                                >
                                                    {((demographics.dewasa_male / demographics.total_dewasa) * 100).toFixed(0)}%
                                                </div>
                                                <div
                                                    className="bg-gray-400 flex items-center justify-center text-xs text-white font-medium"
                                                    style={{ width: `${(demographics.dewasa_female / demographics.total_dewasa) * 100}%` }}
                                                >
                                                    {((demographics.dewasa_female / demographics.total_dewasa) * 100).toFixed(0)}%
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                                                <span>♂ Laki-laki: {formatNumber(demographics.dewasa_male)}</span>
                                                <span>♀ Perempuan: {formatNumber(demographics.dewasa_female)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Gender Anak */}
                                    {demographics.total_anak > 0 && (
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="font-medium text-gray-700">Anak</span>
                                                <span className="text-sm text-gray-500">{formatNumber(demographics.total_anak)} total</span>
                                            </div>
                                            <div className="flex h-8 rounded-full overflow-hidden bg-gray-200">
                                                <div
                                                    className="bg-gray-700 flex items-center justify-center text-xs text-white font-medium"
                                                    style={{ width: `${(demographics.anak_male / demographics.total_anak) * 100}%` }}
                                                >
                                                    {((demographics.anak_male / demographics.total_anak) * 100).toFixed(0)}%
                                                </div>
                                                <div
                                                    className="bg-gray-400 flex items-center justify-center text-xs text-white font-medium"
                                                    style={{ width: `${(demographics.anak_female / demographics.total_anak) * 100}%` }}
                                                >
                                                    {((demographics.anak_female / demographics.total_anak) * 100).toFixed(0)}%
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                                                <span>♂ Laki-laki: {formatNumber(demographics.anak_male)}</span>
                                                <span>♀ Perempuan: {formatNumber(demographics.anak_female)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Row 3: Summary Stats */}
                            <div className="border-t pt-4 flex items-center justify-center gap-8 text-center">
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">{formatNumber(totalVisitors)}</p>
                                    <p className="text-sm text-gray-500">Total Pengunjung</p>
                                </div>
                                <div className="h-12 w-px bg-gray-200" />
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {totalVisitors > 0
                                            ? (((demographics.dewasa_male + demographics.anak_male) / totalVisitors) * 100).toFixed(0)
                                            : 0}%
                                    </p>
                                    <p className="text-sm text-gray-500">Laki-laki</p>
                                </div>
                                <div className="h-12 w-px bg-gray-200" />
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {totalVisitors > 0
                                            ? (((demographics.dewasa_female + demographics.anak_female) / totalVisitors) * 100).toFixed(0)
                                            : 0}%
                                    </p>
                                    <p className="text-sm text-gray-500">Perempuan</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payment & Destinations - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Method */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Banknote className="w-5 h-5" />
                            Metode Pembayaran
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!payment ? (
                            <p className="text-center text-gray-500 py-4">Belum ada data</p>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-100 rounded-full">
                                        <Wallet className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className="font-medium text-gray-700">Cash</p>
                                            <p className="text-sm text-gray-500">{payment.cash_percentage}%</p>
                                        </div>
                                        <p className="text-xl font-bold">{formatRupiah(payment.total_cash, { compact: true })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-100 rounded-full">
                                        <CreditCard className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className="font-medium text-gray-700">QRIS</p>
                                            <p className="text-sm text-gray-500">{payment.qris_percentage}%</p>
                                        </div>
                                        <p className="text-xl font-bold">{formatRupiah(payment.total_qris, { compact: true })}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Destinations */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            Destinasi Terpopuler
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {rankings.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">Belum ada data</p>
                        ) : (
                            <div className="space-y-3">
                                {rankings.slice(0, 5).map((dest, idx) => (
                                    <div key={dest.destination_id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                                                idx === 0 ? 'bg-gray-800 text-white' :
                                                    idx === 1 ? 'bg-gray-600 text-white' :
                                                        idx === 2 ? 'bg-gray-400 text-white' :
                                                            'bg-gray-200 text-gray-600'
                                            )}>
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <p className="font-medium">{dest.destination_name}</p>
                                                <p className="text-xs text-gray-500">{formatNumber(dest.total_visitors)} pengunjung</p>
                                            </div>
                                        </div>
                                        <span className="font-semibold text-gray-700">
                                            {formatRupiah(dest.total_revenue, { compact: true })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
