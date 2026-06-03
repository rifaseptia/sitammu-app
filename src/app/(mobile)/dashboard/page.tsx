'use client'

import * as React from 'react'
import Link from 'next/link'
import {
    MapPin,
    Calendar,
    Users,
    Banknote,
    PenSquare,
    CheckCircle2,
    Clock,
    CalendarClock,
    AlertCircle,
    UserCircle,
    BarChart3,
    HelpCircle,
    Bell
} from 'lucide-react'

import { useAuthStore } from '@/lib/stores/auth-store'
import { getTodayReportStatus } from '@/actions/reports'
import { formatDate, formatRupiah, getGreeting, cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import type { TodayReportStatus } from '@/types'

export default function DashboardPage() {
    const { user } = useAuthStore()
    const [status, setStatus] = React.useState<TodayReportStatus | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)

    // Load status
    const loadStatus = React.useCallback(async () => {
        if (!user?.destination_id) {
            setIsLoading(false)
            return
        }

        const result = await getTodayReportStatus(user.destination_id)
        if (result.success && result.data) {
            setStatus(result.data)
        }
        setIsLoading(false)
    }, [user?.destination_id])

    // Initial load
    React.useEffect(() => {
        loadStatus()
    }, [loadStatus])

    // Auto-refresh when tab becomes visible
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user?.destination_id) {
                loadStatus()
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [loadStatus, user?.destination_id])

    const today = new Date()

    const getStatusInfo = () => {
        if (!status) return { label: 'Memuat...', className: 'text-gray-400', icon: Clock }

        switch (status.daily_status) {
            case 'submitted':
                return { label: 'Sudah Submit', className: 'text-green-600 font-bold', icon: CheckCircle2 }
            case 'draft':
                const timeStr = status.updated_at ? new Date(status.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''
                return { label: `Draft${timeStr ? ` ${timeStr}` : ''}`, className: 'text-gray-500 italic', icon: Clock }
            default:
                return { label: 'Belum Input', className: 'text-gray-500', icon: AlertCircle }
        }
    }

    const statusInfo = getStatusInfo()

    return (
        <div className="pb-8 space-y-6">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-gray-50/80 backdrop-blur-xl px-5 pt-15 pb-4 relative">
                {/* Logo Aplikasi */}
                <div className="absolute top-4 left-0 right-0 flex justify-center">
                    <span className="text-lg font-black tracking-[0.25em] text-zinc-600 uppercase" style={{ fontFamily: '"Arial Black", "Arial Bold", sans-serif' }}>sitammu</span>
                </div>
                <div className="flex items-center justify-between gap-4 mt-2">
                    <div>
                        <h1 className="text-xl font-bold text-gray-700">
                            {getGreeting()}, {user?.name}
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {user?.destination?.name ?? 'Loading...'} {user?.role === 'koordinator' ? '(Koordinator)' : ''}
                        </p>
                    </div>
                    <button className="w-12 h-12 rounded-2xl border border-gray-100 bg-white flex items-center justify-center relative shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-[0.95] transition-all shrink-0">
                        <Bell className="w-6 h-6 text-gray-700" strokeWidth={2} />
                        <span className="absolute top-3 right-3 w-2 h-2 bg-lime-500 rounded-full border border-white" />
                    </button>
                </div>
            </header>

            <div className="px-5 space-y-8">
                {/* Today's Status Card */}
                <section className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                    {/* Card Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50/80">
                        <div className="flex items-center gap-2 text-gray-800">
                            <span className="text-base font-bold">{formatDate(today)}</span>
                        </div>
                        <div className={cn("flex items-center text-sm font-medium", statusInfo.className)}>
                            <statusInfo.icon className="w-4 h-4 mr-1 shrink-0" />
                            {statusInfo.label}
                        </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5">
                        {isLoading ? (
                            <div className="animate-pulse space-y-4">
                                <div className="h-8 bg-gray-100 rounded-xl w-1/2" />
                                <div className="h-14 bg-gray-100 rounded-xl" />
                            </div>
                        ) : status?.daily_status === 'pending' ? (
                            <div className="space-y-5">
                                <div className="text-center py-4">
                                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-xl font-bold text-gray-900">Belum ada laporan</p>
                                    <p className="text-base text-gray-500">Hari ini</p>
                                </div>
                                <Link href="/input">
                                    <Button className="w-full h-14 text-lg font-bold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white">
                                        <PenSquare className="w-5 h-5 mr-2" />
                                        Input Rekap Sekarang
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {/* Summary List */}
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between px-2 pb-3 mb-2 border-b border-gray-100">
                                        <span className="text-lg font-bold text-gray-900">Total Hari Ini</span>
                                        <span className="font-bold text-gray-900 text-lg">{formatRupiah(status?.total_revenue ?? 0, { compact: true })}</span>
                                    </div>

                                    {/* Anak-anak */}
                                    <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-2xl transition-colors">
                                        <div>
                                            <p className="font-bold text-gray-900 text-lg">Anak-anak</p>
                                            <p className="text-sm text-gray-500 font-medium">{status?.anak_count ?? 0} pengunjung</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 text-lg">{formatRupiah(status?.anak_revenue ?? 0, { compact: true })}</p>
                                        </div>
                                    </div>

                                    <div className="border-b border-gray-100 mx-2 my-1" />

                                    {/* Dewasa */}
                                    <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-2xl transition-colors">
                                        <div>
                                            <p className="font-bold text-gray-900 text-lg">Dewasa</p>
                                            <p className="text-sm text-gray-500 font-medium">{status?.dewasa_count ?? 0} pengunjung</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 text-lg">{formatRupiah(status?.dewasa_revenue ?? 0, { compact: true })}</p>
                                        </div>
                                    </div>

                                    <div className="border-b border-gray-100 mx-2 my-1" />

                                    {/* Mancanegara */}
                                    <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-2xl transition-colors">
                                        <div>
                                            <p className="font-bold text-gray-900 text-lg">Mancanegara</p>
                                            <p className="text-sm text-gray-500 font-medium">{status?.wna_count ?? 0} pengunjung</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 text-lg">{formatRupiah(status?.wna_revenue ?? 0, { compact: true })}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <Link href={status?.daily_status === 'draft' ? '/input' : '/laporan'}>
                                    <Button className="w-full h-14 text-lg font-bold rounded-4xl bg-zinc-900 hover:bg-zinc-800 text-white ">
                                        {status?.daily_status === 'draft' ? (
                                            <>
                                                Lanjutkan Input
                                            </>
                                        ) : (
                                            <>
                                                Lihat Laporan
                                            </>
                                        )}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* Quick Actions */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-600 px-1">Menu Cepat</h2>
                    <div className="grid grid-cols-4 gap-2">
                        <Link href="/input">
                            <div className="bg-white rounded-2xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.03)] active:scale-[0.96] transition-all h-full">
                                <div className="flex flex-col items-center gap-2 text-center h-full justify-between">
                                    <div className="w-12 h-12 bg-transparent flex items-center justify-center">
                                        <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
                                            <path opacity="0.5" d="M3 10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H13C16.7712 2 18.6569 2 19.8284 3.17157C21 4.34315 21 6.22876 21 10V14C21 17.7712 21 19.6569 19.8284 20.8284C18.6569 22 16.7712 22 13 22H11C7.22876 22 5.34315 22 4.17157 20.8284C3 19.6569 3 17.7712 3 14V10Z" fill="#1C274C"></path>
                                            <path d="M16.5189 16.5013C16.6939 16.3648 16.8526 16.2061 17.1701 15.8886L21.1275 11.9312C21.2231 11.8356 21.1793 11.6708 21.0515 11.6264C20.5844 11.4644 19.9767 11.1601 19.4083 10.5917C18.8399 10.0233 18.5356 9.41561 18.3736 8.94849C18.3292 8.82066 18.1644 8.77687 18.0688 8.87254L14.1114 12.8299C13.7939 13.1474 13.6352 13.3061 13.4987 13.4811C13.3377 13.6876 13.1996 13.9109 13.087 14.1473C12.9915 14.3476 12.9205 14.5606 12.7786 14.9865L12.5951 15.5368L12.3034 16.4118L12.0299 17.2323C11.9601 17.4419 12.0146 17.6729 12.1708 17.8292C12.3271 17.9854 12.5581 18.0399 12.7677 17.9701L13.5882 17.6966L14.4632 17.4049L15.0135 17.2214L15.0136 17.2214C15.4394 17.0795 15.6524 17.0085 15.8527 16.913C16.0891 16.8004 16.3124 16.6623 16.5189 16.5013Z" fill="#1C274C"></path>
                                            <path d="M22.3665 10.6922C23.2112 9.84754 23.2112 8.47812 22.3665 7.63348C21.5219 6.78884 20.1525 6.78884 19.3078 7.63348L19.1806 7.76071C19.0578 7.88348 19.0022 8.05496 19.0329 8.22586C19.0522 8.33336 19.0879 8.49053 19.153 8.67807C19.2831 9.05314 19.5288 9.54549 19.9917 10.0083C20.4545 10.4712 20.9469 10.7169 21.3219 10.847C21.5095 10.9121 21.6666 10.9478 21.7741 10.9671C21.945 10.9978 22.1165 10.9422 22.2393 10.8194L22.3665 10.6922Z" fill="#1C274C"></path>
                                            <path fillRule="evenodd" clipRule="evenodd" d="M7.25 9C7.25 8.58579 7.58579 8.25 8 8.25H14.5C14.9142 8.25 15.25 8.58579 15.25 9C15.25 9.41421 14.9142 9.75 14.5 9.75H8C7.58579 9.75 7.25 9.41421 7.25 9ZM7.25 13C7.25 12.5858 7.58579 12.25 8 12.25H11C11.4142 12.25 11.75 12.5858 11.75 13C11.75 13.4142 11.4142 13.75 11 13.75H8C7.58579 13.75 7.25 13.4142 7.25 13ZM7.25 17C7.25 16.5858 7.58579 16.25 8 16.25H9.5C9.91421 16.25 10.25 16.5858 10.25 17C10.25 17.4142 9.91421 17.75 9.5 17.75H8C7.58579 17.75 7.25 17.4142 7.25 17Z" fill="#1C274C"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-600 text-xs">Input</p>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link href="/riwayat">
                            <div className="bg-white rounded-2xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.03)] active:scale-[0.96] transition-all h-full">
                                <div className="flex flex-col items-center gap-2 text-center h-full justify-between">
                                    <div className="w-12 h-12 bg-transparent flex items-center justify-center">
                                        <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6.96006 2C7.37758 2 7.71605 2.30996 7.71605 2.69231V4.08883C8.38663 4.07692 9.13829 4.07692 9.98402 4.07692H14.016C14.8617 4.07692 15.6134 4.07692 16.284 4.08883V2.69231C16.284 2.30996 16.6224 2 17.0399 2C17.4575 2 17.7959 2.30996 17.7959 2.69231V4.15008C19.2468 4.25647 20.1992 4.51758 20.899 5.15838C21.5987 5.79917 21.8838 6.67139 22 8V9H2V8C2.11618 6.67139 2.4013 5.79917 3.10104 5.15838C3.80079 4.51758 4.75323 4.25647 6.20406 4.15008V2.69231C6.20406 2.30996 6.54253 2 6.96006 2Z" fill="#1C274C"></path>
                                            <path opacity="0.5" d="M22 14V12C22 11.161 21.9873 9.66527 21.9744 9H2.00586C1.99296 9.66527 2.00564 11.161 2.00564 12V14C2.00564 17.7712 2.00564 19.6569 3.17688 20.8284C4.34813 22 6.23321 22 10.0034 22H14.0023C17.7724 22 19.6575 22 20.8288 20.8284C22 19.6569 22 17.7712 22 14Z" fill="#1C274C"></path>
                                            <path fillRule="evenodd" clipRule="evenodd" d="M18.75 16.5C17.5074 16.5 16.5 17.5074 16.5 18.75C16.5 19.9926 17.5074 21 18.75 21C19.9926 21 21 19.9926 21 18.75C21 17.5074 19.9926 16.5 18.75 16.5ZM15 18.75C15 16.6789 16.6789 15 18.75 15C20.8211 15 22.5 16.6789 22.5 18.75C22.5 19.5143 22.2713 20.2252 21.8787 20.818L23.2803 22.2197C23.5732 22.5126 23.5732 22.9874 23.2803 23.2803C22.9874 23.5732 22.5126 23.5732 22.2197 23.2803L20.818 21.8787C20.2252 22.2713 19.5143 22.5 18.75 22.5C16.6789 22.5 15 20.8211 15 18.75Z" fill="#1C274C"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-600 text-xs">Riwayat</p>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link href="/bantuan">
                            <div className="bg-white rounded-2xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.03)] active:scale-[0.96] transition-all h-full">
                                <div className="flex flex-col items-center gap-2 text-center h-full justify-between">
                                    <div className="w-12 h-12 bg-transparent flex items-center justify-center">
                                        <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
                                            <path opacity="0.5" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" fill="#1C274C"></path>
                                            <path d="M12 7.75C11.3787 7.75 10.875 8.25368 10.875 8.875C10.875 9.28921 10.5392 9.625 10.125 9.625C9.71079 9.625 9.375 9.28921 9.375 8.875C9.375 7.42525 10.5503 6.25 12 6.25C13.4497 6.25 14.625 7.42525 14.625 8.875C14.625 9.58584 14.3415 10.232 13.883 10.704C13.7907 10.7989 13.7027 10.8869 13.6187 10.9708C13.4029 11.1864 13.2138 11.3753 13.0479 11.5885C12.8289 11.8699 12.75 12.0768 12.75 12.25V13C12.75 13.4142 12.4142 13.75 12 13.75C11.5858 13.75 11.25 13.4142 11.25 13V12.25C11.25 11.5948 11.555 11.0644 11.8642 10.6672C12.0929 10.3733 12.3804 10.0863 12.6138 9.85346C12.6842 9.78321 12.7496 9.71789 12.807 9.65877C13.0046 9.45543 13.125 9.18004 13.125 8.875C13.125 8.25368 12.6213 7.75 12 7.75Z" fill="#1C274C"></path>
                                            <path d="M12 17C12.5523 17 13 16.5523 13 16C13 15.4477 12.5523 15 12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17Z" fill="#1C274C"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-600 text-xs">Bantuan</p>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <div className="bg-white/60 rounded-2xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.02)] opacity-60 h-full">
                            <div className="flex flex-col items-center gap-2 text-center h-full justify-between">
                                <div className="w-12 h-12 bg-transparent flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="6" r="4" fill="#1C274C"></circle>
                                        <path opacity="0.5" d="M20 17.5C20 19.9853 20 22 12 22C4 22 4 19.9853 4 17.5C4 15.0147 7.58172 13 12 13C16.4183 13 20 15.0147 20 17.5Z" fill="#1C274C"></path>
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-bold text-zinc-600 text-xs">Profil</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
