'use client'

import * as React from 'react'
import { Pencil, Plus, X, Users, Key, ToggleLeft, ToggleRight, Trash2, MapPin, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { getAllUsers, createUser, updateUser, resetUserPin, toggleUserStatus, deleteUser } from '@/actions/users'
import { getAllDestinations } from '@/actions/destinations'
import { cn } from '@/lib/utils'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Destination {
    id: string
    code: string
    name: string
}

interface UserData {
    id: string
    name: string
    role: 'petugas' | 'koordinator' | 'admin'
    destination_id: string | null
    is_active: boolean
    destination: Destination | null
}

export default function PetugasPage() {
    const [users, setUsers] = React.useState<UserData[]>([])
    const [destinations, setDestinations] = React.useState<Destination[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [editForm, setEditForm] = React.useState({
        name: '',
        role: 'petugas' as 'petugas' | 'koordinator' | 'admin',
        destination_id: ''
    })
    const [isAdding, setIsAdding] = React.useState(false)
    const [newForm, setNewForm] = React.useState({
        name: '',
        pin: '123456',
        role: 'petugas' as 'petugas' | 'koordinator' | 'admin',
        destination_id: ''
    })
    const [isSaving, setIsSaving] = React.useState(false)
    const [resetPinId, setResetPinId] = React.useState<string | null>(null)
    const [newPin, setNewPin] = React.useState('123456')

    const loadData = async () => {
        const [usersResult, destResult] = await Promise.all([
            getAllUsers(),
            getAllDestinations(),
        ])

        if (usersResult.success && usersResult.data) {
            setUsers(usersResult.data as UserData[])
        }
        if (destResult.success && destResult.data) {
            setDestinations(destResult.data)
        }
        setIsLoading(false)
    }

    React.useEffect(() => {
        loadData()
    }, [])

    const handleEdit = (user: UserData) => {
        setEditingId(user.id)
        setEditForm({
            name: user.name,
            role: user.role,
            destination_id: user.destination_id || ''
        })
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setEditForm({ name: '', role: 'petugas', destination_id: '' })
    }

    const handleSaveEdit = async (id: string, isActive: boolean) => {
        setIsSaving(true)
        const result = await updateUser(id, {
            name: editForm.name,
            role: editForm.role,
            destination_id: editForm.role === 'admin' ? null : editForm.destination_id || null,
            is_active: isActive,
        })

        if (result.success) {
            toast.success('Petugas berhasil diperbarui')
            await loadData()
            setEditingId(null)
        } else {
            toast.error(result.error || 'Gagal memperbarui')
        }
        setIsSaving(false)
    }

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const result = await toggleUserStatus(id, !currentStatus)

        if (result.success) {
            toast.success(result.message)
            await loadData()
        } else {
            toast.error(result.error || 'Gagal mengubah status')
        }
    }

    const handleAddNew = async () => {
        if (!newForm.name || !newForm.pin) {
            toast.error('Nama dan PIN wajib diisi')
            return
        }

        if (newForm.role !== 'admin' && !newForm.destination_id) {
            toast.error('Destinasi wajib dipilih untuk petugas/koordinator')
            return
        }

        setIsSaving(true)
        const result = await createUser({
            name: newForm.name,
            pin: newForm.pin,
            role: newForm.role,
            destination_id: newForm.role === 'admin' ? null : newForm.destination_id,
        })

        if (result.success) {
            toast.success('Petugas berhasil ditambahkan')
            await loadData()
            setIsAdding(false)
            setNewForm({ name: '', pin: '123456', role: 'petugas', destination_id: '' })
        } else {
            toast.error(result.error || 'Gagal menambahkan')
        }
        setIsSaving(false)
    }

    const handleResetPin = async (id: string) => {
        if (newPin.length !== 6) {
            toast.error('PIN harus 6 digit')
            return
        }

        setIsSaving(true)
        const result = await resetUserPin(id, newPin)

        if (result.success) {
            toast.success('PIN berhasil direset')
            setResetPinId(null)
            setNewPin('123456')
        } else {
            toast.error(result.error || 'Gagal reset PIN')
        }
        setIsSaving(false)
    }

    const handleDelete = async (id: string) => {
        const result = await deleteUser(id)

        if (result.success) {
            toast.success('Petugas berhasil dihapus')
            await loadData()
        } else {
            toast.error(result.error || 'Gagal menghapus')
        }
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <Badge className="bg-pink-100 text-pink-700 border border-pink-200 font-bold text-xs">Admin</Badge>
            case 'koordinator':
                return <Badge className="bg-gray-100 text-gray-700 border border-gray-200 font-bold text-xs">Koordinator</Badge>
            default:
                return <Badge className="bg-gray-100 text-gray-600 border border-gray-200 font-bold text-xs">Petugas</Badge>
        }
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
                    <h1 className="text-3xl font-black text-gray-900">Manajemen Petugas</h1>
                    <p className="text-gray-500 mt-1">Kelola daftar petugas dan akses</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="px-5 py-3 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Tambah Petugas
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
                            <h2 className="font-bold text-gray-900">Tambah Petugas Baru</h2>
                            <p className="text-sm text-gray-500">Isi data untuk menambah petugas</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm text-gray-500">Nama</Label>
                                <Input
                                    className="h-11 rounded-xl border-2"
                                    placeholder="Nama lengkap"
                                    value={newForm.name}
                                    onChange={(e) => setNewForm(f => ({ ...f, name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-gray-500">PIN (6 digit)</Label>
                                <Input
                                    className="h-11 rounded-xl border-2"
                                    placeholder="123456"
                                    value={newForm.pin}
                                    onChange={(e) => setNewForm(f => ({ ...f, pin: e.target.value }))}
                                    maxLength={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-gray-500">Role</Label>
                                <Select
                                    value={newForm.role}
                                    onValueChange={(value) => setNewForm(f => ({
                                        ...f,
                                        role: value as 'petugas' | 'koordinator' | 'admin',
                                        destination_id: value === 'admin' ? '' : f.destination_id
                                    }))}
                                >
                                    <SelectTrigger className="h-11 rounded-xl border-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="petugas">Petugas</SelectItem>
                                        <SelectItem value="koordinator">Koordinator</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-gray-500">Destinasi</Label>
                                <Select
                                    value={newForm.destination_id}
                                    onValueChange={(value) => setNewForm(f => ({ ...f, destination_id: value }))}
                                    disabled={newForm.role === 'admin'}
                                >
                                    <SelectTrigger className="h-11 rounded-xl border-2">
                                        <SelectValue placeholder="Pilih destinasi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {destinations.map((dest) => (
                                            <SelectItem key={dest.id} value={dest.id}>
                                                {dest.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                        setNewForm({ name: '', pin: '123456', role: 'petugas', destination_id: '' })
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

            {/* Users List */}
            <section className="border-2 border-gray-200 rounded-2xl bg-white overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900">Daftar Petugas</h2>
                        <p className="text-sm text-gray-500">{users.length} petugas terdaftar</p>
                    </div>
                </div>

                <div className="divide-y divide-gray-100">
                    {users.map((user) => (
                        <div
                            key={user.id}
                            className={cn(
                                'px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors',
                                !user.is_active && 'opacity-50 bg-gray-50'
                            )}
                        >
                            {editingId === user.id ? (
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <Input
                                        className="h-11 rounded-xl border-2"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="Nama"
                                    />
                                    <Select
                                        value={editForm.role}
                                        onValueChange={(value) => setEditForm(f => ({
                                            ...f,
                                            role: value as 'petugas' | 'koordinator' | 'admin',
                                            destination_id: value === 'admin' ? '' : f.destination_id
                                        }))}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl border-2">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="petugas">Petugas</SelectItem>
                                            <SelectItem value="koordinator">Koordinator</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={editForm.destination_id}
                                        onValueChange={(value) => setEditForm(f => ({ ...f, destination_id: value }))}
                                        disabled={editForm.role === 'admin'}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl border-2">
                                            <SelectValue placeholder="Pilih destinasi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {destinations.map((dest) => (
                                                <SelectItem key={dest.id} value={dest.id}>
                                                    {dest.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSaveEdit(user.id, user.is_active)}
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
                            ) : resetPinId === user.id ? (
                                <div className="flex-1 flex items-center gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-sm text-gray-500">PIN Baru (6 digit)</Label>
                                        <Input
                                            className="w-32 h-11 rounded-xl border-2"
                                            value={newPin}
                                            onChange={(e) => setNewPin(e.target.value)}
                                            maxLength={6}
                                        />
                                    </div>
                                    <div className="flex gap-2 items-end">
                                        <button
                                            onClick={() => handleResetPin(user.id)}
                                            className="px-4 h-11 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-700 transition-colors"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            onClick={() => {
                                                setResetPinId(null)
                                                setNewPin('123456')
                                            }}
                                            className="px-4 h-11 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">{user.name}</span>
                                            {getRoleBadge(user.role)}
                                            {!user.is_active && (
                                                <Badge className="bg-red-50 text-red-600 border border-red-200 text-xs">Nonaktif</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                            <MapPin className="w-3 h-3" />
                                            <span>{user.destination?.name || (user.role === 'admin' ? 'Admin Pusat' : 'Belum ditugaskan')}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="p-2 rounded-lg text-gray-400 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                                        >
                                            <Pencil className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setResetPinId(user.id)}
                                            className="p-2 rounded-lg text-gray-400 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                                        >
                                            <Key className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                                            className="p-2 rounded-lg transition-colors"
                                        >
                                            {user.is_active ? (
                                                <ToggleRight className="w-6 h-6 text-green-600 hover:text-green-700" />
                                            ) : (
                                                <ToggleLeft className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                                            )}
                                        </button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <button className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Hapus Petugas?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Aksi ini tidak dapat dibatalkan. Data petugas {user.name} akan dihapus permanen.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDelete(user.id)}
                                                        className="bg-red-600 hover:bg-red-700"
                                                    >
                                                        Hapus
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}

                    {users.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            Belum ada petugas. Tambahkan petugas baru di atas.
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
