'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, User, Loader2, ShieldCheck, UserCircle2, Sparkles } from 'lucide-react'

import { APP } from '@/lib/constants'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { loginAction, getDestinations, getUsersByDestination, getAdminUsers, adminLoginAction } from '@/actions/auth'
import { useAuthStore } from '@/lib/stores/auth-store'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
    }, [pin, isAdminMode, selectedDestination, selectedUser, handleSubmit])

    React.useEffect(() => {
        if (isAdminMode && adminPin.length === 6 && selectedAdmin) {
            handleAdminLogin()
        }
    }, [adminPin, isAdminMode, selectedAdmin])

    const onSubmit = async (data: LoginFormData) => {
        setIsSubmitting(true)
        setError(null)
        const result = await loginAction(data)
        if (result.success && result.data) {
            logout()
            await new Promise(resolve => setTimeout(resolve, 50))
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
            logout()
            await new Promise(resolve => setTimeout(resolve, 50))
            login(result.data)
            router.push('/admin')
        } else {
            setError(result.error || 'PIN Admin Salah')
            setAdminPin('')
        }
        setIsSubmitting(false)
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-pink-50 via-white to-white">
            {/* Header Section */}
            <div className="pt-12 pb-8 px-6 text-center">
                {/* Logo/Icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-500 to-pink-600 shadow-xl shadow-pink-200 mb-6">
                    <Sparkles className="w-10 h-10 text-white" />
                </div>

                {/* App Name */}
                <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-2">
                    SITAMMU
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                    {APP.tagline}
                </p>
            </div>

            {/* Main Card */}
            <div className="flex-1 px-4 pb-8">
                <div className="max-w-sm mx-auto">
                    {/* Mode Toggle */}
                    <div className="flex p-1 bg-gray-100 rounded-2xl mb-6">
                        <button
                            onClick={() => { setIsAdminMode(false); setError(null); }}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all",
                                !isAdminMode
                                    ? "bg-white text-pink-600 shadow-sm"
                                    : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <UserCircle2 className="w-5 h-5" />
                            Petugas
                        </button>
                        <button
                            onClick={() => { setIsAdminMode(true); setError(null); }}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all",
                                isAdminMode
                                    ? "bg-white text-pink-600 shadow-sm"
                                    : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <ShieldCheck className="w-5 h-5" />
                            Admin
                        </button>
                    </div>

                    {/* Form */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-6 space-y-5">
                        {!isAdminMode ? (
                            <>
                                {/* Destination Select */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        Destinasi
                                    </Label>
                                    <Select
                                        value={selectedDestination}
                                        onValueChange={(v) => setValue('destination_id', v)}
                                    >
                                        <SelectTrigger className="w-full h-14 rounded-2xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-100 focus:border-pink-300 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                                                    <MapPin className="w-5 h-5 text-pink-600" />
                                                </div>
                                                <SelectValue placeholder="Pilih lokasi..." className="font-medium" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {destinations.map((d) => (
                                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* User Select */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        Petugas
                                    </Label>
                                    <Select
                                        value={selectedUser}
                                        onValueChange={(v) => setValue('user_id', v)}
                                        disabled={!selectedDestination}
                                    >
                                        <SelectTrigger className="w-full h-14 rounded-2xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-100 focus:border-pink-300 transition-all disabled:opacity-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-pink-600" />
                                                </div>
                                                <SelectValue placeholder={isLoadingUsers ? "Memuat..." : "Pilih nama..."} className="font-medium" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((u) => (
                                                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* PIN Input */}
                                <div className="space-y-3 pt-2">
                                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center block">
                                        Masukkan PIN
                                    </Label>
                                    <PinInput
                                        value={pin}
                                        onChange={(v) => setValue('pin', v)}
                                        disabled={!selectedUser || isSubmitting}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Admin Select */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        Akun Admin
                                    </Label>
                                    <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                                        <SelectTrigger className="w-full h-14 rounded-2xl border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-pink-100 focus:border-pink-300 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                                                    <ShieldCheck className="w-5 h-5 text-pink-600" />
                                                </div>
                                                <SelectValue placeholder="Pilih admin..." className="font-medium" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {adminUsers.map((a) => (
                                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Admin PIN */}
                                <div className="space-y-3 pt-2">
                                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center block">
                                        PIN Admin
                                    </Label>
                                    <PinInput
                                        value={adminPin}
                                        onChange={setAdminPin}
                                        disabled={!selectedAdmin || isSubmitting}
                                    />
                                </div>
                            </>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                                <p className="text-sm text-red-600 text-center font-bold">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            className="w-full h-14 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold text-base shadow-lg shadow-pink-200 transition-all active:scale-[0.98]"
                            onClick={isAdminMode ? handleAdminLogin : handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Masuk"
                            )}
                        </Button>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-gray-400 mt-8">
                        © {new Date().getFullYear()} SITAMMU • v{APP.version}
                    </p>
                </div>
            </div>
        </div>
    )
}
