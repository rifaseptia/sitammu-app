'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FileText, Share2, Download, Copy, CheckCircle2, Users, Banknote } from 'lucide-react'
import { toast } from 'sonner'

import { useAuthStore } from '@/lib/stores/auth-store'
import { getTodayReport, getReportByDate } from '@/actions/reports'
import { getAttractionReports } from '@/actions/attraction-reports'
import { formatDate, formatRupiah, formatTime, cn, getTodayDateString } from '@/lib/utils'
import { POPULAR_COUNTRIES } from '@/lib/constants'
import { generateWhatsAppMessage, shareToWhatsApp, copyToClipboard } from '@/lib/whatsapp'
import { getAttractionsByDestination } from '@/actions/admin-attractions'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

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

                // Fetch attraction reports for WhatsApp breakdown
                const attResult = await getAttractionReports(result.data.id)
                if (attResult.success && attResult.data && attResult.data.length > 0) {
                    // Get attraction names
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
                <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!report) {
        return (
            <div className="px-4 py-6">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-gray-700 mb-2">
                            Belum Ada Laporan
                        </h2>
                        <p className="text-gray-500 mb-4">
                            Laporan hari ini belum dibuat
                        </p>
                        <Button onClick={() => router.push('/input')} className="w-full">
                            Buat Laporan
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const getCountryName = (code: string) => {
        return POPULAR_COUNTRIES.find(c => c.code === code)?.name || code
    }

    return (
        <div className="px-4 py-6 space-y-4">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Laporan Harian</h1>
                    <p className="text-sm text-gray-600">{formatDate(report.report_date)}</p>
                </div>
                <Badge className={cn(
                    report.status === 'submitted'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                )}>
                    {report.status === 'submitted' ? 'Submitted' : 'Draft'}
                </Badge>
            </header>

            {/* Summary Card */}
            <Card className="bg-gradient-to-br from-pink-600 to-pink-700 text-white border-0">
                <CardContent className="py-5">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-pink-100 mb-1">
                                <Users className="w-4 h-4" />
                                <span className="text-sm">Total Pengunjung</span>
                            </div>
                            <p className="text-3xl font-bold">{report.total_visitors.toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-pink-100 mb-1">
                                <Banknote className="w-4 h-4" />
                                <span className="text-sm">Total Pendapatan</span>
                            </div>
                            <p className="text-2xl font-bold">{formatRupiah(report.total_revenue)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Visitor Breakdown */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">🎫 Rincian Pengunjung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between">
                        <span><strong>Anak-anak</strong></span>
                        <div className="text-right">
                            <span className="font-semibold">{report.anak_count}</span>
                            <span className="text-gray-500 text-sm ml-2">({formatRupiah(report.anak_revenue)})</span>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <span><strong>Dewasa</strong></span>
                        <div className="text-right">
                            <span className="font-semibold">{report.dewasa_count}</span>
                            <span className="text-gray-500 text-sm ml-2">({formatRupiah(report.dewasa_revenue)})</span>
                        </div>
                    </div>
                    <div className="ml-4 text-sm text-gray-600">
                        L: {report.dewasa_male} | P: {report.dewasa_female}
                    </div>

                    <div className="flex justify-between">
                        <span><strong>WNA</strong></span>
                        <div className="text-right">
                            <span className="font-semibold">{report.wna_count}</span>
                            <span className="text-gray-500 text-sm ml-2">({formatRupiah(report.wna_revenue)})</span>
                        </div>
                    </div>
                    {Object.keys(report.wna_countries || {}).length > 0 && (
                        <div className="ml-4 text-sm text-gray-600 flex flex-wrap gap-2">
                            └ {Object.entries(report.wna_countries as Record<string, number>).map(([code, count]) => (
                                <span key={code}>
                                    <strong>{getCountryName(code)}</strong>: {count}
                                </span>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Ticket Block Details */}
            {((report as any).ticket_blocks?.length > 0 || attractionReportsForWA.length > 0) && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">🎟️ Rincian Tiket</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Regular Ticket Blocks */}
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
                                            <p className="font-semibold text-gray-700 mb-2">Tiket Anak</p>
                                            <div className="space-y-1 ml-3">
                                                {anakBlocks.map((b, i) => (
                                                    <p key={i} className="text-sm text-gray-600">
                                                        Blok {b.block_no}: {b.start_no} - {b.end_no} <span className="text-gray-500">({b.count} tiket)</span>
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {dewasaBlocks.length > 0 && (
                                        <div>
                                            <p className="font-semibold text-gray-700 mb-2">Tiket Dewasa</p>
                                            <div className="space-y-1 ml-3">
                                                {dewasaBlocks.map((b, i) => (
                                                    <p key={i} className="text-sm text-gray-600">
                                                        Blok {b.block_no}: {b.start_no} - {b.end_no} <span className="text-gray-500">({b.count} tiket)</span>
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {wnaBlocks.length > 0 && (
                                        <div>
                                            <p className="font-semibold text-gray-700 mb-2">Tiket WNA</p>
                                            <div className="space-y-1 ml-3">
                                                {wnaBlocks.map((b, i) => (
                                                    <p key={i} className="text-sm text-gray-600">
                                                        Blok {b.block_no}: {b.start_no} - {b.end_no} <span className="text-gray-500">({b.count} tiket)</span>
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )
                        })()}

                        {/* Attraction/Toilet Ticket Blocks */}
                        {attractionReportsForWA.map((att, idx) => (
                            <div key={idx}>
                                <p className="font-semibold text-gray-700 mb-2">{att.attraction_name}</p>
                                {att.ticket_blocks && att.ticket_blocks.length > 0 ? (
                                    <div className="space-y-1 ml-3">
                                        {att.ticket_blocks.map((b, i) => (
                                            <p key={i} className="text-sm text-gray-600">
                                                Blok {b.block_no}: {b.start_no} - {b.end_no} <span className="text-gray-500">({b.count} tiket)</span>
                                            </p>
                                        ))}
                                    </div>
                                ) : att.visitor_count > 0 ? (
                                    <p className="text-sm text-gray-600 ml-3">{att.visitor_count} pengunjung</p>
                                ) : null}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Payment Breakdown */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">💳 Pembayaran</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between">
                        <span><strong>Cash</strong></span>
                        <span className="font-semibold">{formatRupiah(report.cash_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span><strong>QRIS</strong></span>
                        <span className="font-semibold">{formatRupiah(report.qris_amount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-green-600">{formatRupiah(report.total_revenue)}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Notes */}
            {report.notes && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">📝 Catatan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700">{report.notes}</p>
                    </CardContent>
                </Card>
            )}

            {/* Submission Info */}
            {report.status === 'submitted' && report.submitted_at && (
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">
                                Disubmit pada {formatDate(report.submitted_at)} {formatTime(report.submitted_at)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-2 pb-4">
                {report.status === 'draft' && (
                    <Button onClick={() => router.push('/input')} className="w-full">
                        ✏️ Edit Laporan
                    </Button>
                )}

                {report.status === 'submitted' && user?.destination && (
                    <>
                        <Button
                            variant="outline"
                            className="w-full"
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
                            className="w-full"
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
                        <Button variant="outline" className="w-full" disabled>
                            <Download className="w-5 h-5 mr-2" />
                            Download PDF (coming soon)
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}
