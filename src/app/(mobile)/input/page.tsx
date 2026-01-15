'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
    Save,
    Send,
    ChevronDown,
    ChevronUp,
    Users,
    Banknote,
    MessageSquare,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Ticket,
    Sparkles,
    MapPin
} from 'lucide-react'
import { toast } from 'sonner'

import { TICKET_PRICES, TICKET_CONFIG } from '@/lib/constants'
import { useAuthStore } from '@/lib/stores/auth-store'
import { getTodayReport } from '@/actions/reports'
import { saveReport, submitReport } from '@/actions/report-form'
import { getAttractionsByDestination } from '@/actions/admin-attractions'
import { getAttractionReports, saveAllAttractionReports } from '@/actions/attraction-reports'
import {
    formatRupiah,
    formatDate,
    getTodayDateString,
    validateDewasaGender,
    validateWnaCountries,
    validatePayment,
    cn
} from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { NumberStepper } from '@/components/ui/number-stepper'
import { CountrySelector } from '@/components/mobile/country-selector'
import { TicketBlockInput, createEmptyTicketBlockData, ticketBlockDataToArray, arrayToTicketBlockData, type TicketBlockData } from '@/components/mobile/ticket-block-input'
import { AttractionInput, createEmptyAttractionData, attractionDataToDbFormat, dbToAttractionData, type AttractionInputData } from '@/components/mobile/attraction-input'

import type { DailyReport, DailyReportInput, Attraction } from '@/types'

