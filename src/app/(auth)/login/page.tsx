'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, User, Lock, Loader2, ShieldCheck, Contact2 } from 'lucide-react'

import { APP } from '@/lib/constants'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { loginAction, getDestinations, getUsersByDestination, getAdminUsers, adminLoginAction } from '@/actions/auth'
import { useAuthStore } from '@/lib/stores/auth-store'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { AppFooter } from '@/components/app-footer'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { PinInput } from '@/components/ui/pin-input'

import type { Destination, User as UserType } from '@/types'

export default function LoginPage() {
    const router = useRouter()
    const { login, logout } = useAuthStore()

    const [destinations, setDestinations] = React.useState<Destination[]>([])
    const [users, setUsers] = React.useState<Pick<UserType, 'id' | 'name' | 'role'>[]>([])
    const [adminUsers, setAdminUsers] = React.useState<Pick<UserType, 'id' | 'name' | 'role'>[]>([])
    const [isLoadingDestinations, setIsLoadingDestinations] = React.useState(true)
    const [isLoadingUsers, setIsLoadingUsers] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [isAdminMode, setIsAdminMode] = React.useState(false)
    const [selectedAdmin, setSelectedAdmin] = React.useState('')
    const [adminPin, setAdminPin] = React.useState('')

    const {
        setValue,
        watch,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            destination_id: '',
            user_id: '',
            pin: '',
        },
    })

    const selectedDestination = watch('destination_id')
    const selectedUser = watch('user_id')
    const pin = watch('pin')

    React.useEffect(() => {
        async function loadData() {
            const [destResult, adminResult] = await Promise.all([
                getDestinations(),
                getAdminUsers(),
            ])
            if (destResult.success && destResult.data) {
                setDestinations(destResult.data)
            }
            if (adminResult.success && adminResult.data) {
                setAdminUsers(adminResult.data)
            }
            setIsLoadingDestinations(false)
        }
        loadData()
    }, [])

    React.useEffect(() => {
        async function loadUsers() {
            if (!selectedDestination) {
                setUsers([])
                return
            }
            setIsLoadingUsers(true)
            setValue('user_id', '')
            const result = await getUsersByDestination(selectedDestination)
            if (result.success && result.data) {
                setUsers(result.data)
            }
            setIsLoadingUsers(false)
        }
        loadUsers()
    }, [selectedDestination, setValue])

    React.useEffect(() => {
        if (!isAdminMode && pin.length === 6 && selectedDestination && selectedUser) {
            handleSubmit(onSubmit)()
        }
    }, [pin])

    React.useEffect(() => {
        if (isAdminMode && adminPin.length === 6 && selectedAdmin) {
            handleAdminLogin()
        }
    }, [adminPin])

    const onSubmit = async (data: LoginFormData) => {
        setIsSubmitting(true)
        setError(null)
        const result = await loginAction(data)
        if (result.success && result.data) {
            // Clear old session data first to prevent stale destination_id
            logout()
            // Small delay to ensure localStorage is cleared
            await new Promise(resolve => setTimeout(resolve, 50))
            // Set new user data
            login(result.data)
            router.push('/dashboard')
        } else {
            setError(result.error || 'PIN Salah')
            setValue('pin', '')
        }
        setIsSubmitting(false)
    }

    const handleAdminLogin = async () => {
        setIsSubmitting(true)
        setError(null)
        const result = await adminLoginAction({
            user_id: selectedAdmin,
            pin: adminPin,
        })
        if (result.success && result.data) {
            // Clear old session data first to prevent stale destination_id
            logout()
            // Small delay to ensure localStorage is cleared
            await new Promise(resolve => setTimeout(resolve, 50))
            // Set new user data
            login(result.data)
            router.push('/admin')
        } else {
            setError(result.error || 'PIN Admin Salah')
            setAdminPin('')
        }
        setIsSubmitting(false)
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-[400px] space-y-6">
                {/* Branding */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-black">
                        SITAMMU <span className="text-pink-600 font-black">LOGIN</span>
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">{APP.tagline}</p>
                </div>

                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-xl font-bold text-center text-black">Selamat Datang</CardTitle>
                        <CardDescription className="text-center font-medium">
                            Silakan masuk menggunakan akun Anda
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Mode Toggle */}
                        <div className="flex p-1 bg-gray-100 rounded-lg">
                            <button
                                onClick={() => { setIsAdminMode(false); setError(null); }}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-bold transition-all",
                                    !isAdminMode
                                        ? "bg-white text-pink-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <Contact2 className="w-4 h-4" />
                                Petugas
                            </button>
                            <button
                                onClick={() => { setIsAdminMode(true); setError(null); }}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-bold transition-all",
                                    isAdminMode
                                        ? "bg-white text-pink-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Admin
                            </button>
                        </div>

                        {!isAdminMode ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Pilih Destinasi</Label>
                                    <Select
                                        value={selectedDestination}
                                        onValueChange={(v) => setValue('destination_id', v)}
                                    >
                                        <SelectTrigger className="w-full h-12 border-gray-200 focus:ring-pink-500/20 focus:border-pink-500">
                                            <div className="flex items-center gap-2 font-medium">
                                                <MapPin className="w-4 h-4 text-pink-600" />
                                                <SelectValue placeholder="Pilih lokasi..." />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {destinations.map((d) => (
                                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Pilih Petugas</Label>
                                    <Select
                                        value={selectedUser}
                                        onValueChange={(v) => setValue('user_id', v)}
                                        disabled={!selectedDestination}
                                    >
                                        <SelectTrigger className="w-full h-12 border-gray-200 focus:ring-pink-500/20 focus:border-pink-500">
                                            <div className="flex items-center gap-2 font-medium">
                                                <User className="w-4 h-4 text-pink-600" />
                                                <SelectValue placeholder={isLoadingUsers ? "Memuat..." : "Pilih nama..."} />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((u) => (
                                                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3 pt-1">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex justify-center">Verifikasi PIN</Label>
                                    <PinInput
                                        value={pin}
                                        onChange={(v) => setValue('pin', v)}
                                        disabled={!selectedUser || isSubmitting}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">Pilih Akun Admin</Label>
                                    <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                                        <SelectTrigger className="w-full h-12 border-gray-200 focus:ring-pink-500/20 focus:border-pink-500">
                                            <div className="flex items-center gap-2 font-medium">
                                                <ShieldCheck className="w-4 h-4 text-pink-600" />
                                                <SelectValue placeholder="Pilih admin..." />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {adminUsers.map((a) => (
                                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-3 pt-1">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex justify-center">PIN Admin</Label>
                                    <PinInput
                                        value={adminPin}
                                        onChange={setAdminPin}
                                        disabled={!selectedAdmin || isSubmitting}
                                    />
                                </div>
                            </div>
                        )}

                        {error && (
                            <p className="text-sm text-red-600 text-center font-bold bg-red-50 py-2.5 rounded-md border border-red-100">
                                {error}
                            </p>
                        )}

                        <Button
                            className="w-full h-12 bg-pink-600 hover:bg-pink-700 text-white font-black uppercase tracking-wider shadow-lg shadow-pink-100"
                            onClick={isAdminMode ? handleAdminLogin : handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Masuk Sekarang"}
                        </Button>
                    </CardContent>
                </Card>

                <AppFooter variant="minimal" className="font-bold uppercase tracking-[0.2em]" />
            </div>
        </div>
    )
}
