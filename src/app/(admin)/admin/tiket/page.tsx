'use client'

import * as React from 'react'
import { Ticket, ArrowUpDown, ArrowUp, ArrowDown, Baby, User, Globe, Star } from 'lucide-react'

import { getTicketUsage, type TicketUsageItem } from '@/actions/admin-tickets'
import { useAuthStore } from '@/lib/stores/auth-store'
import { formatDateShort } from '@/lib/utils'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { PaginationControls, usePagination } from '@/components/pagination-controls'

type SortField = 'block_no' | 'report_date' | 'destination_name'
type SortDirection = 'asc' | 'desc'

export default function AdminTiketPage() {
    const { user } = useAuthStore()
    const [tickets, setTickets] = React.useState<TicketUsageItem[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [sortField, setSortField] = React.useState<SortField>('report_date')
    const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc')

    React.useEffect(() => {
        async function load() {
            if (!user?.id) {
                setIsLoading(false)
                return
            }
            const result = await getTicketUsage(user.id)
            if (result.success && result.data) {
                setTickets(result.data)
            }
            setIsLoading(false)
        }
        load()
    }, [user?.id])

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const sortedTickets = React.useMemo(() => {
        return [...tickets].sort((a, b) => {
            let aVal: string | number = a[sortField]
            let bVal: string | number = b[sortField]

            if (sortField === 'block_no') {
                // Numeric sort for block numbers
                aVal = parseInt(String(aVal)) || 0
                bVal = parseInt(String(bVal)) || 0
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
            return 0
        })
    }, [tickets, sortField, sortDirection])

    // Pagination
    const {
        paginatedItems: paginatedTickets,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        setItemsPerPage,
        totalItems,
    } = usePagination(sortedTickets, 10)

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />
        return sortDirection === 'asc'
            ? <ArrowUp className="w-4 h-4 ml-1" />
            : <ArrowDown className="w-4 h-4 ml-1" />
    }

    const getCategoryStyles = (category: string) => {
        switch (category.toLowerCase()) {
            case 'anak':
                return {
                    color: 'bg-blue-100 text-blue-700 border-blue-200',
                    icon: <Baby className="w-3 h-3 mr-1" />
                }
            case 'dewasa':
                return {
                    color: 'bg-pink-100 text-pink-700 border-pink-200',
                    icon: <User className="w-3 h-3 mr-1" />
                }
            case 'wna':
                return {
                    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
                    icon: <Globe className="w-3 h-3 mr-1" />
                }
            default:
                return {
                    color: 'bg-teal-100 text-teal-700 border-teal-200',
                    icon: <Star className="w-3 h-3 mr-1" />
                }
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
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900">
                    Laporan Penggunaan Tiket
                </h1>
                <p className="text-gray-500 mt-1">
                    Daftar blok tiket yang sudah digunakan
                </p>
            </div>

            {/* Table */}
            <section className="border-2 border-gray-200 rounded-2xl bg-white overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900">Daftar Blok Tiket</h2>
                        <p className="text-sm text-gray-500">{tickets.length} blok ditemukan</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-500">Kategori</th>
                                <th className="px-6 py-4 text-left">
                                    <button
                                        className="flex items-center text-sm font-bold text-gray-500 hover:text-pink-600 transition-colors"
                                        onClick={() => handleSort('block_no')}
                                    >
                                        No. Blok
                                        <SortIcon field="block_no" />
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-500">No. Awal</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-500">No. Akhir</th>
                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-500">Jumlah</th>
                                <th className="px-6 py-4 text-left">
                                    <button
                                        className="flex items-center text-sm font-bold text-gray-500 hover:text-pink-600 transition-colors"
                                        onClick={() => handleSort('report_date')}
                                    >
                                        Tanggal
                                        <SortIcon field="report_date" />
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <button
                                        className="flex items-center text-sm font-bold text-gray-500 hover:text-pink-600 transition-colors"
                                        onClick={() => handleSort('destination_name')}
                                    >
                                        Destinasi
                                        <SortIcon field="destination_name" />
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-gray-400">
                                        Belum ada data penggunaan tiket
                                    </td>
                                </tr>
                            ) : (
                                paginatedTickets.map((ticket) => (
                                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            {(() => {
                                                const styles = getCategoryStyles(ticket.category)
                                                return (
                                                    <Badge className={`${styles.color} font-bold text-[10px] uppercase tracking-wider py-0.5 px-2`}>
                                                        {styles.icon}
                                                        {ticket.category}
                                                    </Badge>
                                                )
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-gray-900">
                                            {ticket.block_no || '-'}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-gray-600">
                                            {ticket.start_no}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-gray-600">
                                            {ticket.end_no}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                                            {ticket.count.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {formatDateShort(ticket.report_date)}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700">
                                            {ticket.destination_name}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="border-t border-gray-100">
                    <PaginationControls
                        currentPage={currentPage}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                    />
                </div>
            </section>
        </div>
    )
}