export default function InputPage() {
    const router = useRouter()
    const { user } = useAuthStore()
    const isKoordinator = user?.role === 'koordinator'

    const today = getTodayDateString()

    // Form state
    const [anak, setAnak] = React.useState(0)
    const [dewasa, setDewasa] = React.useState(0)
    const [dewasaMale, setDewasaMale] = React.useState(0)
    const [dewasaFemale, setDewasaFemale] = React.useState(0)
    const [anakMale, setAnakMale] = React.useState(0)
    const [anakFemale, setAnakFemale] = React.useState(0)
    const [wna, setWna] = React.useState(0)
    const [wnaCountries, setWnaCountries] = React.useState<Record<string, number>>({})
    const [cash, setCash] = React.useState(0)
    const [qris, setQris] = React.useState(0)
    const [notes, setNotes] = React.useState('')
    const [ticketBlocks, setTicketBlocks] = React.useState<TicketBlockData>(createEmptyTicketBlockData())

    // Attractions state
    const [attractions, setAttractions] = React.useState<Attraction[]>([])
    const [attractionData, setAttractionData] = React.useState<Record<string, AttractionInputData>>({})

    // UI state
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSaving, setIsSaving] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [existingReport, setExistingReport] = React.useState<DailyReport | null>(null)
    const [showWnaSection, setShowWnaSection] = React.useState(false)

    // Calculated values
    const attractionRevenue = attractions.reduce((sum, att) => {
        const data = attractionData[att.id]
        return sum + (data ? data.visitor_count * att.price : 0)
    }, 0)

    const anakRevenue = anak * TICKET_PRICES.anak
    const dewasaRevenue = dewasa * TICKET_PRICES.dewasa
    const wnaRevenue = wna * TICKET_PRICES.wna
    const totalRevenue = anakRevenue + dewasaRevenue + wnaRevenue + attractionRevenue
    const totalVisitors = anak + dewasa + wna

    // Validations
    const isGenderValid = validateDewasaGender(dewasa, dewasaMale, dewasaFemale)
    const isAnakGenderValid = anak > 0 ? (anakMale + anakFemale === anak) : true
    const isCountryValid = wna > 0 ? validateWnaCountries(wna, wnaCountries) : true
    const isPaymentValid = validatePayment(totalRevenue, cash, qris)
    const isFormValid = isGenderValid && isAnakGenderValid && isCountryValid && isPaymentValid

    // Load existing report and attractions
    const loadReport = React.useCallback(async () => {
        if (!user?.destination_id) {
            setIsLoading(false)
            return
        }

        const attResult = await getAttractionsByDestination(user.destination_id)
        if (attResult.success && attResult.data) {
            setAttractions(attResult.data)
            const initialData: Record<string, AttractionInputData> = {}
            attResult.data.forEach(att => {
                initialData[att.id] = createEmptyAttractionData(att.id)
            })
            setAttractionData(initialData)
        }

        const result = await getTodayReport(user.destination_id)

        if (result.success && result.data) {
            const r = result.data
            setExistingReport(r)
            setAnak(r.anak_count)
            setDewasa(r.dewasa_count)
            setDewasaMale(r.dewasa_male)
            setDewasaFemale(r.dewasa_female)
            setAnakMale(r.anak_male || 0)
            setAnakFemale(r.anak_female || 0)
            setWna(r.wna_count)
            setWnaCountries(r.wna_countries || {})
            setCash(r.cash_amount)
            setQris(r.qris_amount)
            setNotes(r.notes || '')

            if (r.ticket_blocks && Array.isArray(r.ticket_blocks)) {
                setTicketBlocks(arrayToTicketBlockData(r.ticket_blocks))
            }

            if (r.wna_count > 0) setShowWnaSection(true)

            const attReportResult = await getAttractionReports(r.id)
            if (attReportResult.success && attReportResult.data) {
                const loadedData: Record<string, AttractionInputData> = {}
                attReportResult.data.forEach(ar => {
                    loadedData[ar.attraction_id] = dbToAttractionData(ar)
                })
                setAttractionData(prev => ({ ...prev, ...loadedData }))
            }
        }
        setIsLoading(false)
    }, [user?.destination_id])

    React.useEffect(() => {
        loadReport()
    }, [loadReport])

    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user?.destination_id && !isSaving && !isSubmitting) {
                loadReport()
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [loadReport, user?.destination_id, isSaving, isSubmitting])

    // Auto-sync handlers
    const handleDewasaMaleChange = (val: number) => {
        const capped = Math.min(val, dewasa)
        setDewasaMale(capped)
        setDewasaFemale(dewasa - capped)
    }

    const handleDewasaFemaleChange = (val: number) => {
        const capped = Math.min(val, dewasa)
        setDewasaFemale(capped)
        setDewasaMale(dewasa - capped)
    }

    const handleAnakMaleChange = (val: number) => {
        const capped = Math.min(val, anak)
        setAnakMale(capped)
        setAnakFemale(anak - capped)
    }

    const handleAnakFemaleChange = (val: number) => {
        const capped = Math.min(val, anak)
        setAnakFemale(capped)
        setAnakMale(anak - capped)
    }

    React.useEffect(() => {
        if (dewasa === 0) {
            setDewasaMale(0)
            setDewasaFemale(0)
        } else if (dewasaMale + dewasaFemale !== dewasa) {
            setDewasaFemale(Math.max(0, dewasa - dewasaMale))
        }
    }, [dewasa])

    React.useEffect(() => {
        if (anak === 0) {
            setAnakMale(0)
            setAnakFemale(0)
        } else if (anakMale + anakFemale !== anak) {
            setAnakFemale(Math.max(0, anak - anakMale))
        }
    }, [anak])

    const handleCashChange = (val: number) => {
        const capped = Math.min(val, totalRevenue)
        setCash(capped)
        setQris(totalRevenue - capped)
    }

    const handleQrisChange = (val: number) => {
        const capped = Math.min(val, totalRevenue)
        setQris(capped)
        setCash(totalRevenue - capped)
    }

    React.useEffect(() => {
        if (totalRevenue === 0) {
            // Reset payment when no visitors
            setCash(0)
            setQris(0)
        } else if (cash + qris !== totalRevenue) {
            // Adjust cash to match new total, keeping qris as is
            setCash(Math.max(0, totalRevenue - qris))
        }
    }, [totalRevenue])

    React.useEffect(() => {
        if (wna > 0) setShowWnaSection(true)
    }, [wna])

    const handleSave = async () => {
        if (!user?.destination_id || !user?.id) return

        setIsSaving(true)
        const input: DailyReportInput = {
            destination_id: user.destination_id,
            report_date: today,
            anak_count: anak,
            dewasa_count: dewasa,
            dewasa_male: dewasaMale,
            dewasa_female: dewasaFemale,
            anak_male: anakMale,
            anak_female: anakFemale,
            wna_count: wna,
            wna_countries: wnaCountries,
            cash_amount: cash,
            qris_amount: qris,
            notes: notes || undefined,
            ticket_blocks: ticketBlockDataToArray(ticketBlocks),
            attraction_revenue: attractionRevenue,
        }

        const result = await saveReport(input, user.id)

        if (result.success) {
            if (result.data) {
                setExistingReport(result.data)

                if (attractions.length > 0) {
                    const attData = attractions.map(att =>
                        attractionDataToDbFormat(
                            attractionData[att.id] || createEmptyAttractionData(att.id),
                            att.price
                        )
                    ).filter(d => d.visitor_count > 0)

                    if (attData.length > 0) {
                        await saveAllAttractionReports(result.data.id, attData, user.id)
                    }
                }
            }
            toast.success('Draft berhasil disimpan')
        } else {
            toast.error(result.error || 'Gagal menyimpan')
        }
        setIsSaving(false)
    }

    const handleSubmit = async () => {
        if (!user?.id || !existingReport?.id) {
            await handleSave()
            return
        }

        if (!isFormValid) {
            toast.error('Form belum valid, periksa kembali')
            return
        }

        setIsSubmitting(true)
        await handleSave()
        const result = await submitReport(existingReport.id, user.id)

        if (result.success) {
            toast.success('Laporan berhasil disubmit!')
            router.push('/laporan')
        } else {
            toast.error(result.error || 'Gagal submit')
        }
        setIsSubmitting(false)
    }

    const isSubmitted = existingReport?.status === 'submitted'

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
            </div>
        )
    }

    if (isSubmitted) {
        return (
            <div className="px-5 py-6">
                <div className="border-2 border-green-200 bg-green-50 rounded-2xl p-6 text-center">
                    <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-green-800 mb-2">
                        Laporan Sudah Disubmit
                    </h2>
                    <p className="text-green-700 mb-6">
                        Laporan tanggal {formatDate(today)} sudah disubmit dan tidak bisa diedit.
                    </p>
                    <Button onClick={() => router.push('/laporan')} className="w-full h-14 text-lg font-bold rounded-xl bg-green-600 hover:bg-green-700">
                        Lihat Laporan
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="px-5 py-6 space-y-6">
            {/* Header */}
            <header className="space-y-1">
                <h1 className="text-2xl font-black text-gray-900">Input Rekap Harian</h1>
                <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-5 h-5 text-pink-600" />
                    <span className="text-lg font-bold">{user?.destination?.name}</span>
                </div>
                <p className="text-base text-gray-500">{formatDate(new Date())}</p>
            </header>

            {/* Summary Card */}
            <section className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white">
                <div className="bg-pink-600 px-5 py-4">
                    <div className="grid grid-cols-2 gap-4 text-white">
                        <div>
                            <p className="text-pink-200 text-sm">Total Pengunjung</p>
                            <p className="text-3xl font-black">{totalVisitors.toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                            <p className="text-pink-200 text-sm">Total Pendapatan</p>
                            <p className="text-2xl font-bold">{formatRupiah(totalRevenue, { compact: true })}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Visitor Counts Section */}
            <section className="border-2 border-gray-200 rounded-2xl bg-white overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                    <Users className="w-5 h-5 text-pink-600" />
                    <h2 className="text-lg font-bold text-gray-900">Jumlah Pengunjung</h2>
                </div>
                <div className="p-5 space-y-5">
                    {/* Anak */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-gray-900 text-lg">Anak-anak</p>
                            <p className="text-base text-gray-500">{formatRupiah(TICKET_PRICES.anak)}/orang</p>
                        </div>
                        <NumberStepper value={anak} onChange={setAnak} />
                    </div>

                    {anak > 0 && (
                        <div className="ml-4 space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-sm font-bold text-gray-700">Rincian Gender Anak:</p>
                            <div className="flex items-center justify-between">
                                <span className="text-base font-medium">Laki-laki (L)</span>
                                <NumberStepper value={anakMale} onChange={handleAnakMaleChange} max={anak} size="sm" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-base font-medium">Perempuan (P)</span>
                                <NumberStepper value={anakFemale} onChange={handleAnakFemaleChange} max={anak} size="sm" />
                            </div>
                            {!isAnakGenderValid && (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    L ({anakMale}) + P ({anakFemale}) = {anakMale + anakFemale}, tapi total {anak}
                                </p>
                            )}
                            {isAnakGenderValid && anak > 0 && (
                                <p className="text-sm text-green-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Total sesuai ✓
                                </p>
                            )}
                        </div>
                    )}
                    {anak > 0 && (
                        <p className="text-base text-gray-600 text-right font-medium">= {formatRupiah(anakRevenue)}</p>
                    )}

                    <div className="border-t border-gray-200" />

                    {/* Dewasa */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-gray-900 text-lg">Dewasa</p>
                            <p className="text-base text-gray-500">{formatRupiah(TICKET_PRICES.dewasa)}/orang</p>
                        </div>
                        <NumberStepper value={dewasa} onChange={setDewasa} />
                    </div>

                    {dewasa > 0 && (
                        <div className="ml-4 space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-sm font-bold text-gray-700">Rincian Gender:</p>
                            <div className="flex items-center justify-between">
                                <span className="text-base font-medium">Laki-laki (L)</span>
                                <NumberStepper value={dewasaMale} onChange={handleDewasaMaleChange} max={dewasa} size="sm" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-base font-medium">Perempuan (P)</span>
                                <NumberStepper value={dewasaFemale} onChange={handleDewasaFemaleChange} max={dewasa} size="sm" />
                            </div>
                            {!isGenderValid && (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    L ({dewasaMale}) + P ({dewasaFemale}) = {dewasaMale + dewasaFemale}, tapi total {dewasa}
                                </p>
                            )}
                            {isGenderValid && dewasa > 0 && (
                                <p className="text-sm text-green-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Total sesuai ✓
                                </p>
                            )}
                        </div>
                    )}
                    {dewasa > 0 && (
                        <p className="text-base text-gray-600 text-right font-medium">= {formatRupiah(dewasaRevenue)}</p>
                    )}

                    <div className="border-t border-gray-200" />

                    {/* WNA */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-gray-900 text-lg">WNA</p>
                            <p className="text-base text-gray-500">{formatRupiah(TICKET_PRICES.wna)}/orang</p>
                        </div>
                        <NumberStepper value={wna} onChange={setWna} />
                    </div>

                    {showWnaSection && wna > 0 && (
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => setShowWnaSection(!showWnaSection)}
                                className="flex items-center gap-1 text-base text-pink-600 font-bold"
                            >
                                Rincian Negara
                                {showWnaSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                            <CountrySelector
                                value={wnaCountries}
                                onChange={setWnaCountries}
                                totalRequired={wna}
                            />
                        </div>
                    )}
                    {wna > 0 && (
                        <p className="text-base text-gray-600 text-right font-medium">= {formatRupiah(wnaRevenue)}</p>
                    )}
                </div>
            </section>

            {/* Ticket Block Section */}
            <section className="border-2 border-gray-200 rounded-2xl bg-white overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                    <Ticket className="w-5 h-5 text-pink-600" />
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Blok Tiket</h2>
                        <p className="text-sm text-gray-500">Input nomor blok tiket untuk audit trail</p>
                    </div>
                </div>
                <div className="p-5">
                    <TicketBlockInput
                        value={ticketBlocks}
                        onChange={setTicketBlocks}
                        expectedCounts={{
                            anak: anak,
                            dewasa: dewasa,
                            wna: wna,
                        }}
                    />
                </div>
            </section>

            {/* Attractions Section */}
            {attractions.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-pink-600" />
                        <h2 className="text-lg font-bold text-gray-900">Atraksi</h2>
                    </div>
                    {attractions.map(att => (
                        <AttractionInput
                            key={att.id}
                            attraction={att}
                            data={attractionData[att.id] || createEmptyAttractionData(att.id)}
                            onChange={(newData) => {
                                setAttractionData(prev => ({
                                    ...prev,
                                    [att.id]: newData
                                }))
                            }}
                            disabled={isSubmitted}
                        />
                    ))}
                </section>
            )}

            {/* Payment Section */}
            <section className="border-2 border-gray-200 rounded-2xl bg-white overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                    <Banknote className="w-5 h-5 text-green-600" />
                    <h2 className="text-lg font-bold text-gray-900">Pembayaran</h2>
                </div>
                <div className="p-5 space-y-5">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-sm text-gray-600">Total yang harus diterima:</p>
                        <p className="text-2xl font-black text-gray-900">{formatRupiah(totalRevenue)}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-base font-bold">Cash</Label>
                                <p className="text-sm text-gray-500">+/- Rp 5.000</p>
                            </div>
                            <NumberStepper value={cash} onChange={handleCashChange} step={5000} max={totalRevenue} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-base font-bold">QRIS</Label>
                                <p className="text-sm text-gray-500">+/- Rp 5.000</p>
                            </div>
                            <NumberStepper value={qris} onChange={handleQrisChange} step={5000} max={totalRevenue} />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between">
                            <span className="text-base font-bold">Total Diterima</span>
                            <span className={cn('text-xl font-black', isPaymentValid ? 'text-green-600' : 'text-red-600')}>
                                {formatRupiah(cash + qris)}
                            </span>
                        </div>

                        {!isPaymentValid && totalRevenue > 0 && (
                            <p className="text-sm text-red-600 flex items-center gap-1 mt-2">
                                <AlertCircle className="w-4 h-4" />
                                Cash + QRIS ({formatRupiah(cash + qris)}) ≠ Total ({formatRupiah(totalRevenue)})
                            </p>
                        )}
                        {isPaymentValid && totalRevenue > 0 && (
                            <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Pembayaran sesuai ✓
                            </p>
                        )}

                        {!isPaymentValid && totalRevenue > 0 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => { setCash(totalRevenue); setQris(0) }}
                                className="w-full mt-4 h-12 text-base font-bold rounded-xl"
                            >
                                Isi semua dengan Cash
                            </Button>
                        )}
                    </div>
                </div>
            </section>

            {/* Notes Section */}
            <section className="border-2 border-gray-200 rounded-2xl bg-white overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-bold text-gray-900">Catatan (Opsional)</h2>
                </div>
                <div className="p-5">
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Contoh: Hari libur nasional, pengunjung ramai..."
                        className="w-full h-28 p-4 border-2 border-gray-200 rounded-xl resize-none text-base focus:outline-none focus:border-pink-400"
                        maxLength={500}
                    />
                    <p className="text-sm text-gray-500 text-right mt-2">{notes.length}/500</p>
                </div>
            </section>

            {/* Action Buttons */}
            <div className="space-y-4 pt-2 pb-6">
                <Button
                    onClick={handleSave}
                    variant="outline"
                    disabled={isSaving || isSubmitting}
                    className="w-full h-14 text-lg font-bold rounded-xl border-2"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5 mr-2" />
                            Simpan Draft
                        </>
                    )}
                </Button>

                {isKoordinator && (
                    <Button
                        onClick={handleSubmit}
                        disabled={!isFormValid || isSaving || isSubmitting || totalVisitors === 0}
                        className="w-full h-14 text-lg font-bold rounded-xl bg-green-600 hover:bg-green-700"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Mensubmit...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5 mr-2" />
                                Submit Laporan
                            </>
                        )}
                    </Button>
                )}

                {!isKoordinator && (
                    <p className="text-center text-base text-gray-500">
                        Hanya Koordinator yang dapat submit laporan
                    </p>
                )}
            </div>
        </div>
    )
}
