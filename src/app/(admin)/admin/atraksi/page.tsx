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
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Star className="w-7 h-7 text-pink-600" />
                        Kelola Atraksi
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Atur atraksi per destinasi
                    </p>
                </div>
                <Button onClick={openAddDialog}>
                    <Plus className="w-5 h-5 mr-2" />
                    Tambah Atraksi
                </Button>
            </div>

            {/* Per Destination */}
            {Object.values(grouped).map(({ destination, attractions: destAttractions }) => (
                <Card key={destination.id}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            📍 {destination.name}
                            <Badge variant="outline">{destAttractions.length} atraksi</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {destAttractions.length === 0 ? (
                            <p className="text-gray-500 text-center py-6">Belum ada atraksi</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Harga</TableHead>
                                        <TableHead>Tipe</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-[100px]">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {destAttractions.map(att => (
                                        <TableRow key={att.id}>
                                            <TableCell className="font-medium">{att.name}</TableCell>
                                            <TableCell>{formatRupiah(att.price)}</TableCell>
                                            <TableCell>
                                                {att.requires_ticket_block ? (
                                                    <Badge className="bg-blue-100 text-blue-700">
                                                        <Ticket className="w-3 h-3 mr-1" />
                                                        Blok Tiket
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-gray-100 text-gray-700">
                                                        <Hash className="w-3 h-3 mr-1" />
                                                        Jumlah
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={att.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                                    {att.is_active ? 'Aktif' : 'Nonaktif'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => openEditDialog(att)}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="text-red-600 hover:text-red-700"
                                                        onClick={() => handleDelete(att.id, att.name)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            ))}

            {/* Add/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? 'Edit Atraksi' : 'Tambah Atraksi'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Destinasi</Label>
                            <Select
                                value={form.destination_id}
                                onValueChange={(v) => setForm({ ...form, destination_id: v })}
                                disabled={!!editingId}
                            >
                                <SelectTrigger>
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
                            <Label>Nama Atraksi</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Contoh: Atraksi Utama, Toilet"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Harga (Rp)</Label>
                            <Input
                                type="number"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                                placeholder="5000"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label>Perlu Input Blok Tiket?</Label>
                            <Switch
                                checked={form.requires_ticket_block}
                                onCheckedChange={(v) => setForm({ ...form, requires_ticket_block: v })}
                            />
                        </div>

                        {editingId && (
                            <div className="flex items-center justify-between">
                                <Label>Aktif</Label>
                                <Switch
                                    checked={form.is_active}
                                    onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleSave}>
                            {editingId ? 'Simpan' : 'Tambah'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
