'use client'

import * as React from 'react'
import { Pencil, X, Eye, History, Loader2, Search, Filter, Users, Banknote, AlertTriangle, Plus, Trash2, FileText, MapPin, Calendar } from 'lucide-react'
import { toast } from 'sonner'

import { getAllReports, getReportById, editReportWithLog, getReportEditHistory, createManualReport, deleteReport } from '@/actions/admin-reports'
import { getAllDestinations } from '@/actions/destinations'
import { getAttractionsByDestination } from '@/actions/admin-attractions'
import { saveAllAttractionReports, getAttractionReports } from '@/actions/attraction-reports'
import { useAuthStore } from '@/lib/stores/auth-store'
import { formatDate, formatRupiah, cn } from '@/lib/utils'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { NumberStepper } from '@/components/ui/number-stepper'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { TicketBlockInput, createEmptyTicketBlockData, ticketBlockDataToArray, arrayToTicketBlockData, calculateCount, type TicketBlockData } from '@/components/mobile/ticket-block-input'
import { AttractionInput, createEmptyAttractionData, attractionDataToDbFormat, dbToAttractionData, type AttractionInputData } from '@/components/mobile/attraction-input'
import { PaginationControls, usePagination } from '@/components/pagination-controls'

import type { DailyReport, Destination, ReportEditLogWithUser, Attraction } from '@/types'

interface ReportWithDestination extends DailyReport {
    destination: { id: string; code: string; name: string }
}

