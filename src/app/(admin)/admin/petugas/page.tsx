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
                return <Badge className="bg-purple-100 text-purple-700">Admin</Badge>
            case 'koordinator':
                return <Badge className="bg-blue-100 text-blue-700">Koordinator</Badge>
            default:
                return <Badge variant="secondary">Petugas</Badge>
        }
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
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Petugas</h1>
                    <p className="text-gray-500">Kelola daftar petugas dan akses</p>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Petugas
                    </Button>
                )}
            </div>

            {/* Add New Form */}
            {isAdding && (
                <Card>
                    <CardHeader>
                        <CardTitle>Tambah Petugas Baru</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="space-y-2">
                                <Label>Nama</Label>
                                <Input
                                    placeholder="Nama lengkap"
                                    value={newForm.name}
                                    onChange={(e) => setNewForm(f => ({ ...f, name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>PIN (6 digit)</Label>
                                <Input
                                    placeholder="123456"
                                    value={newForm.pin}
                                    onChange={(e) => setNewForm(f => ({ ...f, pin: e.target.value }))}
                                    maxLength={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select
                                    value={newForm.role}
                                    onValueChange={(value) => setNewForm(f => ({
                                        ...f,
                                        role: value as 'petugas' | 'koordinator' | 'admin',
                                        destination_id: value === 'admin' ? '' : f.destination_id
                                    }))}
                                >
                                    <SelectTrigger>
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
                                <Label>Destinasi</Label>
                                <Select
                                    value={newForm.destination_id}
                                    onValueChange={(value) => setNewForm(f => ({ ...f, destination_id: value }))}
                                    disabled={newForm.role === 'admin'}
                                >
                                    <SelectTrigger>
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
                                <Button onClick={handleAddNew} disabled={isSaving} className="flex-1">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan"}
                                </Button>
                                <Button variant="outline" onClick={() => {
                                    setIsAdding(false)
                                    setNewForm({ name: '', pin: '123456', role: 'petugas', destination_id: '' })
                                }}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Users List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Daftar Petugas ({users.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                        {users.map((user) => (
                            <div
                                key={user.id}
                                className={cn(
                                    'flex items-center justify-between py-4',
                                    !user.is_active && 'opacity-50'
                                )}
                            >
                                {editingId === user.id ? (
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <Input
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
                                            <SelectTrigger>
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
                                            <SelectTrigger>
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
                                            <Button
                                                onClick={() => handleSaveEdit(user.id, user.is_active)}
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
                                ) : resetPinId === user.id ? (
                                    <div className="flex-1 flex items-center gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-sm">PIN Baru (6 digit)</Label>
                                            <Input
                                                value={newPin}
                                                onChange={(e) => setNewPin(e.target.value)}
                                                maxLength={6}
                                                className="w-32"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={() => handleResetPin(user.id)} size="sm">
                                                Reset
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setResetPinId(null)
                                                    setNewPin('123456')
                                                }}
                                                size="sm"
                                            >
                                                Batal
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{user.name}</span>
                                                {getRoleBadge(user.role)}
                                                {!user.is_active && (
                                                    <Badge variant="outline">Nonaktif</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                                <MapPin className="w-3 h-3" />
                                                <span>{user.destination?.name || (user.role === 'admin' ? 'Admin Pusat' : 'Belum ditugaskan')}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleEdit(user)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setResetPinId(user.id)}
                                            >
                                                <Key className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleToggleStatus(user.id, user.is_active)}
                                            >
                                                {user.is_active ? (
                                                    <ToggleRight className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <ToggleLeft className="w-5 h-5" />
                                                )}
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
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
                </CardContent>
            </Card>
        </div>
    )
}
