'use client'

import * as React from 'react'
import {
    TrendingUp,
    TrendingDown,
    Users,
    Banknote,
    MapPin,
    Award,
    Calendar,
    BarChart3,
    Target,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
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
import { DonutChart, VerticalBarChart, CHART_COLORS } from '@/components/ui/charts'

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

// KPI Card Component
function KPICard({
    title,
    value,
    subtitle,
    change,
    icon: Icon,
    trend,
    color = 'indigo'
}: {
    title: string
    value: string
    subtitle?: string
    change?: number
    icon: React.ElementType
    trend?: 'up' | 'down' | 'neutral'
    color?: 'indigo' | 'emerald' | 'amber' | 'rose'
}) {
    const colorClasses = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        rose: 'bg-rose-50 text-rose-600',
    }

    return (
        <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10">
                <Icon className="w-full h-full" />
            </div>
            <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">{title}</p>
                        <p className="text-3xl font-bold mt-1">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
                        )}
                    </div>
                    <div className={cn('p-3 rounded-xl', colorClasses[color])}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>
                {change !== undefined && (
                    <div className="flex items-center mt-4 pt-4 border-t">
                        {trend === 'up' ? (
                            <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
                        ) : trend === 'down' ? (
                            <ArrowDownRight className="w-4 h-4 text-rose-500 mr-1" />
                        ) : null}
                        <span className={cn(
                            'text-sm font-medium',
                            trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-gray-500'
                        )}>
                            {change > 0 ? '+' : ''}{change}%
                        </span>
                        <span className="text-sm text-gray-400 ml-2">vs bulan lalu</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Insight Card
function InsightCard({
    title,
    description,
    icon: Icon,
    color = 'indigo'
}: {
    title: string
    description: string
    icon: React.ElementType
    color?: string
}) {
    return (
        <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border">
            <div className={`p-2 rounded-lg bg-${color}-100`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <div>
                <p className="font-medium text-gray-900">{title}</p>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
        </div>
    )
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

    // Calculate insights
    const totalVisitors = demographics
        ? demographics.total_anak + demographics.total_dewasa + demographics.total_wna
        : 0

    const totalRevenue = monthlyStats.reduce((sum, s) => sum + s.total_revenue, 0)
    const totalReports = monthlyStats.reduce((sum, s) => sum + s.report_count, 0)

    const avgRevenuePerVisitor = totalVisitors > 0
        ? Math.round(totalRevenue / totalVisitors)
        : 0

    const bestDestination = rankings[0]
    const worstDestination = rankings[rankings.length - 1]

    // Best month calculation
    const bestMonth = monthlyStats.reduce((best, current) =>
        current.total_revenue > (best?.total_revenue || 0) ? current : best
        , monthlyStats[0])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Page Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">📊 Dashboard Analytics</h1>
                    <p className="text-gray-500">
                        Insight dan performa destinasi wisata
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

            {/* KPI Cards - Key Performance Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Pendapatan"
                    value={formatRupiah(totalRevenue, { compact: true })}
                    subtitle={`${formatNumber(totalReports)} laporan`}
                    change={comparison?.change.revenue}
                    trend={comparison?.change.revenue ? (comparison.change.revenue >= 0 ? 'up' : 'down') : 'neutral'}
                    icon={Banknote}
                    color="emerald"
                />
                <KPICard
                    title="Total Pengunjung"
                    value={formatNumber(totalVisitors)}
                    subtitle="Semua kategori"
                    change={comparison?.change.visitors}
                    trend={comparison?.change.visitors ? (comparison.change.visitors >= 0 ? 'up' : 'down') : 'neutral'}
                    icon={Users}
                    color="indigo"
                />
                <KPICard
                    title="Rata-rata per Pengunjung"
                    value={formatRupiah(avgRevenuePerVisitor)}
                    subtitle="Revenue / visitor"
                    icon={Target}
                    color="amber"
                />
                <KPICard
                    title="Destinasi Aktif"
                    value={String(rankings.length)}
                    subtitle={`${formatNumber(totalReports)} laporan terkirim`}
                    icon={MapPin}
                    color="rose"
                />
            </div>

            {/* Quick Insights */}
            {bestDestination && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-amber-200 rounded-xl">
                                    <Award className="w-6 h-6 text-amber-700" />
                                </div>
                                <div>
                                    <p className="text-sm text-amber-700">🏆 Destinasi Terbaik</p>
                                    <p className="text-xl font-bold text-amber-900">{bestDestination.destination_name}</p>
                                    <p className="text-sm text-amber-600">
                                        {formatRupiah(bestDestination.total_revenue, { compact: true })} • {formatNumber(bestDestination.total_visitors)} pengunjung
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {bestMonth && (
                        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-200 rounded-xl">
                                        <Calendar className="w-6 h-6 text-indigo-700" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-indigo-700">📅 Bulan Terbaik</p>
                                        <p className="text-xl font-bold text-indigo-900">{getMonthName(bestMonth.month)} {selectedYear}</p>
                                        <p className="text-sm text-indigo-600">
                                            {formatRupiah(bestMonth.total_revenue, { compact: true })} pendapatan
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {payment && (
                        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-emerald-200 rounded-xl">
                                        <Zap className="w-6 h-6 text-emerald-700" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-emerald-700">💳 Metode Favorit</p>
                                        <p className="text-xl font-bold text-emerald-900">
                                            {payment.cash_percentage > payment.qris_percentage ? 'Cash' : 'QRIS'}
                                        </p>
                                        <p className="text-sm text-emerald-600">
                                            {Math.max(payment.cash_percentage, payment.qris_percentage)}% dari total transaksi
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Trend - Takes 2 columns */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-indigo-500" />
                            Trend Pendapatan Bulanan
                        </CardTitle>
                        <CardDescription>Performa pendapatan per bulan {selectedYear}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {monthlyStats.length > 0 ? (
                            <VerticalBarChart
                                data={monthlyStats.map((stat, idx) => ({
                                    label: getMonthName(stat.month),
                                    value: stat.total_revenue,
                                    color: stat === bestMonth ? CHART_COLORS.success : CHART_COLORS.primary,
                                }))}
                                height={140}
                                barWidth={36}
                                formatValue={(v) => formatRupiah(v, { compact: true })}
                            />
                        ) : (
                            <p className="text-center text-gray-500 py-8">Belum ada data</p>
                        )}
                    </CardContent>
                </Card>

                {/* Demographics Donut */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-500" />
                            Demografi Pengunjung
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {demographics ? (
                            <div className="flex justify-center">
                                <DonutChart
                                    data={[
                                        { label: 'Dewasa', value: demographics.total_dewasa, color: CHART_COLORS.primary },
                                        { label: 'Anak', value: demographics.total_anak, color: CHART_COLORS.info },
                                        { label: 'WNA', value: demographics.total_wna, color: CHART_COLORS.success },
                                    ]}
                                    size={160}
                                    centerValue={formatNumber(totalVisitors)}
                                    centerLabel="Total"
                                />
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-8">Belum ada data</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Payment & Gender in one row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Banknote className="w-5 h-5 text-emerald-500" />
                            Distribusi Pembayaran
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {payment ? (
                            <div className="flex justify-center">
                                <DonutChart
                                    data={[
                                        { label: 'Cash', value: payment.total_cash, color: CHART_COLORS.success },
                                        { label: 'QRIS', value: payment.total_qris, color: CHART_COLORS.primary },
                                    ]}
                                    size={140}
                                    centerValue={formatRupiah(payment.total_cash + payment.total_qris, { compact: true })}
                                    centerLabel="Total"
                                />
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-8">Belum ada data</p>
                        )}
                    </CardContent>
                </Card>

                {/* Gender Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-pink-500" />
                            Rasio Gender
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {demographics ? (
                            <div className="flex justify-center gap-8">
                                {demographics.total_dewasa > 0 && (
                                    <div className="text-center">
                                        <p className="text-sm text-gray-500 mb-2">Dewasa</p>
                                        <DonutChart
                                            data={[
                                                { label: 'L', value: demographics.dewasa_male, color: CHART_COLORS.info },
                                                { label: 'P', value: demographics.dewasa_female, color: CHART_COLORS.pink },
                                            ]}
                                            size={100}
                                            strokeWidth={14}
                                            showLegend={false}
                                            centerValue={`${Math.round((demographics.dewasa_male / demographics.total_dewasa) * 100)}%`}
                                            centerLabel="L"
                                        />
                                    </div>
                                )}
                                {demographics.total_anak > 0 && (
                                    <div className="text-center">
                                        <p className="text-sm text-gray-500 mb-2">Anak</p>
                                        <DonutChart
                                            data={[
                                                { label: 'L', value: demographics.anak_male, color: CHART_COLORS.info },
                                                { label: 'P', value: demographics.anak_female, color: CHART_COLORS.pink },
                                            ]}
                                            size={100}
                                            strokeWidth={14}
                                            showLegend={false}
                                            centerValue={`${Math.round((demographics.anak_male / demographics.total_anak) * 100)}%`}
                                            centerLabel="L"
                                        />
                                    </div>
                                )}
                                <div className="flex flex-col justify-center gap-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.info }} />
                                        <span>Laki-laki</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS.pink }} />
                                        <span>Perempuan</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-8">Belum ada data</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Destination Performance Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-rose-500" />
                        Performa Destinasi
                    </CardTitle>
                    <CardDescription>Peringkat berdasarkan pendapatan</CardDescription>
                </CardHeader>
                <CardContent>
                    {rankings.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">Belum ada data</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="pb-3 font-medium text-gray-500">#</th>
                                        <th className="pb-3 font-medium text-gray-500">Destinasi</th>
                                        <th className="pb-3 font-medium text-gray-500 text-right">Pengunjung</th>
                                        <th className="pb-3 font-medium text-gray-500 text-right">Pendapatan</th>
                                        <th className="pb-3 font-medium text-gray-500 text-right">Contrib.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rankings.map((dest, idx) => {
                                        const contribution = totalRevenue > 0
                                            ? ((dest.total_revenue / totalRevenue) * 100).toFixed(1)
                                            : '0'
                                        return (
                                            <tr key={dest.destination_id} className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="py-3">
                                                    <span className={cn(
                                                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                                                        idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                            idx === 1 ? 'bg-gray-100 text-gray-600' :
                                                                idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-gray-50 text-gray-400'
                                                    )}>
                                                        {idx + 1}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <p className="font-medium">{dest.destination_name}</p>
                                                    <p className="text-xs text-gray-400">{dest.destination_code}</p>
                                                </td>
                                                <td className="py-3 text-right">{formatNumber(dest.total_visitors)}</td>
                                                <td className="py-3 text-right font-semibold text-emerald-600">
                                                    {formatRupiah(dest.total_revenue, { compact: true })}
                                                </td>
                                                <td className="py-3 text-right">
                                                    <Badge variant="outline" className="font-normal">
                                                        {contribution}%
                                                    </Badge>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
