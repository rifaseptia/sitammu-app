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
    Loader2,
    BarChart3
} from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts'

import {
    getMonthlyStats,
    getDestinationRankings,
    getDemographicStats,
    getPaymentStats,
    getMonthlyComparison
} from '@/actions/analytics'
import { formatRupiah, formatNumber, cn } from '@/lib/utils'

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

// Chart colors
const COLORS = {
    pink: '#ec4899',
    gray: '#6b7280',
    grayLight: '#9ca3af',
    green: '#22c55e'
}

const PIE_COLORS = ['#ec4899', '#6b7280', '#d1d5db']

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

    // Prepare chart data
    const chartData = monthlyStats.map(stat => ({
        name: getMonthName(stat.month),
        Pengunjung: stat.total_visitors,
        Pendapatan: stat.total_revenue / 1000000, // in millions
    }))

    const pieData = demographics ? [
        { name: 'Dewasa', value: demographics.total_dewasa, color: COLORS.pink },
        { name: 'Anak', value: demographics.total_anak, color: COLORS.gray },
        { name: 'WNA', value: demographics.total_wna, color: COLORS.grayLight },
    ] : []

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Analytics</h1>
                    <p className="text-gray-500 mt-1">
                        Laporan dan statistik manajemen
                        {selectedDestination && selectedDestination !== 'all' && destinations.find(d => d.id === selectedDestination) && (
                            <span className="font-bold text-pink-600"> - {destinations.find(d => d.id === selectedDestination)?.name}</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={selectedDestination || 'all'} onValueChange={setSelectedDestination}>
                        <SelectTrigger className="w-52 h-12 rounded-xl border-2 border-gray-200 font-medium">
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
                        <SelectTrigger className="w-28 h-12 rounded-xl border-2 border-gray-200 font-medium">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
                                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </header>

            {/* Month-over-Month Comparison */}
            {comparison && selectedYear === currentYear && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-gray-200 rounded-2xl bg-white p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-gray-500">Pengunjung Bulan Ini</span>
                            <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
                                <Users className="w-5 h-5 text-pink-600" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-3xl font-black text-gray-900">{formatNumber(comparison.current.visitors)}</p>
                            <Badge className={cn(
                                'font-bold border-0',
                                comparison.change.visitors >= 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            )}>
                                {comparison.change.visitors >= 0 ? (
                                    <TrendingUp className="w-3.5 h-3.5 mr-1" />
                                ) : (
                                    <TrendingDown className="w-3.5 h-3.5 mr-1" />
                                )}
                                {comparison.change.visitors >= 0 ? '+' : ''}{comparison.change.visitors}%
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                            vs bulan lalu: {formatNumber(comparison.previous.visitors)}
                        </p>
                    </div>

                    <div className="border-2 border-gray-200 rounded-2xl bg-white p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-gray-500">Pendapatan Bulan Ini</span>
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                                <Banknote className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-3xl font-black text-gray-900">{formatRupiah(comparison.current.revenue, { compact: true })}</p>
                            <Badge className={cn(
                                'font-bold border-0',
                                comparison.change.revenue >= 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            )}>
                                {comparison.change.revenue >= 0 ? (
                                    <TrendingUp className="w-3.5 h-3.5 mr-1" />
                                ) : (
                                    <TrendingDown className="w-3.5 h-3.5 mr-1" />
                                )}
                                {comparison.change.revenue >= 0 ? '+' : ''}{comparison.change.revenue}%
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                            vs bulan lalu: {formatRupiah(comparison.previous.revenue, { compact: true })}
                        </p>
                    </div>
                </div>
            )}

            {/* Monthly Trend with Chart */}
            <section className="border-2 border-gray-200 rounded-2xl bg-white overflow-hidden">
                <div className="px-6 py-5 border-b-2 border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Trend Bulanan {selectedYear}</h2>
                        <p className="text-sm text-gray-500">Pengunjung dan pendapatan per bulan</p>
                    </div>
                </div>

                {/* Bar Chart */}
                {chartData.length > 0 && (
                    <div className="px-6 pt-6">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        tickFormatter={(value: number) => formatNumber(value)}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '2px solid #e5e7eb',
                                            borderRadius: '12px',
                                            boxShadow: 'none'
                                        }}
                                        formatter={(value) => [
                                            typeof value === 'number' ? formatNumber(value) : String(value),
                                            'Pengunjung'
                                        ]}
                                    />
                                    <Bar
                                        dataKey="Pengunjung"
                                        fill={COLORS.pink}
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={40}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto mt-4">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-y border-gray-100">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-bold text-gray-500">Bulan</th>
                                <th className="text-right px-6 py-4 text-sm font-bold text-gray-500">Pengunjung</th>
                                <th className="text-right px-6 py-4 text-sm font-bold text-gray-500">Pendapatan</th>
                                <th className="text-right px-6 py-4 text-sm font-bold text-gray-500">Laporan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {monthlyStats.map((stat) => (
                                <tr key={stat.month} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900">{getMonthName(stat.month)}</td>
                                    <td className="px-6 py-4 text-right font-medium">{formatNumber(stat.total_visitors)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-green-600">{formatRupiah(stat.total_revenue, { compact: true })}</td>
                                    <td className="px-6 py-4 text-right text-gray-400">{stat.report_count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Demographics with Pie Chart */}
            <section className="border-2 border-gray-200 rounded-2xl bg-white overflow-hidden">
                <div className="px-6 py-5 border-b-2 border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
                        <Users className="w-5 h-5 text-pink-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Demografi Pengunjung</h2>
                </div>
                <div className="p-6">
                    {!demographics || totalVisitors === 0 ? (
                        <p className="text-center text-gray-400 py-8">Belum ada data</p>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                            {/* Pie Chart - Big & Beautiful */}
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={120}
                                            paddingAngle={3}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                                            ))}
                                        </Pie>
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            formatter={(value) => <span className="text-gray-600 font-medium">{value}</span>}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '2px solid #e5e7eb',
                                                borderRadius: '12px',
                                                boxShadow: 'none'
                                            }}
                                            formatter={(value) => [formatNumber(Number(value ?? 0)), 'Pengunjung']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Stats Cards */}
                            <div className="space-y-4">
                                <div className="border-2 border-pink-200 bg-pink-50 rounded-2xl p-5 flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-pink-100 flex items-center justify-center">
                                        <Users className="w-7 h-7 text-pink-600" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-pink-600">{formatNumber(demographics.total_dewasa)}</p>
                                        <p className="font-bold text-pink-500">Dewasa</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-2xl font-black text-pink-600">
                                            {((demographics.total_dewasa / totalVisitors) * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                </div>

                                <div className="border-2 border-gray-200 rounded-2xl p-5 flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
                                        <Users className="w-7 h-7 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-gray-700">{formatNumber(demographics.total_anak)}</p>
                                        <p className="font-bold text-gray-500">Anak</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-2xl font-black text-gray-600">
                                            {((demographics.total_anak / totalVisitors) * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                </div>

                                <div className="border-2 border-gray-200 rounded-2xl p-5 flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
                                        <MapPin className="w-7 h-7 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-gray-600">{formatNumber(demographics.total_wna)}</p>
                                        <p className="font-bold text-gray-400">WNA</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-2xl font-black text-gray-500">
                                            {((demographics.total_wna / totalVisitors) * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="border-t-2 border-gray-100 pt-4 text-center">
                                    <p className="text-4xl font-black text-gray-900">{formatNumber(totalVisitors)}</p>
                                    <p className="font-bold text-gray-400">Total Pengunjung</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Payment & Destinations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Method */}
                <section className="border-2 border-gray-200 rounded-2xl bg-white overflow-hidden">
                    <div className="px-6 py-5 border-b-2 border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                            <Banknote className="w-5 h-5 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Metode Pembayaran</h2>
                    </div>
                    <div className="p-6">
                        {!payment ? (
                            <p className="text-center text-gray-400 py-8">Belum ada data</p>
                        ) : (
                            <div className="space-y-5">
                                <div className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl">
                                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                                        <Wallet className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-gray-900">Cash</p>
                                            <Badge className="bg-gray-100 text-gray-600 border-0 font-bold">{payment.cash_percentage}%</Badge>
                                        </div>
                                        <p className="text-xl font-black text-gray-700 mt-1">{formatRupiah(payment.total_cash, { compact: true })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl">
                                    <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center">
                                        <CreditCard className="w-6 h-6 text-pink-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-gray-900">QRIS</p>
                                            <Badge className="bg-pink-100 text-pink-600 border-0 font-bold">{payment.qris_percentage}%</Badge>
                                        </div>
                                        <p className="text-xl font-black text-gray-700 mt-1">{formatRupiah(payment.total_qris, { compact: true })}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Top Destinations */}
                <section className="border-2 border-gray-200 rounded-2xl bg-white overflow-hidden">
                    <div className="px-6 py-5 border-b-2 border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-pink-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Destinasi Terpopuler</h2>
                    </div>
                    <div className="p-6">
                        {rankings.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">Belum ada data</p>
                        ) : (
                            <div className="space-y-4">
                                {rankings.slice(0, 5).map((dest, idx) => (
                                    <div key={dest.destination_id} className="flex items-center gap-4">
                                        <span className={cn(
                                            'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black',
                                            idx === 0 ? 'bg-pink-600 text-white' :
                                                idx === 1 ? 'bg-pink-400 text-white' :
                                                    idx === 2 ? 'bg-pink-200 text-pink-700' :
                                                        'bg-gray-100 text-gray-500'
                                        )}>
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900">{dest.destination_name}</p>
                                            <p className="text-sm text-gray-400">{formatNumber(dest.total_visitors)} pengunjung</p>
                                        </div>
                                        <span className="font-bold text-green-600">
                                            {formatRupiah(dest.total_revenue, { compact: true })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}
