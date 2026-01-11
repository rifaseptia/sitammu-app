'use client'

import * as React from 'react'
import { Pencil, Plus, Check, X, MapPin, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { getAllDestinations, updateDestination, createDestination, toggleDestinationStatus } from '@/actions/destinations'
import { cn } from '@/lib/utils'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface Destination {
    id: string
    code: string
    name: string
    location: string | null
    is_active: boolean
}

export default function DestinasiPage() {
    const [destinations, setDestinations] = React.useState<Destination[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [editForm, setEditForm] = React.useState({ name: '', location: '' })
    const [isAdding, setIsAdding] = React.useState(false)
    const [newForm, setNewForm] = React.useState({ code: '', name: '', location: '' })
    const [isSaving, setIsSaving] = React.useState(false)

    const loadDestinations = async () => {
        const result = await getAllDestinations()
        if (result.success && result.data) {
            setDestinations(result.data)
        }
        setIsLoading(false)
    }

    React.useEffect(() => {
        loadDestinations()
    }, [])

    const handleEdit = (dest: Destination) => {
        setEditingId(dest.id)
        setEditForm({ name: dest.name, location: dest.location || '' })
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setEditForm({ name: '', location: '' })
    }

    const handleSaveEdit = async (id: string, isActive: boolean) => {
        setIsSaving(true)
        const result = await updateDestination(id, {
            name: editForm.name,
            location: editForm.location,
            is_active: isActive,
        })

        if (result.success) {
            toast.success('Destinasi berhasil diperbarui')
            await loadDestinations()
            setEditingId(null)
        } else {
            toast.error(result.error || 'Gagal memperbarui')
        }
        setIsSaving(false)
    }

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const result = await toggleDestinationStatus(id, !currentStatus)

        if (result.success) {
            toast.success(result.message)
            await loadDestinations()
        } else {
            toast.error(result.error || 'Gagal mengubah status')
        }
    }

    const handleAddNew = async () => {
        if (!newForm.code || !newForm.name) {
            toast.error('Kode dan nama wajib diisi')
            return
        }

        setIsSaving(true)
        const result = await createDestination(newForm)

        if (result.success) {
            toast.success('Destinasi berhasil ditambahkan')
            await loadDestinations()
            setIsAdding(false)
            setNewForm({ code: '', name: '', location: '' })
        } else {
            toast.error(result.error || 'Gagal menambahkan')
        }
        setIsSaving(false)
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
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Destinasi</h1>
                    <p className="text-gray-500">Kelola daftar destinasi wisata</p>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Destinasi
                    </Button>
                )}
            </div>

            {/* Add New Form */}
            {isAdding && (
                <Card>
                    <CardHeader>
                        <CardTitle>Tambah Destinasi Baru</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label>Kode</Label>
                                <Input
                                    placeholder="DST004"
                                    value={newForm.code}
                                    onChange={(e) => setNewForm(f => ({ ...f, code: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Nama Destinasi</Label>
                                <Input
                                    placeholder="Pantai Losari"
                                    value={newForm.name}
                                    onChange={(e) => setNewForm(f => ({ ...f, name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Lokasi</Label>
                                <Input
                                    placeholder="Makassar, Sulsel"
                                    value={newForm.location}
                                    onChange={(e) => setNewForm(f => ({ ...f, location: e.target.value }))}
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleAddNew} disabled={isSaving} className="flex-1">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan"}
                                </Button>
                                <Button variant="outline" onClick={() => {
                                    setIsAdding(false)
                                    setNewForm({ code: '', name: '', location: '' })
                                }}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Destinations List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Daftar Destinasi ({destinations.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                        {destinations.map((dest) => (
                            <div
                                key={dest.id}
                                className={cn(
                                    'flex items-center justify-between py-4',
                                    !dest.is_active && 'opacity-50'
                                )}
                            >
                                {editingId === dest.id ? (
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Input
                                            value={editForm.name}
                                            onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                                            placeholder="Nama"
                                        />
                                        <Input
                                            value={editForm.location}
                                            onChange={(e) => setEditForm(f => ({ ...f, location: e.target.value }))}
                                            placeholder="Lokasi"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleSaveEdit(dest.id, dest.is_active)}
                                                disabled={isSaving}
                                                size="sm"
                                            >
                                                Simpan
                                            </Button>
                                            <Button variant="outline" onClick={handleCancelEdit} size="sm">
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{dest.name}</span>
                                                <Badge variant="secondary">{dest.code}</Badge>
                                                {!dest.is_active && (
                                                    <Badge variant="outline">Nonaktif</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">{dest.location || '-'}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleEdit(dest)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleToggleStatus(dest.id, dest.is_active)}
                                            >
                                                {dest.is_active ? (
                                                    <ToggleRight className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <ToggleLeft className="w-5 h-5" />
                                                )}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}

                        {destinations.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                Belum ada destinasi. Tambahkan destinasi baru di atas.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
