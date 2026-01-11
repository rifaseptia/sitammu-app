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
    Loader2
} from 'lucide-react'
import { toast } from 'sonner'

import { TICKET_PRICES, TICKET_CONFIG } from '@/lib/constants'
import { useAuthStore } from '@/lib/stores/auth-store'
import { getTodayReport } from '@/actions/reports'
import { saveReport, submitReport } from '@/actions/report-form'
import {
    formatRupiah,
    formatDate,
    getTodayDateString,
    validateDewasaGender,
    validateWnaCountries,
    validatePayment,
    cn
} from '@/lib/utils'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { NumberStepper } from '@/components/ui/number-stepper'
import { CountrySelector } from '@/components/mobile/country-selector'
import { TicketBlockInput, createEmptyTicketBlockData, ticketBlockDataToArray, type TicketBlockData } from '@/components/mobile/ticket-block-input'

import type { DailyReport, DailyReportInput } from '@/types'

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

    // UI state
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSaving, setIsSaving] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [existingReport, setExistingReport] = React.useState<DailyReport | null>(null)
    const [showWnaSection, setShowWnaSection] = React.useState(false)

    // Calculated values
    const anakRevenue = anak * TICKET_PRICES.anak
    const dewasaRevenue = dewasa * TICKET_PRICES.dewasa
    const wnaRevenue = wna * TICKET_PRICES.wna
    const totalRevenue = anakRevenue + dewasaRevenue + wnaRevenue
    const totalVisitors = anak + dewasa + wna

    // Validations (functions return boolean)
    const isGenderValid = validateDewasaGender(dewasa, dewasaMale, dewasaFemale)
    const isAnakGenderValid = anak > 0 ? (anakMale + anakFemale === anak) : true
    const isCountryValid = wna > 0 ? validateWnaCountries(wna, wnaCountries) : true
    const isPaymentValid = validatePayment(totalRevenue, cash, qris)
    const isFormValid = isGenderValid && isAnakGenderValid && isCountryValid && isPaymentValid

    // Load existing report
    const loadReport = React.useCallback(async () => {
        if (!user?.destination_id) return

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
            if (r.wna_count > 0) setShowWnaSection(true)
        }
        setIsLoading(false)
    }, [user?.destination_id])

    // Initial load
    React.useEffect(() => {
        loadReport()
    }, [loadReport])

    // Auto-refresh when tab becomes visible (sync across devices)
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user?.destination_id) {
                loadReport()
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [loadReport, user?.destination_id])

    // Auto-sync handlers: when one gender is input, auto-fill the other
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

    // Reset gender when total changes
    React.useEffect(() => {
        if (dewasa === 0) {
            setDewasaMale(0)
            setDewasaFemale(0)
        } else if (dewasaMale + dewasaFemale !== dewasa) {
            // Adjust female to match new total
            setDewasaFemale(Math.max(0, dewasa - dewasaMale))
        }
    }, [dewasa])

    React.useEffect(() => {
        if (anak === 0) {
            setAnakMale(0)
            setAnakFemale(0)
        } else if (anakMale + anakFemale !== anak) {
            // Adjust female to match new total
            setAnakFemale(Math.max(0, anak - anakMale))
        }
    }, [anak])

    // Auto-sync payment handlers: when one is changed, auto-fill the other
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

    // Auto-adjust payment when total revenue changes
    React.useEffect(() => {
        if (totalRevenue > 0 && cash + qris !== totalRevenue) {
            // Keep QRIS, adjust Cash
            setCash(Math.max(0, totalRevenue - qris))
        }
    }, [totalRevenue])

    // Show WNA section when count > 0
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
        }

        const result = await saveReport(input, user.id)

        if (result.success) {
            toast.success('Draft berhasil disimpan')
            if (result.data) setExistingReport(result.data)
        } else {
            toast.error(result.error || 'Gagal menyimpan')
        }
        setIsSaving(false)
    }

    const handleSubmit = async () => {
        if (!user?.id || !existingReport?.id) {
            // Save first if no existing report
            await handleSave()
            return
        }

        if (!isFormValid) {
            toast.error('Form belum valid, periksa kembali')
            return
        }

        setIsSubmitting(true)

        // Save latest changes first
        await handleSave()

        // Then submit
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
            <div className="px-4 py-6">
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6 text-center">
                        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-green-800 mb-2">
                            Laporan Sudah Disubmit
                        </h2>
                        <p className="text-green-700 mb-4">
                            Laporan tanggal {formatDate(today)} sudah disubmit dan tidak bisa diedit.
                        </p>
                        <Button onClick={() => router.push('/laporan')} className="w-full">
                            Lihat Laporan
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="px-4 py-6 space-y-5">
            {/* Header */}
            <header>
                <h1 className="text-2xl font-bold text-gray-900">Input Rekap Harian</h1>
                <p className="text-base text-gray-600">{formatDate(new Date())}</p>
            </header>

            {/* Summary Card */}
            <Card className="bg-gradient-to-br from-pink-600 to-pink-700 text-white border-0">
                <CardContent className="py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-pink-100 text-sm">Total Pengunjung</p>
                            <p className="text-2xl font-bold">{totalVisitors.toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                            <p className="text-pink-100 text-sm">Total Pendapatan</p>
                            <p className="text-xl font-bold">{formatRupiah(totalRevenue, { compact: true })}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Visitor Counts Section */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="w-5 h-5 text-pink-600" />
                        Jumlah Pengunjung
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Anak */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold">Anak-anak</p>
                            <p className="text-sm text-gray-500">{formatRupiah(TICKET_PRICES.anak)}/orang</p>
                        </div>
                        <NumberStepper value={anak} onChange={setAnak} />
                    </div>

                    {/* Anak Gender breakdown */}
                    {anak > 0 && (
                        <div className="ml-4 space-y-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700">Rincian Gender Anak:</p>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Laki-laki (L)</span>
                                <NumberStepper
                                    value={anakMale}
                                    onChange={handleAnakMaleChange}
                                    max={anak}
                                    size="sm"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Perempuan (P)</span>
                                <NumberStepper
                                    value={anakFemale}
                                    onChange={handleAnakFemaleChange}
                                    max={anak}
                                    size="sm"
                                />
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
                        <p className="text-sm text-gray-600 text-right">
                            = {formatRupiah(anakRevenue)}
                        </p>
                    )}

                    <Separator />

                    {/* Dewasa */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold">Dewasa</p>
                            <p className="text-sm text-gray-500">{formatRupiah(TICKET_PRICES.dewasa)}/orang</p>
                        </div>
                        <NumberStepper value={dewasa} onChange={setDewasa} />
                    </div>

                    {/* Gender breakdown */}
                    {dewasa > 0 && (
                        <div className="ml-4 space-y-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700">Rincian Gender:</p>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Laki-laki (L)</span>
                                <NumberStepper
                                    value={dewasaMale}
                                    onChange={handleDewasaMaleChange}
                                    max={dewasa}
                                    size="sm"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Perempuan (P)</span>
                                <NumberStepper
                                    value={dewasaFemale}
                                    onChange={handleDewasaFemaleChange}
                                    max={dewasa}
                                    size="sm"
                                />
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
                        <p className="text-sm text-gray-600 text-right">
                            = {formatRupiah(dewasaRevenue)}
                        </p>
                    )}

                    <Separator />

                    {/* WNA */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold">WNA</p>
                            <p className="text-sm text-gray-500">{formatRupiah(TICKET_PRICES.wna)}/orang</p>
                        </div>
                        <NumberStepper value={wna} onChange={setWna} />
                    </div>

                    {/* WNA Country breakdown */}
                    {showWnaSection && wna > 0 && (
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => setShowWnaSection(!showWnaSection)}
                                className="flex items-center gap-1 text-sm text-pink-600 font-medium"
                            >
                                Rincian Negara
                                {showWnaSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <CountrySelector
                                value={wnaCountries}
                                onChange={setWnaCountries}
                                totalRequired={wna}
                            />
                        </div>
                    )}
                    {wna > 0 && (
                        <p className="text-sm text-gray-600 text-right">
                            = {formatRupiah(wnaRevenue)}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Ticket Block Section */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        📋 Blok Tiket
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                        Input nomor blok tiket untuk audit trail
                    </p>
                </CardHeader>
                <CardContent>
                    <TicketBlockInput
                        value={ticketBlocks}
                        onChange={setTicketBlocks}
                        expectedCounts={{
                            anak: anak,
                            dewasa: dewasa,
                            wna: wna,
                        }}
                    />
                </CardContent>
            </Card>

            {/* Payment Section */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-green-600" />
                        Pembayaran
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total yang harus diterima:</p>
                        <p className="text-xl font-bold text-gray-900">{formatRupiah(totalRevenue)}</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-semibold">Cash</Label>
                                <p className="text-xs text-gray-500">+/- Rp 5.000</p>
                            </div>
                            <NumberStepper
                                value={cash}
                                onChange={handleCashChange}
                                step={5000}
                                max={totalRevenue}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-semibold">QRIS</Label>
                                <p className="text-xs text-gray-500">+/- Rp 5.000</p>
                            </div>
                            <NumberStepper
                                value={qris}
                                onChange={handleQrisChange}
                                step={5000}
                                max={totalRevenue}
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <span className="font-medium">Total Diterima</span>
                        <span className={cn(
                            'font-bold',
                            isPaymentValid ? 'text-green-600' : 'text-red-600'
                        )}>
                            {formatRupiah(cash + qris)}
                        </span>
                    </div>

                    {!isPaymentValid && totalRevenue > 0 && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Cash + QRIS ({formatRupiah(cash + qris)}) ≠ Total ({formatRupiah(totalRevenue)})
                        </p>
                    )}
                    {isPaymentValid && totalRevenue > 0 && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Pembayaran sesuai ✓
                        </p>
                    )}

                    {/* Quick fill button */}
                    {!isPaymentValid && totalRevenue > 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setCash(totalRevenue)
                                setQris(0)
                            }}
                            className="w-full"
                        >
                            Isi semua dengan Cash
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-gray-600" />
                        Catatan (Opsional)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Contoh: Hari libur nasional, pengunjung ramai..."
                        className="w-full h-24 p-3 border rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                        maxLength={500}
                    />
                    <p className="text-xs text-gray-500 text-right mt-1">
                        {notes.length}/500
                    </p>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2 pb-4">
                <Button
                    onClick={handleSave}
                    variant="outline"
                    size="lg"
                    disabled={isSaving || isSubmitting}
                    className="w-full"
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
                        size="lg"
                        disabled={!isFormValid || isSaving || isSubmitting || totalVisitors === 0}
                        className="w-full bg-green-600 hover:bg-green-700"
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
                    <p className="text-center text-sm text-gray-500">
                        💡 Hanya Koordinator yang dapat submit laporan
                    </p>
                )}
            </div>
        </div>
    )
}
