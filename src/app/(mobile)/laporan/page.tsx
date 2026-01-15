'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    FileText,
    Share2,
    Copy,
    CheckCircle2,
    Users,
    Banknote,
    Ticket,
    CreditCard,
    MessageSquare,
    MapPin,
    Calendar,
    PenSquare,
    Loader2
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuthStore } from '@/lib/stores/auth-store'
import { getTodayReport, getReportByDate } from '@/actions/reports'
import { getAttractionReports } from '@/actions/attraction-reports'
import { formatDate, formatRupiah, formatTime, cn, getTodayDateString } from '@/lib/utils'
import { POPULAR_COUNTRIES } from '@/lib/constants'
import { generateWhatsAppMessage, shareToWhatsApp, copyToClipboard } from '@/lib/whatsapp'
import { getAttractionsByDestination } from '@/actions/admin-attractions'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import type { DailyReport, Destination, AttractionReport } from '@/types'

export default function LaporanPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user } = useAuthStore()

    const dateParam = searchParams.get('date')
    const today = getTodayDateString()
    const isToday = !dateParam || dateParam === today

    const [report, setReport] = React.useState<DailyReport | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [attractionReportsForWA, setAttractionReportsForWA] = React.useState<Array<{
        attraction_name: string
        revenue: number
        visitor_count: number
        is_toilet?: boolean
        ticket_blocks?: Array<{
            block_no: string
            start_no: string
            end_no: string
            count: number
        }>
    }>>([])

    React.useEffect(() => {
        async function load() {
            if (!user?.destination_id) return

            const reportDate = dateParam || today
            const result = isToday
                ? await getTodayReport(user.destination_id)
                : await getReportByDate(user.destination_id, reportDate)

            if (result.success && result.data) {
                setReport(result.data)

                const attResult = await getAttractionReports(result.data.id)
                if (attResult.success && attResult.data && attResult.data.length > 0) {
                    const attractionsResult = await getAttractionsByDestination(user.destination_id)
                    const attractionMap = new Map(
                        attractionsResult.success && attractionsResult.data
                            ? attractionsResult.data.map(a => [a.id, a])
                            : []
                    )

                    const waReports = attResult.data.map((ar: AttractionReport) => {
                        const attraction = attractionMap.get(ar.attraction_id)
                        return {
                            attraction_name: attraction?.name || 'Unknown',
                            revenue: ar.revenue,
                            visitor_count: ar.visitor_count,
                            is_toilet: attraction?.name.toLowerCase().includes('toilet'),
                            ticket_blocks: ar.ticket_blocks as Array<{
                                block_no: string
                                start_no: string
                                end_no: string
                                count: number
                            }> || []
                        }
                    })
                    setAttractionReportsForWA(waReports)
                }
            } else {
                setReport(null)
            }
            setIsLoading(false)
        }
        load()
    }, [user?.destination_id, dateParam, isToday, today])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
            </div>
        )
    }

    if (!report) {
        return (
            <div className="px-5 py-6">
                <div className="border-2 border-gray-200 rounded-2xl p-8 text-center bg-white">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-700 mb-2">
                        Belum Ada Laporan
                    </h2>
                    <p className="text-gray-500 mb-6">
                        Laporan hari ini belum dibuat
                    </p>
                    <Button onClick={() => router.push('/input')} className="w-full h-14 text-lg font-bold rounded-xl bg-pink-600 hover:bg-pink-700">
                        Buat Laporan
                    </Button>
                </div>
            </div>
        )
    }

    const getCountryName = (code: string) => {
        return POPULAR_COUNTRIES.find(c => c.code === code)?.name || code
    }

    return (
        <div className="px-5 py-6 space-y-6">
            {/* Header */}
            <header className="space-y-1">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-black text-gray-900">Laporan Harian</h1>
                    <Badge className={cn(
                        "font-bold border-0",
                        report.status === 'submitted'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                    )}>
                        {report.status === 'submitted' ? 'Submitted' : 'Draft'}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-5 h-5 text-pink-600" />
                    <span className="text-lg font-bold">{user?.destination?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span className="text-base">{formatDate(report.report_date)}</span>
                </div>
            </header>

            {/* Summary Card */}
            <section className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white">
                <div className="bg-pink-600 px-5 py-5">
                    <div className="grid grid-cols-2 gap-6 text-white">
                        <div>
                            <div className="flex items-center gap-2 text-pink-200 mb-1">
                                <Users className="w-4 h-4" />
                                <span className="text-sm">Total Pengunjung</span>
                            </div>
                            <p className="text-3xl font-black">{report.total_visitors.toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-pink-200 mb-1">
                                <Banknote className="w-4 h-4" />
                                <span className="text-sm">Total Pendapatan</span>
                            </div>
                            <p className="text-2xl font-bold">{formatRupiah(report.total_revenue)}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Visitor Breakdown */}
            <section className="border-2 border-gray-200 rounded-2xl bg-white overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                    <Ticket className="w-5 h-5 text-pink-600" />
                    <h2 className="text-lg font-bold text-gray-900">Rincian Pengunjung</h2>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">Anak-anak</span>
                        <div className="text-right">
                            <span className="font-bold text-lg">{report.anak_count}</span>
                            <span className="text-gray-500 text-sm ml-2">({formatRupiah(report.anak_revenue)})</span>
                        </div>
                    </div>
                    {report.anak_count > 0 && (
                        <div className="ml-4 text-sm text-gray-600 border-l-2 border-gray-200 pl-3">
                            L: {report.anak_male || 0} | P: {report.anak_female || 0}
                        </div>
                    )}

                    <div className="border-t border-gray-100" />

                    <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">Dewasa</span>
                        <div className="text-right">
                            <span className="font-bold text-lg">{report.dewasa_count}</span>
                            <span className="text-gray-500 text-sm ml-2">({formatRupiah(report.dewasa_revenue)})</span>
                        </div>
                    </div>
                    {report.dewasa_count > 0 && (
                        <div className="ml-4 text-sm text-gray-600 border-l-2 border-gray-200 pl-3">
                            L: {report.dewasa_male} | P: {report.dewasa_female}
                        </div>
                    )}

                    <div className="border-t border-gray-100" />

                    <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">WNA</span>
                        <div className="text-right">
                            <span className="font-bold text-lg">{report.wna_count}</span>
                            <span className="text-gray-500 text-sm ml-2">({formatRupiah(report.wna_revenue)})</span>
                        </div>
                    </div>
                    {Object.keys(report.wna_countries || {}).length > 0 && (
                        <div className="ml-4 text-sm text-gray-600 border-l-2 border-gray-200 pl-3 flex flex-wrap gap-2">
                            {Object.entries(report.wna_countries as Record<string, number>).map(([code, count]) => (
                                <span key={code} className="bg-gray-100 px-2 py-1 rounded-lg">
                                    {getCountryName(code)}: {count}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Ticket Block Details */}
            {((report as any).ticket_blocks?.length > 0 || attractionReportsForWA.length > 0) && (
                <section className="border-2 border-gray-200 rounded-2xl bg-white overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                        <Ticket className="w-5 h-5 text-pink-600" />
                        <h2 className="text-lg font-bold text-gray-900">Rincian Tiket</h2>
                    </div>
                    <div className="p-5 space-y-5">
                        {(() => {
                            const ticketBlocks = (report as any).ticket_blocks as Array<{
                                category: string
                                block_no: string
                                start_no: string
                                end_no: string
                                count: number
                            }> || []

                            const anakBlocks = ticketBlocks.filter(b => b.category === 'anak')
                            const dewasaBlocks = ticketBlocks.filter(b => b.category === 'dewasa')
                            const wnaBlocks = ticketBlocks.filter(b => b.category === 'wna')

                            return (
                                <>
                                    {anakBlocks.length > 0 && (
                                        <div>
                                            <p className="font-bold text-gray-700 mb-2">Tiket Anak</p>
                                            <div className="space-y-1 ml-4 border-l-2 border-gray-200 pl-3">
                                                {anakBlocks.map((b, i) => (
                                                    <p key={i} className="text-sm text-gray-600">
                                                        Blok {b.block_no}: {b.start_no} - {b.end_no} <span className="text-gray-400">({b.count} tiket)</span>
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {dewasaBlocks.length > 0 && (
                                        <div>
                                            <p className="font-bold text-gray-700 mb-2">Tiket Dewasa</p>
                                            <div className="space-y-1 ml-4 border-l-2 border-gray-200 pl-3">
                                                {dewasaBlocks.map((b, i) => (
                                                    <p key={i} className="text-sm text-gray-600">
                                                        Blok {b.block_no}: {b.start_no} - {b.end_no} <span className="text-gray-400">({b.count} tiket)</span>
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {wnaBlocks.length > 0 && (
                                        <div>
                                            <p className="font-bold text-gray-700 mb-2">Tiket WNA</p>
                                            <div className="space-y-1 ml-4 border-l-2 border-gray-200 pl-3">
                                                {wnaBlocks.map((b, i) => (
                                                    <p key={i} className="text-sm text-gray-600">
                                                        Blok {b.block_no}: {b.start_no} - {b.end_no} <span className="text-gray-400">({b.count} tiket)</span>
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )
                        })()}

                        {attractionReportsForWA.map((att, idx) => (
                            <div key={idx}>
                                <p className="font-bold text-gray-700 mb-2">{att.attraction_name}</p>
                                {att.ticket_blocks && att.ticket_blocks.length > 0 ? (
                                    <div className="space-y-1 ml-4 border-l-2 border-gray-200 pl-3">
                                        {att.ticket_blocks.map((b, i) => (
                                            <p key={i} className="text-sm text-gray-600">
                                                Blok {b.block_no}: {b.start_no} - {b.end_no} <span className="text-gray-400">({b.count} tiket)</span>
                                            </p>
                                        ))}
                                    </div>
                                ) : att.visitor_count > 0 ? (
                                    <p className="text-sm text-gray-600 ml-4 border-l-2 border-gray-200 pl-3">{att.visitor_count} pengunjung</p>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Payment Breakdown */}
            <section className="border-2 border-gray-200 rounded-2xl bg-white overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                    <CreditCard className="w-5 h-5 text-pink-600" />
                    <h2 className="text-lg font-bold text-gray-900">Pembayaran</h2>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">Cash</span>
                        <span className="font-bold text-lg">{formatRupiah(report.cash_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">QRIS</span>
                        <span className="font-bold text-lg">{formatRupiah(report.qris_amount)}</span>
                    </div>
                    <div className="border-t-2 border-gray-200 pt-4">
                        <div className="flex justify-between items-center">
                            <span className="font-black text-gray-900">Total</span>
                            <span className="font-black text-xl text-green-600">{formatRupiah(report.total_revenue)}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Notes */}
            {report.notes && (
                <section className="border-2 border-gray-200 rounded-2xl bg-white overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                        <MessageSquare className="w-5 h-5 text-gray-500" />
                        <h2 className="text-lg font-bold text-gray-900">Catatan</h2>
                    </div>
                    <div className="p-5">
                        <p className="text-gray-700">{report.notes}</p>
                    </div>
                </section>
            )}

            {/* Submission Info */}
            {report.status === 'submitted' && report.submitted_at && (
                <div className="border-2 border-green-200 bg-green-50 rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-bold">
                            Disubmit pada {formatDate(report.submitted_at)} {formatTime(report.submitted_at)}
                        </span>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="space-y-4 pt-2 pb-6">
                {report.status === 'draft' && (
                    <Button onClick={() => router.push('/input')} className="w-full h-14 text-lg font-bold rounded-xl bg-pink-600 hover:bg-pink-700">
                        <PenSquare className="w-5 h-5 mr-2" />
                        Edit Laporan
                    </Button>
                )}

                {report.status === 'submitted' && user?.destination && (
                    <>
                        <Button
                            variant="outline"
                            className="w-full h-14 text-lg font-bold rounded-xl border-2"
                            onClick={() => {
                                const message = generateWhatsAppMessage(report, user.destination as Destination, attractionReportsForWA)
                                shareToWhatsApp(message)
                                toast.success('Membuka WhatsApp...')
                            }}
                        >
                            <Share2 className="w-5 h-5 mr-2" />
                            Share ke WhatsApp
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-14 text-lg font-bold rounded-xl border-2"
                            onClick={async () => {
                                const message = generateWhatsAppMessage(report, user.destination as Destination, attractionReportsForWA)
                                const success = await copyToClipboard(message)
                                if (success) {
                                    toast.success('Pesan berhasil disalin!')
                                } else {
                                    toast.error('Gagal menyalin pesan')
                                }
                            }}
                        >
                            <Copy className="w-5 h-5 mr-2" />
                            Salin Pesan
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}
