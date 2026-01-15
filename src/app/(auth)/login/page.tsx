'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ShieldCheck, UserCircle2, Sparkles } from 'lucide-react'

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
import { AppFooter } from '@/components/app-footer'

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
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
                <div className="w-full max-w-sm space-y-8">

                    {/* Logo & Title */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pink-600 mx-auto">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900">
                            SITAMMU
                        </h1>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex border border-gray-200 rounded-2xl overflow-hidden bg-white">
                        <button
                            onClick={() => { setIsAdminMode(false); setError(null); }}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-3 py-5 text-lg font-bold transition-colors",
                                !isAdminMode
                                    ? "bg-pink-600 text-white"
                                    : "bg-white text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <UserCircle2 className="w-6 h-6" />
                            Petugas
                        </button>
                        <div className="w-px bg-gray-200" />
                        <button
                            onClick={() => { setIsAdminMode(true); setError(null); }}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-3 py-5 text-lg font-bold transition-colors",
                                isAdminMode
                                    ? "bg-pink-600 text-white"
                                    : "bg-white text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <ShieldCheck className="w-6 h-6" />
                            Admin
                        </button>
                    </div>

                    {/* Form */}
                    <div className="space-y-6">
                        {!isAdminMode ? (
                            <>
                                {/* Destination */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                                        Destinasi
                                    </Label>
                                    <Select
                                        value={selectedDestination}
                                        onValueChange={(v) => setValue('destination_id', v)}
                                    >
                                        <SelectTrigger className="w-full h-16 text-lg rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-pink-100 focus:border-pink-400">
                                            <SelectValue placeholder="Pilih destinasi..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {destinations.map((d) => (
                                                <SelectItem key={d.id} value={d.id} className="text-lg py-4">{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* User */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                                        Petugas
                                    </Label>
                                    <Select
                                        value={selectedUser}
                                        onValueChange={(v) => setValue('user_id', v)}
                                        disabled={!selectedDestination}
                                    >
                                        <SelectTrigger className="w-full h-16 text-lg rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-pink-100 focus:border-pink-400 disabled:opacity-50 disabled:bg-gray-50">
                                            <SelectValue placeholder={isLoadingUsers ? "Memuat..." : "Pilih petugas..."} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((u) => (
                                                <SelectItem key={u.id} value={u.id} className="text-lg py-4">{u.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* PIN */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center block">
                                        PIN
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
                                    <Label className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                                        Admin
                                    </Label>
                                    <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                                        <SelectTrigger className="w-full h-16 text-lg rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-pink-100 focus:border-pink-400">
                                            <SelectValue placeholder="Pilih admin..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {adminUsers.map((a) => (
                                                <SelectItem key={a.id} value={a.id} className="text-lg py-4">{a.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Admin PIN */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center block">
                                        PIN
                                    </Label>
                                    <PinInput
                                        value={adminPin}
                                        onChange={setAdminPin}
                                        disabled={!selectedAdmin || isSubmitting}
                                    />
                                </div>
                            </>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="border border-red-200 bg-red-50 rounded-xl p-3">
                                <p className="text-sm text-red-600 text-center font-medium">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Submit */}
                        <Button
                            className="w-full h-12 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold transition-colors"
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
                </div>
            </div>

            {/* Footer */}
            <AppFooter />
        </div>
    )
}
