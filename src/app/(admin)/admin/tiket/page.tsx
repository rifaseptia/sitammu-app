'use client'

import * as React from 'react'
import { Ticket, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

import { getTicketUsage, type TicketUsageItem } from '@/actions/admin-tickets'
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

type SortField = 'block_no' | 'report_date' | 'destination_name'
type SortDirection = 'asc' | 'desc'

export default function AdminTiketPage() {
    const [tickets, setTickets] = React.useState<TicketUsageItem[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [sortField, setSortField] = React.useState<SortField>('report_date')
    const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc')

    React.useEffect(() => {
        async function load() {
            const result = await getTicketUsage()
            if (result.success && result.data) {
                setTickets(result.data)
            }
            setIsLoading(false)
        }
        load()
    }, [])

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

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />
        return sortDirection === 'asc'
            ? <ArrowUp className="w-4 h-4 ml-1" />
            : <ArrowDown className="w-4 h-4 ml-1" />
    }

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'anak': return 'bg-blue-100 text-blue-700'
            case 'dewasa': return 'bg-green-100 text-green-700'
            case 'wna': return 'bg-purple-100 text-purple-700'
            default: return 'bg-gray-100 text-gray-700'
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Ticket className="w-7 h-7 text-pink-600" />
                        Laporan Penggunaan Tiket
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Daftar blok tiket yang sudah digunakan
                    </p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                    {tickets.length} Blok
                </Badge>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="w-[80px]">Kategori</TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        className="p-0 h-auto font-semibold hover:bg-transparent"
                                        onClick={() => handleSort('block_no')}
                                    >
                                        No. Blok
                                        <SortIcon field="block_no" />
                                    </Button>
                                </TableHead>
                                <TableHead>No. Awal</TableHead>
                                <TableHead>No. Akhir</TableHead>
                                <TableHead className="text-right">Jumlah</TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        className="p-0 h-auto font-semibold hover:bg-transparent"
                                        onClick={() => handleSort('report_date')}
                                    >
                                        Tanggal
                                        <SortIcon field="report_date" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button
                                        variant="ghost"
                                        className="p-0 h-auto font-semibold hover:bg-transparent"
                                        onClick={() => handleSort('destination_name')}
                                    >
                                        Destinasi
                                        <SortIcon field="destination_name" />
                                    </Button>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedTickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                                        Belum ada data penggunaan tiket
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedTickets.map((ticket) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell>
                                            <Badge className={getCategoryColor(ticket.category)}>
                                                {ticket.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono font-semibold">
                                            {ticket.block_no || '-'}
                                        </TableCell>
                                        <TableCell className="font-mono">
                                            {ticket.start_no}
                                        </TableCell>
                                        <TableCell className="font-mono">
                                            {ticket.end_no}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {ticket.count.toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell>
                                            {formatDateShort(ticket.report_date)}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {ticket.destination_name}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
