'use client'

import * as React from 'react'
import { Star, Plus, Pencil, Trash2, X, Check, Ticket, Hash } from 'lucide-react'
import { toast } from 'sonner'

import { getAllAttractions, createAttraction, updateAttraction, deleteAttraction } from '@/actions/admin-attractions'
import { getDestinations } from '@/actions/auth'
import { formatRupiah } from '@/lib/utils'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

import type { AttractionWithDestination, Destination } from '@/types'

export default function AdminAtraksiPage() {
    const [attractions, setAttractions] = React.useState<AttractionWithDestination[]>([])
    const [destinations, setDestinations] = React.useState<Destination[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    // Dialog state
    const [showDialog, setShowDialog] = React.useState(false)
    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [form, setForm] = React.useState({
        destination_id: '',
        name: '',
        price: 0,
        requires_ticket_block: true,
        is_active: true,
        sort_order: 0,
    })

    const loadData = React.useCallback(async () => {
        const [attResult, destResult] = await Promise.all([
            getAllAttractions(),
            getDestinations(),
        ])

        if (attResult.success && attResult.data) {
            setAttractions(attResult.data)
        }
        if (destResult.success && destResult.data) {
            setDestinations(destResult.data)
        }
        setIsLoading(false)
    }, [])

    React.useEffect(() => {
        loadData()
    }, [loadData])

    const resetForm = () => {
        setForm({
            destination_id: '',
            name: '',
            price: 0,
            requires_ticket_block: true,
            is_active: true,
            sort_order: 0,
        })
        setEditingId(null)
    }

    const openAddDialog = () => {
        resetForm()
        setShowDialog(true)
    }

    const openEditDialog = (att: AttractionWithDestination) => {
        setForm({
            destination_id: att.destination_id,
            name: att.name,
            price: att.price,
            requires_ticket_block: att.requires_ticket_block,
            is_active: att.is_active,
            sort_order: att.sort_order,
        })
        setEditingId(att.id)
        setShowDialog(true)
    }

    const handleSave = async () => {
        if (!form.destination_id || !form.name) {
            toast.error('Destinasi dan nama harus diisi')
            return
        }

        if (editingId) {
            const result = await updateAttraction(editingId, {
                name: form.name,
                price: form.price,
                requires_ticket_block: form.requires_ticket_block,
                is_active: form.is_active,
                sort_order: form.sort_order,
            })
            if (result.success) {
                toast.success('Atraksi berhasil diupdate')
                loadData()
                setShowDialog(false)
            } else {
                toast.error(result.error)
            }
        } else {
            const result = await createAttraction({
                destination_id: form.destination_id,
                name: form.name,
                price: form.price,
                requires_ticket_block: form.requires_ticket_block,
                sort_order: form.sort_order,
            })
            if (result.success) {
                toast.success('Atraksi berhasil ditambahkan')
                loadData()
                setShowDialog(false)
            } else {
                toast.error(result.error)
            }
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Hapus atraksi "${name}"?`)) return

        const result = await deleteAttraction(id)
        if (result.success) {
            toast.success('Atraksi berhasil dihapus')
            loadData()
        } else {
            toast.error(result.error)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    // Group by destination
    const grouped = destinations.reduce((acc, dest) => {
        acc[dest.id] = {
            destination: dest,
            attractions: attractions.filter(a => a.destination_id === dest.id)
        }
        return acc
    }, {} as Record<string, { destination: Destination, attractions: AttractionWithDestination[] }>)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">
                        Kelola Atraksi
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Atur atraksi per destinasi
                    </p>
                </div>
                <button
                    onClick={openAddDialog}
                    className="px-5 py-3 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Tambah Atraksi
                </button>
            </div>

            {/* Per Destination */}
            {Object.values(grouped).map(({ destination, attractions: destAttractions }) => (
                <section key={destination.id} className="border-2 border-gray-200 rounded-2xl bg-white overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                            <Star className="w-5 h-5 text-pink-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">{destination.name}</h2>
                            <p className="text-sm text-gray-500">{destAttractions.length} atraksi</p>
                        </div>
                    </div>

                    {destAttractions.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">Belum ada atraksi</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-500">Nama</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-500">Harga</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-500">Tipe</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-500">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-500 w-[100px]">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {destAttractions.map(att => (
                                        <tr key={att.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-900">{att.name}</td>
                                            <td className="px-6 py-4 text-gray-600">{formatRupiah(att.price)}</td>
                                            <td className="px-6 py-4">
                                                {att.requires_ticket_block ? (
                                                    <Badge className="bg-pink-100 text-pink-700 border border-pink-200 font-bold text-xs">
                                                        <Ticket className="w-3 h-3 mr-1" />
                                                        Blok Tiket
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-gray-100 text-gray-700 border border-gray-200 font-bold text-xs">
                                                        Jumlah
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={att.is_active
                                                    ? 'bg-green-100 text-green-700 border border-green-200 text-xs'
                                                    : 'bg-red-100 text-red-600 border border-red-200 text-xs'
                                                }>
                                                    {att.is_active ? 'Aktif' : 'Nonaktif'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => openEditDialog(att)}
                                                        className="p-2 rounded-lg text-gray-400 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(att.id, att.name)}
                                                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
                    )}
                </section>
            ))}

            {/* Add/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-gray-900">
                            {editingId ? 'Edit Atraksi' : 'Tambah Atraksi'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-sm text-gray-500">Destinasi</Label>
                            <Select
                                value={form.destination_id}
                                onValueChange={(v) => setForm({ ...form, destination_id: v })}
                                disabled={!!editingId}
                            >
                                <SelectTrigger className="h-11 rounded-xl border-2">
                                    <SelectValue placeholder="Pilih destinasi" />
                                </SelectTrigger>
                                <SelectContent>
                                    {destinations.map(d => (
                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm text-gray-500">Nama Atraksi</Label>
                            <Input
                                className="h-11 rounded-xl border-2"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Contoh: Atraksi Utama, Toilet"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm text-gray-500">Harga (Rp)</Label>
                            <Input
                                className="h-11 rounded-xl border-2"
                                type="number"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                                placeholder="5000"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <Label className="font-medium text-gray-700">Perlu Input Blok Tiket?</Label>
                            <Switch
                                checked={form.requires_ticket_block}
                                onCheckedChange={(v) => setForm({ ...form, requires_ticket_block: v })}
                            />
                        </div>

                        {editingId && (
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <Label className="font-medium text-gray-700">Aktif</Label>
                                <Switch
                                    checked={form.is_active}
                                    onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <button
                            onClick={() => setShowDialog(false)}
                            className="px-5 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-5 py-3 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-700 transition-colors"
                        >
                            {editingId ? 'Simpan' : 'Tambah'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
