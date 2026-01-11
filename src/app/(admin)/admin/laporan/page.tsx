'use client'

import * as React from 'react'
import { Pencil, X, Eye, History, Loader2, Search, Filter, Users, Banknote, AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { getAllReports, getReportById, editReportWithLog, getReportEditHistory, createManualReport, deleteReport } from '@/actions/admin-reports'
import { getAllDestinations } from '@/actions/destinations'
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

import type { DailyReport, Destination, ReportEditLogWithUser } from '@/types'

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
    const [isAdding, setIsAdding] = React.useState(false)

    // Delete dialog
    const [deleteReportId, setDeleteReportId] = React.useState<string | null>(null)
    const [deleteReason, setDeleteReason] = React.useState('')
    const [isDeleting, setIsDeleting] = React.useState(false)

    const loadData = async () => {
        const [reportsResult, destResult] = await Promise.all([
            getAllReports({
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
    }, [filterDestination, filterStatus])

    const handleEdit = (report: ReportWithDestination) => {
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

        const result = await editReportWithLog(
            editingReport.id,
            {
                ...editForm,
                // Include ticket blocks
                ticket_blocks: ticketBlockDataToArray(editTicketBlocks)
            },
            user.id,
            editReason
        )

        console.log('Save result:', result)

        if (result.success) {
            toast.success(result.message || 'Laporan berhasil diperbarui')
            setEditingReport(null)
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
            const result = await createManualReport({
                ...addForm,
                ticket_blocks: ticketBlockDataToArray(addTicketBlocks),
                created_by: user.id,
            })

            console.log('createManualReport result:', result)

            if (result.success) {
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
    const addTotalRevenue = (addForm.anak_count * 5000) + (addForm.dewasa_count * 15000) + (addForm.wna_count * 50000)

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

    const expectedRevenue = subtotalAnak + subtotalDewasa + subtotalWNA
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
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Laporan</h1>
                    <p className="text-gray-500">Lihat dan edit laporan dari semua destinasi</p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Laporan
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="w-48">
                            <Label className="text-xs text-gray-500">Destinasi</Label>
                            <Select value={filterDestination || 'all'} onValueChange={(v) => setFilterDestination(v === 'all' ? '' : v)}>
                                <SelectTrigger>
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
                        <div className="w-40">
                            <Label className="text-xs text-gray-500">Status</Label>
                            <Select value={filterStatus || 'all'} onValueChange={(v) => setFilterStatus(v === 'all' ? '' : v)}>
                                <SelectTrigger>
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
                </CardContent>
            </Card>

            {/* Reports Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Laporan ({reports.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {reports.length === 0 ? (
                        <p className="text-center py-8 text-gray-500">Tidak ada laporan</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="text-left py-3 px-3 font-medium">Tanggal</th>
                                        <th className="text-left py-3 px-3 font-medium">Destinasi</th>
                                        <th className="text-center py-3 px-3 font-medium">Status</th>
                                        <th className="text-right py-3 px-3 font-medium">Anak</th>
                                        <th className="text-right py-3 px-3 font-medium">Dewasa</th>
                                        <th className="text-right py-3 px-3 font-medium">WNA</th>
                                        <th className="text-right py-3 px-3 font-medium">Total</th>
                                        <th className="text-right py-3 px-3 font-medium">Pendapatan</th>
                                        <th className="text-center py-3 px-3 font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((report) => (
                                        <tr key={report.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-3 font-medium">{formatDate(report.report_date)}</td>
                                            <td className="py-3 px-3">{report.destination?.name}</td>
                                            <td className="py-3 px-3 text-center">
                                                <Badge className={cn(
                                                    'text-xs',
                                                    report.status === 'submitted'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                )}>
                                                    {report.status === 'submitted' ? 'Submitted' : 'Draft'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-3 text-right">{report.anak_count}</td>
                                            <td className="py-3 px-3 text-right">{report.dewasa_count}</td>
                                            <td className="py-3 px-3 text-right">{report.wna_count}</td>
                                            <td className="py-3 px-3 text-right font-semibold">{report.total_visitors}</td>
                                            <td className="py-3 px-3 text-right text-green-600 font-semibold">{formatRupiah(report.total_revenue)}</td>
                                            <td className="py-3 px-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleViewHistory(report.id)}
                                                        title="Riwayat Edit"
                                                    >
                                                        <History className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleEdit(report)}
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => setDeleteReportId(report.id)}
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

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
                            <h4 className="font-medium text-sm text-gray-700">1. Input Gender (L/P)</h4>
                            <p className="text-xs text-gray-500">Jumlah pengunjung akan dihitung otomatis dari L + P</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-blue-50 rounded-lg space-y-2">
                                    <p className="text-sm font-medium text-blue-700">Anak (Rp 5.000)</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-xs">Laki-laki</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={editForm.anak_male}
                                                onChange={(e) => setEditForm(f => ({ ...f, anak_male: parseInt(e.target.value) || 0 }))}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Perempuan</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={editForm.anak_female}
                                                onChange={(e) => setEditForm(f => ({ ...f, anak_female: parseInt(e.target.value) || 0 }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-center text-sm font-semibold text-blue-800">
                                        Total: {editForm.anak_count}
                                    </div>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-lg space-y-2">
                                    <p className="text-sm font-medium text-purple-700">Dewasa (Rp 15.000)</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-xs">Laki-laki</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={editForm.dewasa_male}
                                                onChange={(e) => setEditForm(f => ({ ...f, dewasa_male: parseInt(e.target.value) || 0 }))}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Perempuan</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={editForm.dewasa_female}
                                                onChange={(e) => setEditForm(f => ({ ...f, dewasa_female: parseInt(e.target.value) || 0 }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-center text-sm font-semibold text-purple-800">
                                        Total: {editForm.dewasa_count}
                                    </div>
                                </div>
                            </div>

                            {/* WNA (no gender breakdown) */}
                            <div className="p-3 bg-orange-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-orange-700">WNA (Rp 50.000)</p>
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            min="0"
                                            value={editForm.wna_count}
                                            onChange={(e) => setEditForm(f => ({ ...f, wna_count: parseInt(e.target.value) || 0 }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Ticket Blocks */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-sm text-gray-700">2. Data Blok Tiket</h4>
                            <p className="text-xs text-gray-500">
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

                        <Separator />

                        {/* Payment */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-sm text-gray-700">3. Data Pembayaran</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>QRIS</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={editForm.qris_amount}
                                        onChange={(e) => setEditForm(f => ({ ...f, qris_amount: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cash</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={editForm.cash_amount}
                                        onChange={(e) => setEditForm(f => ({ ...f, cash_amount: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                            </div>
                            <div className={cn(
                                "p-2 rounded text-sm",
                                isRevenueMismatch ? "bg-red-50 text-red-700" : "bg-gray-100"
                            )}>
                                <div className="flex justify-between font-bold">
                                    <span>Total Pendapatan:</span>
                                    <span>{formatRupiah(editForm.cash_amount + editForm.qris_amount)}</span>
                                </div>
                                {isRevenueMismatch && (
                                    <p className="text-xs mt-1">
                                        Perhatian: Tidak sesuai estimasi tiket ({formatRupiah(expectedRevenue)})
                                    </p>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Notes & Reason */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="notes">Catatan</Label>
                                <Input
                                    id="notes"
                                    value={editForm.notes}
                                    onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="Catatan tambahan..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reason" className="text-red-600">Alasan Perubahan *</Label>
                                <Input
                                    id="reason"
                                    value={editReason}
                                    onChange={(e) => setEditReason(e.target.value)}
                                    placeholder="Wajib diisi"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingReport(null)}>
                            Batal
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={isSaving || !editReason.trim()}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Simpan
                        </Button>
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
                        <div className="space-y-2">
                            <Label>1. Pilih Destinasi *</Label>
                            <Select
                                value={addForm.destination_id}
                                onValueChange={(v) => setAddForm(f => ({ ...f, destination_id: v }))}
                            >
                                <SelectTrigger>
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

                        {/* Step 2: Date (shown after destination selected) */}
                        {addForm.destination_id && (
                            <div className="space-y-2">
                                <Label>2. Pilih Tanggal Laporan *</Label>
                                <Input
                                    type="date"
                                    value={addForm.report_date}
                                    max={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setAddForm(f => ({ ...f, report_date: e.target.value }))}
                                />
                            </div>
                        )}

                        {/* Step 3: Rest of form (shown after both destination and date selected) */}
                        {addForm.destination_id && addForm.report_date && (
                            <>
                                <Separator />

                                {/* Gender Input (PRIMARY - user inputs here) */}
                                <div className="space-y-4">
                                    <h4 className="font-medium text-sm text-gray-700">3. Input Gender (L/P)</h4>
                                    <p className="text-xs text-gray-500">Jumlah pengunjung akan dihitung otomatis dari L + P</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-blue-50 rounded-lg space-y-2">
                                            <p className="text-sm font-medium text-blue-700">Anak</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label className="text-xs">Laki-laki</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={addForm.anak_male}
                                                        onChange={(e) => setAddForm(f => ({ ...f, anak_male: parseInt(e.target.value) || 0 }))}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Perempuan</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={addForm.anak_female}
                                                        onChange={(e) => setAddForm(f => ({ ...f, anak_female: parseInt(e.target.value) || 0 }))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-center text-sm font-semibold text-blue-800">
                                                Total: {addForm.anak_count}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-purple-50 rounded-lg space-y-2">
                                            <p className="text-sm font-medium text-purple-700">Dewasa</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label className="text-xs">Laki-laki</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={addForm.dewasa_male}
                                                        onChange={(e) => setAddForm(f => ({ ...f, dewasa_male: parseInt(e.target.value) || 0 }))}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Perempuan</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={addForm.dewasa_female}
                                                        onChange={(e) => setAddForm(f => ({ ...f, dewasa_female: parseInt(e.target.value) || 0 }))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-center text-sm font-semibold text-purple-800">
                                                Total: {addForm.dewasa_count}
                                            </div>
                                        </div>
                                    </div>

                                    {/* WNA (no gender breakdown) */}
                                    <div className="p-3 bg-orange-50 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-orange-700">WNA</p>
                                            <div className="w-24">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={addForm.wna_count}
                                                    onChange={(e) => setAddForm(f => ({ ...f, wna_count: parseInt(e.target.value) || 0 }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Ticket Blocks */}
                                <div className="space-y-4">
                                    <h4 className="font-medium text-sm text-gray-700">Data Blok Tiket</h4>
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

                                <Separator />

                                {/* Payment */}
                                <div className="space-y-4">
                                    <h4 className="font-medium text-sm text-gray-700">Data Pembayaran</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>QRIS</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={addForm.qris_amount}
                                                onChange={(e) => setAddForm(f => ({ ...f, qris_amount: parseInt(e.target.value) || 0 }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Cash</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={addForm.cash_amount}
                                                onChange={(e) => setAddForm(f => ({ ...f, cash_amount: parseInt(e.target.value) || 0 }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="p-2 bg-gray-100 rounded text-sm">
                                        Total Pendapatan: <strong>{formatRupiah(addTotalRevenue)}</strong>
                                    </div>
                                </div>

                                <Separator />

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label>Catatan (Opsional)</Label>
                                    <Input
                                        value={addForm.notes}
                                        onChange={(e) => setAddForm(f => ({ ...f, notes: e.target.value }))}
                                        placeholder="Alasan input manual, keterangan tambahan..."
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            onClick={handleAddReport}
                            disabled={isAdding || !addForm.destination_id || !addForm.report_date}
                        >
                            {isAdding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Simpan Laporan
                        </Button>
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
        </div>
    )
}
