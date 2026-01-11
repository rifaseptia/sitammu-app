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
                return <Badge className="bg-blue-100 text-blue-700">Koordinator</Badge>
            default:
                return <Badge variant="secondary">Petugas</Badge>
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
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Penugasan</h1>
                    <p className="text-gray-500">Kelola penempatan petugas di setiap destinasi</p>
                </div>
            </div>

            {/* Unassigned Users */}
            {unassignedUsers.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-700">
                            <AlertCircle className="w-5 h-5" />
                            Petugas Belum Ditugaskan ({unassignedUsers.length})
                        </CardTitle>
                        <CardDescription className="text-yellow-600">
                            Segera tugaskan ke destinasi
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {unassignedUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                                    <div>
                                        <p className="font-medium">{user.name}</p>
                                        {getRoleBadge(user.role)}
                                    </div>
                                    <Select
                                        value={changes[user.id] || ''}
                                        onValueChange={(value) => handleDestinationChange(user.id, value)}
                                    >
                                        <SelectTrigger className="w-40">
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
                    </CardContent>
                </Card>
            )}

            {/* Destination Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {destinations.map((dest) => {
                    const destUsers = usersByDestination[dest.id] || []
                    return (
                        <Card key={dest.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <MapPin className="w-4 h-4" />
                                    {dest.name}
                                </CardTitle>
                                <CardDescription>
                                    {destUsers.length} petugas
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
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
                                                    'flex items-center justify-between p-2 rounded-lg',
                                                    changes[user.id] !== undefined
                                                        ? 'bg-blue-50 border border-blue-200'
                                                        : 'bg-gray-50'
                                                )}
                                            >
                                                <div>
                                                    <p className="font-medium text-sm">{user.name}</p>
                                                    {getRoleBadge(user.role)}
                                                </div>
                                                <Select
                                                    value={changes[user.id] ?? user.destination_id ?? ''}
                                                    onValueChange={(value) => handleDestinationChange(user.id, value)}
                                                >
                                                    <SelectTrigger className="w-32 h-8 text-xs">
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
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Bottom Save Action */}
            {Object.keys(changes).length > 0 && (
                <div className="flex justify-center mt-8">
                    <Button
                        onClick={handleSaveAll}
                        disabled={isSaving}
                        className="w-full max-w-md h-12 text-lg"
                    >
                        {isSaving ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                            <Check className="w-5 h-5 mr-2" />
                        )}
                        Simpan Perubahan ({Object.keys(changes).length})
                    </Button>
                </div>
            )}
        </div>
    )
}
