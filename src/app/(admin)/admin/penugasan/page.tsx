'use client'

import * as React from 'react'
import { Check, Users, MapPin, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import { getAllUsers, updateUser } from '@/actions/users'
import { getAllDestinations } from '@/actions/destinations'
import { cn } from '@/lib/utils'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface Destination {
    id: string
    code: string
    name: string
    is_active: boolean
}

interface UserData {
    id: string
    name: string
    role: 'petugas' | 'koordinator' | 'admin'
    destination_id: string | null
    is_active: boolean
    destination: Destination | null
}

export default function PenugasanPage() {
    const [users, setUsers] = React.useState<UserData[]>([])
    const [destinations, setDestinations] = React.useState<Destination[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [changes, setChanges] = React.useState<Record<string, string>>({})
    const [isSaving, setIsSaving] = React.useState(false)

    const loadData = async () => {
        const [usersResult, destResult] = await Promise.all([
            getAllUsers(),
            getAllDestinations(),
        ])

        if (usersResult.success && usersResult.data) {
            const staffUsers = (usersResult.data as UserData[]).filter(u => u.role !== 'admin' && u.is_active)
            setUsers(staffUsers)
        }
        if (destResult.success && destResult.data) {
            setDestinations(destResult.data.filter(d => d.is_active))
        }
        setIsLoading(false)
    }

    React.useEffect(() => {
        loadData()
    }, [])

    const handleDestinationChange = (userId: string, destinationId: string) => {
        setChanges(prev => ({
            ...prev,
            [userId]: destinationId === 'none' ? '' : destinationId,
        }))
    }

    const handleSaveAll = async () => {
        if (Object.keys(changes).length === 0) {
            toast.info('Tidak ada perubahan')
            return
        }

        setIsSaving(true)
        let successCount = 0
        let errorCount = 0

        for (const [userId, destId] of Object.entries(changes)) {
            const user = users.find(u => u.id === userId)
            if (!user) continue

            const result = await updateUser(userId, {
                name: user.name,
                role: user.role,
                destination_id: destId || null,
                is_active: user.is_active,
            })

            if (result.success) {
                successCount++
            } else {
                errorCount++
            }
        }

        if (successCount > 0) {
            toast.success(`${successCount} penugasan berhasil diperbarui`)
        }
        if (errorCount > 0) {
            toast.error(`${errorCount} penugasan gagal diperbarui`)
        }

        setChanges({})
        await loadData()
        setIsSaving(false)
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'koordinator':
                return <Badge className="bg-gray-100 text-gray-700 border border-gray-200 font-bold text-xs">Koordinator</Badge>
            default:
                return <Badge className="bg-gray-100 text-gray-600 border border-gray-200 font-bold text-xs">Petugas</Badge>
        }
    }

    // Group users by destination
    const usersByDestination = React.useMemo(() => {
        const grouped: Record<string, UserData[]> = {}
        users.forEach(user => {
            const currentDestId = changes[user.id] !== undefined
                ? changes[user.id]
                : user.destination_id || ''

            if (currentDestId) {
                if (!grouped[currentDestId]) {
                    grouped[currentDestId] = []
                }
                grouped[currentDestId].push(user)
            }
        })
        return grouped
    }, [users, changes])

    const unassignedUsers = React.useMemo(() => {
        return users.filter(user => {
            const currentDestId = changes[user.id] !== undefined
                ? changes[user.id]
                : user.destination_id || ''
            return !currentDestId
        })
    }, [users, changes])

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
            <div>
                <h1 className="text-3xl font-black text-gray-900">Penugasan</h1>
                <p className="text-gray-500 mt-1">Kelola penempatan petugas di setiap destinasi</p>
            </div>

            {/* Unassigned Users */}
            {unassignedUsers.length > 0 && (
                <section className="border-2 border-yellow-300 rounded-2xl bg-yellow-50/50 overflow-hidden">
                    <div className="px-6 py-4 border-b border-yellow-200 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-yellow-800">Petugas Belum Ditugaskan</h2>
                            <p className="text-sm text-yellow-600">{unassignedUsers.length} petugas perlu ditugaskan</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {unassignedUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between bg-white p-4 rounded-xl border-2 border-yellow-200">
                                    <div className="space-y-1">
                                        <p className="font-bold text-gray-900">{user.name}</p>
                                        {getRoleBadge(user.role)}
                                    </div>
                                    <Select
                                        value={changes[user.id] || ''}
                                        onValueChange={(value) => handleDestinationChange(user.id, value)}
                                    >
                                        <SelectTrigger className="w-40 h-11 rounded-xl border-2">
                                            <SelectValue placeholder="Pilih..." />
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
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Destination Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {destinations.map((dest) => {
                    const destUsers = usersByDestination[dest.id] || []
                    return (
                        <section key={dest.id} className="border-2 border-gray-200 rounded-2xl bg-white overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-pink-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{dest.name}</h3>
                                    <p className="text-xs text-gray-500">{destUsers.length} petugas</p>
                                </div>
                            </div>
                            <div className="p-4">
                                {destUsers.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4">
                                        Belum ada petugas
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {destUsers.map((user) => (
                                            <div
                                                key={user.id}
                                                className={cn(
                                                    'flex items-center justify-between p-3 rounded-xl',
                                                    changes[user.id] !== undefined
                                                        ? 'bg-pink-50 border-2 border-pink-200'
                                                        : 'bg-gray-50 border border-gray-100'
                                                )}
                                            >
                                                <div className="space-y-1">
                                                    <p className="font-bold text-sm text-gray-900">{user.name}</p>
                                                    {getRoleBadge(user.role)}
                                                </div>
                                                <Select
                                                    value={changes[user.id] ?? user.destination_id ?? ''}
                                                    onValueChange={(value) => handleDestinationChange(user.id, value)}
                                                >
                                                    <SelectTrigger className="w-28 h-9 text-xs rounded-lg border-2">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">-- Lepas --</SelectItem>
                                                        {destinations.map((d) => (
                                                            <SelectItem key={d.id} value={d.id}>
                                                                {d.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    )
                })}
            </div>

            {/* Bottom Save Action */}
            {Object.keys(changes).length > 0 && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={handleSaveAll}
                        disabled={isSaving}
                        className="w-full max-w-md h-14 text-lg font-bold rounded-xl bg-pink-600 text-white hover:bg-pink-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Check className="w-5 h-5" />
                        )}
                        Simpan Perubahan ({Object.keys(changes).length})
                    </button>
                </div>
            )}
        </div>
    )
}