export default function AdminLaporanPage() {
    const { user } = useAuthStore()

    const [reports, setReports] = React.useState<ReportWithDestination[]>([])
    const [destinations, setDestinations] = React.useState<Destination[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    // Filters
    const [filterDestination, setFilterDestination] = React.useState<string>('')
    const [filterStatus, setFilterStatus] = React.useState<string>('')

    // Edit dialog
    const [editingReport, setEditingReport] = React.useState<ReportWithDestination | null>(null)
    const [editForm, setEditForm] = React.useState({
        anak_count: 0,
        dewasa_count: 0,
        dewasa_male: 0,
        dewasa_female: 0,
        anak_male: 0,
        anak_female: 0,
        wna_count: 0,
        cash_amount: 0,
        qris_amount: 0,
        notes: '',
    })
    const [editTicketBlocks, setEditTicketBlocks] = React.useState<TicketBlockData>(createEmptyTicketBlockData())
    const [editAttractions, setEditAttractions] = React.useState<Attraction[]>([])
    const [editAttractionData, setEditAttractionData] = React.useState<Record<string, AttractionInputData>>({})
    const [editReason, setEditReason] = React.useState('')
    const [isSaving, setIsSaving] = React.useState(false)

    // History dialog
    const [historyReportId, setHistoryReportId] = React.useState<string | null>(null)
    const [editHistory, setEditHistory] = React.useState<ReportEditLogWithUser[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = React.useState(false)

    // Add report dialog
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
    const [addForm, setAddForm] = React.useState({
        destination_id: '',
        report_date: '',
        anak_count: 0,
        dewasa_count: 0,
        dewasa_male: 0,
        dewasa_female: 0,
        anak_male: 0,
        anak_female: 0,
        wna_count: 0,
        cash_amount: 0,
        qris_amount: 0,
        notes: '',
    })
    const [addTicketBlocks, setAddTicketBlocks] = React.useState<TicketBlockData>(createEmptyTicketBlockData())
    const [addAttractions, setAddAttractions] = React.useState<Attraction[]>([])
    const [addAttractionData, setAddAttractionData] = React.useState<Record<string, AttractionInputData>>({})
    const [isAdding, setIsAdding] = React.useState(false)

    // Delete dialog
    const [deleteReportId, setDeleteReportId] = React.useState<string | null>(null)
    const [deleteReason, setDeleteReason] = React.useState('')
    const [isDeleting, setIsDeleting] = React.useState(false)

    // Pagination state
    const [currentPage, setCurrentPage] = React.useState(1)
    const [itemsPerPage, setItemsPerPage] = React.useState(10)

    // Calculate paginated reports
    const paginatedReports = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return reports.slice(start, start + itemsPerPage)
    }, [reports, currentPage, itemsPerPage])

    // Reset page when filter changes
    React.useEffect(() => {
        setCurrentPage(1)
    }, [filterDestination, filterStatus])

    const loadData = async () => {
        if (!user?.id) {
            setIsLoading(false)
            return
        }

        const [reportsResult, destResult] = await Promise.all([
            getAllReports(user.id, {
                destinationId: filterDestination && filterDestination !== 'all' ? filterDestination : undefined,
                status: filterStatus && filterStatus !== 'all' ? filterStatus as 'draft' | 'submitted' : undefined,
            }),
            getAllDestinations(),
        ])

        if (reportsResult.success && reportsResult.data) {
            setReports(reportsResult.data as ReportWithDestination[])
        }
        if (destResult.success && destResult.data) {
            setDestinations(destResult.data)
        }
        setIsLoading(false)
    }

    React.useEffect(() => {
        loadData()
    }, [filterDestination, filterStatus, user?.id])

    // Load attractions when destination changes in add form
    React.useEffect(() => {
        async function loadAttractions() {
            if (!addForm.destination_id) {
                setAddAttractions([])
                setAddAttractionData({})
                return
            }
            const result = await getAttractionsByDestination(addForm.destination_id)
            if (result.success && result.data) {
                setAddAttractions(result.data)
                const initialData: Record<string, AttractionInputData> = {}
                result.data.forEach(att => {
                    initialData[att.id] = createEmptyAttractionData(att.id)
                })
                setAddAttractionData(initialData)
            }
        }
        loadAttractions()
    }, [addForm.destination_id])

    const handleEdit = async (report: ReportWithDestination) => {
        setEditingReport(report)
        // Populate form
        // If report has ticket_blocks, use them. Else create empty.
        const blocks = report.ticket_blocks && Array.isArray(report.ticket_blocks)
            ? arrayToTicketBlockData(report.ticket_blocks)
            : createEmptyTicketBlockData()

        setEditTicketBlocks(blocks)

        setEditForm({
            anak_count: report.anak_count,
            dewasa_count: report.dewasa_count,
            dewasa_male: report.dewasa_male,
            dewasa_female: report.dewasa_female,
            anak_male: (report as any).anak_male || 0,
            anak_female: (report as any).anak_female || 0,
            wna_count: report.wna_count,
            cash_amount: report.cash_amount,
            qris_amount: report.qris_amount,
            notes: report.notes || '',
        })
        setEditReason('')

        // Load attractions for this destination
        const attResult = await getAttractionsByDestination(report.destination_id)
        if (attResult.success && attResult.data) {
            setEditAttractions(attResult.data)
            // Initialize empty attraction data
            const initialData: Record<string, AttractionInputData> = {}
            attResult.data.forEach(att => {
                initialData[att.id] = createEmptyAttractionData(att.id)
            })

            // Load existing attraction reports
            const attReportResult = await getAttractionReports(report.id)
            if (attReportResult.success && attReportResult.data) {
                attReportResult.data.forEach(ar => {
                    initialData[ar.attraction_id] = dbToAttractionData(ar)
                })
            } else if (!attReportResult.success) {
                console.error('Failed to load attraction reports:', attReportResult.error)
                toast.error('Gagal memuat detail atraksi: ' + attReportResult.error)
            }

            setEditAttractionData(initialData)
        } else {
            setEditAttractions([])
            setEditAttractionData({})
        }
    }

    // Auto-calculate totals in Edit Form (Gender -> Count)
    // Matches Add Report logic
    React.useEffect(() => {
        setEditForm(prev => ({
            ...prev,
            anak_count: (prev.anak_male || 0) + (prev.anak_female || 0),
            dewasa_count: (prev.dewasa_male || 0) + (prev.dewasa_female || 0)
        }))
    }, [editForm.anak_male, editForm.anak_female, editForm.dewasa_male, editForm.dewasa_female])

    const handleSaveEdit = async () => {
        if (!editingReport || !user?.id) return

        if (!editReason.trim()) {
            toast.error('Alasan perubahan wajib diisi')
            return
        }

        // Show warning but don't block if there's a mismatch
        if (isRevenueMismatch) {
            toast.warning('Perhatian: Total pembayaran tidak sesuai dengan estimasi tiket')
        }
        if (editForm.dewasa_male + editForm.dewasa_female !== editForm.dewasa_count) {
            toast.warning('Perhatian: Jumlah gender tidak sesuai dengan total dewasa')
        }

        setIsSaving(true)
        console.log('Saving edit:', { reportId: editingReport.id, editForm, userId: user.id, reason: editReason })

        // Calculate attraction revenue
        const attractionRevenue = editAttractions.reduce((sum, att) => {
            const data = editAttractionData[att.id]
            return sum + (data ? data.visitor_count * att.price : 0)
        }, 0)

        const result = await editReportWithLog(
            editingReport.id,
            {
                ...editForm,
                attraction_revenue: attractionRevenue,
                // Include ticket blocks
                ticket_blocks: ticketBlockDataToArray(editTicketBlocks)
            },
            user.id,
            editReason
        )

        console.log('Save result:', result)

        if (result.success) {
            // Save attraction reports
            if (editAttractions.length > 0) {
                const attData = editAttractions.map(att => {
                    const inputData = editAttractionData[att.id] || createEmptyAttractionData(att.id)
                    const dbFormat = attractionDataToDbFormat(inputData, att.price)
                    console.log('[Save] Attraction data for', att.name, ':', { inputData, dbFormat })
                    return dbFormat
                }).filter(d => d.visitor_count > 0 || d.ticket_blocks.length > 0)

                console.log('[Save] Final attraction data to save:', attData)

                if (attData.length > 0) {
                    const attResult = await saveAllAttractionReports(editingReport.id, attData, user!.id)
                    console.log('[Save] Attraction reports save result:', attResult)
                    if (!attResult.success) {
                        toast.error('Gagal menyimpan data atraksi: ' + attResult.error)
                    }
                } else {
                    console.log('[Save] No attraction data to save (all empty)')
                }
            }

            toast.success(result.message || 'Laporan berhasil diperbarui')
            setEditingReport(null)
            setEditAttractions([])
            setEditAttractionData({})
            await loadData()
        } else {
            toast.error(result.error || 'Gagal memperbarui')
        }
        setIsSaving(false)
    }



    const handleViewHistory = async (reportId: string) => {
        setHistoryReportId(reportId)
        setIsLoadingHistory(true)

        const result = await getReportEditHistory(reportId)
        if (result.success && result.data) {
            setEditHistory(result.data)
        }
        setIsLoadingHistory(false)
    }

    const handleAddReport = async () => {
        if (!user?.id) {
            toast.error('User tidak ditemukan')
            return
        }

        if (!addForm.destination_id || !addForm.report_date) {
            toast.error('Destinasi dan tanggal wajib dipilih')
            return
        }

        setIsAdding(true)

        console.log('Creating manual report with data:', {
            ...addForm,
            ticket_blocks: ticketBlockDataToArray(addTicketBlocks),
            created_by: user.id,
        })

        try {
            // Calculate attraction revenue
            const attractionRevenue = addAttractions.reduce((sum, att) => {
                const data = addAttractionData[att.id]
                return sum + (data ? data.visitor_count * att.price : 0)
            }, 0)

            const result = await createManualReport({
                ...addForm,
                ticket_blocks: ticketBlockDataToArray(addTicketBlocks),
                attraction_revenue: attractionRevenue,
                created_by: user.id,
            })

            console.log('createManualReport result:', result)

            if (result.success && result.data) {
                // Save attraction reports
                if (addAttractions.length > 0) {
                    const attData = addAttractions.map(att =>
                        attractionDataToDbFormat(
                            addAttractionData[att.id] || createEmptyAttractionData(att.id),
                            att.price
                        )
                    ).filter(d => d.visitor_count > 0)

                    if (attData.length > 0) {
                        await saveAllAttractionReports(result.data.id, attData, user!.id)
                    }
                }

                toast.success(result.message || 'Laporan berhasil ditambahkan')
                setIsAddDialogOpen(false)
                setAddForm({
                    destination_id: '',
                    report_date: '',
                    anak_count: 0,
                    dewasa_count: 0,
                    dewasa_male: 0,
                    dewasa_female: 0,
                    anak_male: 0,
                    anak_female: 0,
                    wna_count: 0,
                    cash_amount: 0,
                    qris_amount: 0,
                    notes: '',
                })
                setAddTicketBlocks(createEmptyTicketBlockData())
                setAddAttractions([])
                setAddAttractionData({})
                await loadData()
            } else {
                toast.error(result.error || 'Gagal menambahkan laporan')
            }
        } catch (error) {
            console.error('handleAddReport error:', error)
            toast.error('Terjadi kesalahan saat menyimpan')
        }
        setIsAdding(false)
    }

    const handleDeleteReport = async () => {
        if (!user?.id || !deleteReportId) return

        setIsDeleting(true)
        const result = await deleteReport(deleteReportId, user.id, deleteReason)

        if (result.success) {
            toast.success(result.message || 'Laporan berhasil dihapus')
            setDeleteReportId(null)
            setDeleteReason('')
            await loadData()
        } else {
            toast.error(result.error || 'Gagal menghapus laporan')
        }
        setIsDeleting(false)
    }

    // === AUTO-SYNC FOR ADD REPORT DIALOG ===

    // Derive visitor counts from gender totals (L + P = total)
    React.useEffect(() => {
        const anakTotal = addForm.anak_male + addForm.anak_female
        const dewasaTotal = addForm.dewasa_male + addForm.dewasa_female

        // Only update if different to avoid loops
        if (anakTotal !== addForm.anak_count || dewasaTotal !== addForm.dewasa_count) {
            setAddForm(f => ({
                ...f,
                anak_count: anakTotal,
                dewasa_count: dewasaTotal,
            }))
        }
    }, [addForm.anak_male, addForm.anak_female, addForm.dewasa_male, addForm.dewasa_female])

    // Calculate total revenue from counts
    const addAttractionRevenue = addAttractions.reduce((sum, att) => {
        const data = addAttractionData[att.id]
        return sum + (data ? data.visitor_count * att.price : 0)
    }, 0)

    const addTotalRevenue = (addForm.anak_count * 5000) + (addForm.dewasa_count * 15000) + (addForm.wna_count * 50000) + addAttractionRevenue

    // Auto-sync payment: when revenue or QRIS changes, adjust Cash to fill the gap
    React.useEffect(() => {
        if (addTotalRevenue > 0) {
            const newCash = Math.max(0, addTotalRevenue - addForm.qris_amount)
            if (newCash !== addForm.cash_amount) {
                setAddForm(f => ({ ...f, cash_amount: newCash }))
            }
        }
    }, [addTotalRevenue, addForm.qris_amount])

    // Validation helpers - prices must match real prices!
    const TICKET_PRICES = {
        anak: 5000,
        dewasa: 15000,
        wna: 50000
    }

    const subtotalAnak = editForm.anak_count * TICKET_PRICES.anak
    const subtotalDewasa = editForm.dewasa_count * TICKET_PRICES.dewasa
    const subtotalWNA = editForm.wna_count * TICKET_PRICES.wna

    const editAttractionRevenue = editAttractions.reduce((sum, att) => {
        const data = editAttractionData[att.id]
        return sum + (data ? data.visitor_count * att.price : 0)
    }, 0)

    const expectedRevenue = subtotalAnak + subtotalDewasa + subtotalWNA + editAttractionRevenue
    const totalVisitors = editForm.anak_count + editForm.dewasa_count + editForm.wna_count

    const totalInputRevenue = editForm.cash_amount + editForm.qris_amount
    const isRevenueMismatch = totalInputRevenue !== expectedRevenue

    const handleAutoAdjustCash = () => {
        const newCash = expectedRevenue - editForm.qris_amount
        if (newCash >= 0) {
            setEditForm(f => ({ ...f, cash_amount: newCash }))
            toast.success('Nominal Cash disesuaikan dengan total tiket')
        } else {
            toast.error('Nilai QRIS melebihi total pendapatan yang seharusnya')
        }
    }

    // Auto-sync cash and gender counts to prevent mismatches
    React.useEffect(() => {
        // Sync cash amount to match expected revenue when QRIS or ticket counts change
        const calculatedCash = expectedRevenue - editForm.qris_amount
        if (calculatedCash >= 0 && calculatedCash !== editForm.cash_amount) {
            setEditForm(f => ({ ...f, cash_amount: calculatedCash }))
        }
        // Ensure gender male + female equals dewasa_count
        const totalGender = editForm.dewasa_male + editForm.dewasa_female
        if (totalGender !== editForm.dewasa_count) {
            // Adjust female count to keep total consistent
            const newFemale = Math.max(0, editForm.dewasa_count - editForm.dewasa_male)
            setEditForm(f => ({ ...f, dewasa_female: newFemale }))
        }
    }, [editForm.anak_count, editForm.dewasa_count, editForm.wna_count, editForm.qris_amount, editForm.dewasa_male, expectedRevenue])

    const getFieldLabel = (field: string): string => {
        const labels: Record<string, string> = {
            anak_count: 'Jumlah Anak',
            dewasa_count: 'Jumlah Dewasa',
            dewasa_male: 'Dewasa Laki-laki',
            dewasa_female: 'Dewasa Perempuan',
            wna_count: 'Jumlah WNA',
            cash_amount: 'Pembayaran Cash',
            qris_amount: 'Pembayaran QRIS',
            notes: 'Catatan',
        }
        return labels[field] || field
    }

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
                    <h1 className="text-3xl font-black text-gray-900">Manajemen Laporan</h1>
                    <p className="text-gray-500 mt-1">Lihat dan edit laporan dari semua destinasi</p>
                </div>
                <button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Tambah Laporan
                </button>
            </header>

            {/* Filters */}
            <section className="border-2 border-gray-200 rounded-2xl bg-white p-6">
                <div className="flex flex-wrap gap-4">
                    <div className="w-52">
                        <Label className="text-sm font-bold text-gray-500 mb-2 block">Destinasi</Label>
                        <Select value={filterDestination || 'all'} onValueChange={(v) => setFilterDestination(v === 'all' ? '' : v)}>
                            <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 font-medium">
                                <SelectValue placeholder="Semua" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Destinasi</SelectItem>
                                {destinations.map((dest) => (
                                    <SelectItem key={dest.id} value={dest.id}>
                                        {dest.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-44">
                        <Label className="text-sm font-bold text-gray-500 mb-2 block">Status</Label>
                        <Select value={filterStatus || 'all'} onValueChange={(v) => setFilterStatus(v === 'all' ? '' : v)}>
                            <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 font-medium">
                                <SelectValue placeholder="Semua" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </section>

            {/* Reports Table */}
            <section className="border-2 border-gray-200 rounded-2xl bg-white overflow-hidden">
                <div className="px-6 py-5 border-b-2 border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Daftar Laporan</h2>
                        <p className="text-sm text-gray-500">{reports.length} laporan ditemukan</p>
                    </div>
                </div>

                {reports.length === 0 ? (
                    <p className="text-center py-12 text-gray-400">Tidak ada laporan</p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-sm font-bold text-gray-500">Tanggal</th>
                                        <th className="text-left px-6 py-4 text-sm font-bold text-gray-500">Destinasi</th>
                                        <th className="text-center px-6 py-4 text-sm font-bold text-gray-500">Status</th>
                                        <th className="text-right px-6 py-4 text-sm font-bold text-gray-500">Pengunjung</th>
                                        <th className="text-right px-6 py-4 text-sm font-bold text-gray-500">Pendapatan</th>
                                        <th className="text-center px-6 py-4 text-sm font-bold text-gray-500">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedReports.map((report) => (
                                        <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-900">{formatDate(report.report_date, 'dd MMM yyyy')}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
                                                        <MapPin className="w-4 h-4 text-pink-600" />
                                                    </div>
                                                    <span className="font-medium text-gray-700">{report.destination?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge className={cn(
                                                    'font-bold border-0',
                                                    report.status === 'submitted'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                )}>
                                                    {report.status === 'submitted' ? 'Submitted' : 'Draft'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="font-bold text-gray-900">{report.total_visitors}</p>
                                                <p className="text-xs text-gray-400">A:{report.anak_count} D:{report.dewasa_count} W:{report.wna_count}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="font-bold text-green-600">{formatRupiah(report.total_revenue)}</p>
                                                {report.attraction_revenue > 0 && (
                                                    <p className="text-xs text-pink-500">+{formatRupiah(report.attraction_revenue)} atraksi</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => handleViewHistory(report.id)}
                                                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                                                        title="Riwayat Edit"
                                                    >
                                                        <History className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(report)}
                                                        className="p-2 rounded-lg hover:bg-pink-50 text-gray-400 hover:text-pink-600"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteReportId(report.id)}
                                                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="border-t-2 border-gray-100">
                            <PaginationControls
                                currentPage={currentPage}
                                totalItems={reports.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                                onItemsPerPageChange={setItemsPerPage}
                            />
                        </div>
                    </>
                )}
            </section>

            {/* Edit Dialog */}
            <Dialog open={!!editingReport} onOpenChange={() => setEditingReport(null)}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Data Laporan</DialogTitle>
                        <DialogDescription>
                            {editingReport?.destination?.name} • {editingReport?.report_date ? formatDate(editingReport.report_date) : ''}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Gender Input (PRIMARY - user inputs here) */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 text-sm font-bold">1</div>
                                <h4 className="font-bold text-gray-900">Input Gender (L/P)</h4>
                            </div>
                            <p className="text-sm text-gray-500">Jumlah pengunjung akan dihitung otomatis dari L + P</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 border-2 border-gray-200 rounded-xl space-y-3">
                                    <p className="text-sm font-bold text-gray-700">Anak <span className="text-gray-400 font-normal">(Rp 5.000)</span></p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs text-gray-500">Laki-laki</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                className="h-11 rounded-xl border-2"
                                                value={editForm.anak_male}
                                                onChange={(e) => setEditForm(f => ({ ...f, anak_male: parseInt(e.target.value) || 0 }))}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-gray-500">Perempuan</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                className="h-11 rounded-xl border-2"
                                                value={editForm.anak_female}
                                                onChange={(e) => setEditForm(f => ({ ...f, anak_female: parseInt(e.target.value) || 0 }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-center text-sm font-bold text-gray-900 bg-gray-50 rounded-lg py-2">
                                        Total: {editForm.anak_count}
                                    </div>
                                </div>
                                <div className="p-4 border-2 border-pink-200 rounded-xl space-y-3 bg-pink-50/30">
                                    <p className="text-sm font-bold text-pink-700">Dewasa <span className="text-pink-400 font-normal">(Rp 15.000)</span></p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs text-gray-500">Laki-laki</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                className="h-11 rounded-xl border-2"
                                                value={editForm.dewasa_male}
                                                onChange={(e) => setEditForm(f => ({ ...f, dewasa_male: parseInt(e.target.value) || 0 }))}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-gray-500">Perempuan</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                className="h-11 rounded-xl border-2"
                                                value={editForm.dewasa_female}
                                                onChange={(e) => setEditForm(f => ({ ...f, dewasa_female: parseInt(e.target.value) || 0 }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-center text-sm font-bold text-pink-700 bg-pink-100 rounded-lg py-2">
                                        Total: {editForm.dewasa_count}
                                    </div>
                                </div>
                            </div>

                            {/* WNA (no gender breakdown) */}
                            <div className="p-4 border-2 border-gray-200 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-gray-700">WNA <span className="text-gray-400 font-normal">(Rp 50.000)</span></p>
                                    <div className="w-28">
                                        <Input
                                            type="number"
                                            min="0"
                                            className="h-11 rounded-xl border-2 text-center"
                                            value={editForm.wna_count}
                                            onChange={(e) => setEditForm(f => ({ ...f, wna_count: parseInt(e.target.value) || 0 }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100" />

                        {/* Ticket Blocks */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 text-sm font-bold">2</div>
                                <h4 className="font-bold text-gray-900">Data Blok Tiket</h4>
                            </div>
                            <p className="text-sm text-gray-500">
                                Jumlah tiket harus sesuai dengan total pengunjung di atas.
                            </p>
                            <TicketBlockInput
                                value={editTicketBlocks}
                                onChange={setEditTicketBlocks}
                                expectedCounts={{
                                    anak: editForm.anak_count,
                                    dewasa: editForm.dewasa_count,
                                    wna: editForm.wna_count
                                }}
                                alwaysShow={true}
                            />
                        </div>

                        {/* Attractions Section */}
                        {editAttractions.length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-3">
                                    <h4 className="font-bold text-gray-900">Atraksi</h4>
                                    {editAttractions.map(att => (
                                        <AttractionInput
                                            key={att.id}
                                            attraction={att}
                                            data={editAttractionData[att.id] || createEmptyAttractionData(att.id)}
                                            onChange={(newData) => {
                                                setEditAttractionData(prev => ({
                                                    ...prev,
                                                    [att.id]: newData
                                                }))
                                            }}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="h-px bg-gray-100" />

                        {/* Payment */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 text-sm font-bold">3</div>
                                <h4 className="font-bold text-gray-900">Data Pembayaran</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm text-gray-500">QRIS</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        className="h-11 rounded-xl border-2"
                                        value={editForm.qris_amount}
                                        onChange={(e) => setEditForm(f => ({ ...f, qris_amount: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-gray-500">Cash</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        className="h-11 rounded-xl border-2"
                                        value={editForm.cash_amount}
                                        onChange={(e) => setEditForm(f => ({ ...f, cash_amount: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                            </div>
                            <div className={cn(
                                "p-4 rounded-xl border-2",
                                isRevenueMismatch ? "border-yellow-300 bg-yellow-50" : "border-green-200 bg-green-50"
                            )}>
                                <div className="flex justify-between font-bold text-lg">
                                    <span className="text-gray-700">Total Pendapatan:</span>
                                    <span className={isRevenueMismatch ? "text-yellow-700" : "text-green-600"}>{formatRupiah(editForm.cash_amount + editForm.qris_amount)}</span>
                                </div>
                                {isRevenueMismatch && (
                                    <p className="text-sm text-yellow-600 mt-2">
                                        ⚠️ Tidak sesuai estimasi tiket ({formatRupiah(expectedRevenue)})
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-gray-100" />

                        {/* Notes & Reason */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm text-gray-500">Catatan</Label>
                                <Input
                                    className="h-11 rounded-xl border-2"
                                    value={editForm.notes}
                                    onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="Catatan tambahan..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-pink-600 font-bold">Alasan Perubahan *</Label>
                                <Input
                                    className="h-11 rounded-xl border-2 border-pink-200"
                                    value={editReason}
                                    onChange={(e) => setEditReason(e.target.value)}
                                    placeholder="Wajib diisi"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <button
                            onClick={() => setEditingReport(null)}
                            className="px-5 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSaveEdit}
                            disabled={isSaving || !editReason.trim()}
                            className="px-5 py-3 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Simpan
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            {/* History Dialog */}
            <Dialog open={!!historyReportId} onOpenChange={() => setHistoryReportId(null)}>
                <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Riwayat Edit</DialogTitle>
                        <DialogDescription>
                            Semua perubahan yang pernah dilakukan pada laporan ini
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingHistory ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : editHistory.length === 0 ? (
                        <p className="text-center py-8 text-gray-500">Belum ada riwayat edit</p>
                    ) : (
                        <div className="space-y-4">
                            {editHistory.map((log) => (
                                <div key={log.id} className="border rounded-lg p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{log.editor?.name || 'Unknown'}</span>
                                        <span className="text-sm text-gray-500">
                                            {formatDate(log.edited_at)} {new Date(log.edited_at).toLocaleTimeString('id-ID')}
                                        </span>
                                    </div>
                                    {log.reason && (
                                        <p className="text-sm text-gray-600 italic">"{log.reason}"</p>
                                    )}
                                    <div className="text-sm space-y-1">
                                        {Object.entries(log.changes).map(([field, { old, new: newVal }]) => (
                                            <div key={field} className="flex items-center gap-2">
                                                <span className="text-gray-500">{getFieldLabel(field)}:</span>
                                                <span className="text-red-600 line-through">{String(old)}</span>
                                                <span>→</span>
                                                <span className="text-green-600">{String(newVal)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Add Report Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Tambah Laporan Manual</DialogTitle>
                        <DialogDescription>
                            Input laporan untuk tanggal yang terlewat
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Step 1: Destination */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 text-sm font-bold">1</div>
                                <h4 className="font-bold text-gray-900">Pilih Destinasi</h4>
                            </div>
                            <Select
                                value={addForm.destination_id}
                                onValueChange={(v) => setAddForm(f => ({ ...f, destination_id: v }))}
                            >
                                <SelectTrigger className="h-11 rounded-xl border-2">
                                    <SelectValue placeholder="Pilih destinasi..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {destinations.filter(d => d.is_active).map((dest) => (
                                        <SelectItem key={dest.id} value={dest.id}>
                                            {dest.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {addForm.destination_id && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 text-sm font-bold">2</div>
                                    <h4 className="font-bold text-gray-900">Pilih Tanggal Laporan</h4>
                                </div>
                                <Input
                                    type="date"
                                    className="h-11 rounded-xl border-2"
                                    value={addForm.report_date}
                                    max={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setAddForm(f => ({ ...f, report_date: e.target.value }))}
                                />
                            </div>
                        )}

                        {/* Step 3: Rest of form (shown after both destination and date selected) */}
                        {addForm.destination_id && addForm.report_date && (
                            <>
                                <div className="h-px bg-gray-100" />

                                {/* Gender Input (PRIMARY - user inputs here) */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 text-sm font-bold">3</div>
                                        <h4 className="font-bold text-gray-900">Input Gender (L/P)</h4>
                                    </div>
                                    <p className="text-sm text-gray-500">Jumlah pengunjung akan dihitung otomatis dari L + P</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 border-2 border-gray-200 rounded-xl space-y-3">
                                            <p className="text-sm font-bold text-gray-700">Anak <span className="text-gray-400 font-normal">(Rp 5.000)</span></p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-xs text-gray-500">Laki-laki</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        className="h-11 rounded-xl border-2"
                                                        value={addForm.anak_male}
                                                        onChange={(e) => setAddForm(f => ({ ...f, anak_male: parseInt(e.target.value) || 0 }))}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-gray-500">Perempuan</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        className="h-11 rounded-xl border-2"
                                                        value={addForm.anak_female}
                                                        onChange={(e) => setAddForm(f => ({ ...f, anak_female: parseInt(e.target.value) || 0 }))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-center text-sm font-bold text-gray-900 bg-gray-50 rounded-lg py-2">
                                                Total: {addForm.anak_count}
                                            </div>
                                        </div>
                                        <div className="p-4 border-2 border-pink-200 rounded-xl space-y-3 bg-pink-50/30">
                                            <p className="text-sm font-bold text-pink-700">Dewasa <span className="text-pink-400 font-normal">(Rp 15.000)</span></p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-xs text-gray-500">Laki-laki</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        className="h-11 rounded-xl border-2"
                                                        value={addForm.dewasa_male}
                                                        onChange={(e) => setAddForm(f => ({ ...f, dewasa_male: parseInt(e.target.value) || 0 }))}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-gray-500">Perempuan</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        className="h-11 rounded-xl border-2"
                                                        value={addForm.dewasa_female}
                                                        onChange={(e) => setAddForm(f => ({ ...f, dewasa_female: parseInt(e.target.value) || 0 }))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-center text-sm font-bold text-pink-700 bg-pink-100 rounded-lg py-2">
                                                Total: {addForm.dewasa_count}
                                            </div>
                                        </div>
                                    </div>

                                    {/* WNA (no gender breakdown) */}
                                    <div className="p-4 border-2 border-gray-200 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-gray-700">WNA <span className="text-gray-400 font-normal">(Rp 50.000)</span></p>
                                            <div className="w-28">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    className="h-11 rounded-xl border-2 text-center"
                                                    value={addForm.wna_count}
                                                    onChange={(e) => setAddForm(f => ({ ...f, wna_count: parseInt(e.target.value) || 0 }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100" />

                                {/* Ticket Blocks */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 text-sm font-bold">4</div>
                                        <h4 className="font-bold text-gray-900">Data Blok Tiket</h4>
                                    </div>
                                    <TicketBlockInput
                                        value={addTicketBlocks}
                                        onChange={setAddTicketBlocks}
                                        expectedCounts={{
                                            anak: addForm.anak_count,
                                            dewasa: addForm.dewasa_count,
                                            wna: addForm.wna_count,
                                        }}
                                    />
                                </div>

                                {/* Attractions Section */}
                                {addAttractions.length > 0 && (
                                    <>
                                        <div className="h-px bg-gray-100" />
                                        <div className="space-y-3">
                                            <h4 className="font-bold text-gray-900">Atraksi</h4>
                                            {addAttractions.map(att => (
                                                <AttractionInput
                                                    key={att.id}
                                                    attraction={att}
                                                    data={addAttractionData[att.id] || createEmptyAttractionData(att.id)}
                                                    onChange={(newData) => {
                                                        setAddAttractionData(prev => ({
                                                            ...prev,
                                                            [att.id]: newData
                                                        }))
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}

                                <div className="h-px bg-gray-100" />

                                {/* Payment */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 text-sm font-bold">5</div>
                                        <h4 className="font-bold text-gray-900">Data Pembayaran</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm text-gray-500">QRIS</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                className="h-11 rounded-xl border-2"
                                                value={addForm.qris_amount}
                                                onChange={(e) => setAddForm(f => ({ ...f, qris_amount: parseInt(e.target.value) || 0 }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm text-gray-500">Cash</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                className="h-11 rounded-xl border-2"
                                                value={addForm.cash_amount}
                                                onChange={(e) => setAddForm(f => ({ ...f, cash_amount: parseInt(e.target.value) || 0 }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl border-2 border-green-200 bg-green-50">
                                        <div className="flex justify-between font-bold text-lg">
                                            <span className="text-gray-700">Total Pendapatan:</span>
                                            <span className="text-green-600">{formatRupiah(addTotalRevenue)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100" />

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label className="text-sm text-gray-500">Catatan (Opsional)</Label>
                                    <Input
                                        className="h-11 rounded-xl border-2"
                                        value={addForm.notes}
                                        onChange={(e) => setAddForm(f => ({ ...f, notes: e.target.value }))}
                                        placeholder="Alasan input manual, keterangan tambahan..."
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <button
                            onClick={() => setIsAddDialogOpen(false)}
                            className="px-5 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleAddReport}
                            disabled={isAdding || !addForm.destination_id || !addForm.report_date}
                            className="px-5 py-3 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isAdding && <Loader2 className="w-4 h-4 animate-spin" />}
                            Simpan Laporan
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteReportId} onOpenChange={() => { setDeleteReportId(null); setDeleteReason(''); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Hapus Laporan
                        </DialogTitle>
                        <DialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Laporan akan dihapus permanen.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Alasan Penghapusan (Opsional)</Label>
                            <Input
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                placeholder="Contoh: Data salah destinasi, duplikat, dll"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => { setDeleteReportId(null); setDeleteReason(''); }}>
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteReport}
                            disabled={isDeleting}
                        >
                            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Ya, Hapus Laporan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
