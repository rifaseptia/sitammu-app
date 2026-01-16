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
                <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Manajemen Destinasi</h1>
                    <p className="text-gray-500 mt-1">Kelola daftar destinasi wisata</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-5 py-3 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Tambah Destinasi
                    </button>
                )}
            </div>

            {/* Add New Form */}
            {isAdding && (
                <section className="border-2 border-pink-200 rounded-2xl bg-pink-50/30 overflow-hidden">
                    <div className="px-6 py-4 border-b border-pink-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                            <Plus className="w-5 h-5 text-pink-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">Tambah Destinasi Baru</h2>
                            <p className="text-sm text-gray-500">Isi data untuk menambah destinasi</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm text-gray-500">Kode</Label>
                                <Input
                                    className="h-11 rounded-xl border-2"
                                    placeholder="DST004"
                                    value={newForm.code}
                                    onChange={(e) => setNewForm(f => ({ ...f, code: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-gray-500">Nama Destinasi</Label>
                                <Input
                                    className="h-11 rounded-xl border-2"
                                    placeholder="Pantai Losari"
                                    value={newForm.name}
                                    onChange={(e) => setNewForm(f => ({ ...f, name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-gray-500">Lokasi</Label>
                                <Input
                                    className="h-11 rounded-xl border-2"
                                    placeholder="Makassar, Sulsel"
                                    value={newForm.location}
                                    onChange={(e) => setNewForm(f => ({ ...f, location: e.target.value }))}
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <button
                                    onClick={handleAddNew}
                                    disabled={isSaving}
                                    className="flex-1 h-11 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan"}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAdding(false)
                                        setNewForm({ code: '', name: '', location: '' })
                                    }}
                                    className="h-11 w-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Destinations List */}
            <section className="border-2 border-gray-200 rounded-2xl bg-white overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900">Daftar Destinasi</h2>
                        <p className="text-sm text-gray-500">{destinations.length} destinasi terdaftar</p>
                    </div>
                </div>

                <div className="divide-y divide-gray-100">
                    {destinations.map((dest) => (
                        <div
                            key={dest.id}
                            className={cn(
                                'px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors',
                                !dest.is_active && 'opacity-50 bg-gray-50'
                            )}
                        >
                            {editingId === dest.id ? (
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input
                                        className="h-11 rounded-xl border-2"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="Nama"
                                    />
                                    <Input
                                        className="h-11 rounded-xl border-2"
                                        value={editForm.location}
                                        onChange={(e) => setEditForm(f => ({ ...f, location: e.target.value }))}
                                        placeholder="Lokasi"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSaveEdit(dest.id, dest.is_active)}
                                            disabled={isSaving}
                                            className="px-4 h-11 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Simpan
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="h-11 w-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">{dest.name}</span>
                                            <Badge className="bg-gray-100 text-gray-600 border border-gray-200 font-mono text-xs">{dest.code}</Badge>
                                            {!dest.is_active && (
                                                <Badge className="bg-red-50 text-red-600 border border-red-200 text-xs">Nonaktif</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">{dest.location || 'Lokasi belum diisi'}</p>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleEdit(dest)}
                                            className="p-2 rounded-lg text-gray-400 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                                        >
                                            <Pencil className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(dest.id, dest.is_active)}
                                            className="p-2 rounded-lg transition-colors"
                                        >
                                            {dest.is_active ? (
                                                <ToggleRight className="w-6 h-6 text-green-600 hover:text-green-700" />
                                            ) : (
                                                <ToggleLeft className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}

                    {destinations.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            Belum ada destinasi. Tambahkan destinasi baru di atas.
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
