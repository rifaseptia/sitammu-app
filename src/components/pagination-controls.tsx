'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface PaginationControlsProps {
    currentPage: number
    totalItems: number
    itemsPerPage: number
    onPageChange: (page: number) => void
    onItemsPerPageChange: (count: number) => void
    itemsPerPageOptions?: number[]
}

export function PaginationControls({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    itemsPerPageOptions = [5, 10, 20],
}: PaginationControlsProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                    Tampilkan
                </span>
                <Select
                    value={String(itemsPerPage)}
                    onValueChange={(val) => {
                        onItemsPerPageChange(Number(val))
                        onPageChange(1) // Reset to first page
                    }}
                >
                    <SelectTrigger className="w-[70px] h-8">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {itemsPerPageOptions.map((option) => (
                            <SelectItem key={option} value={String(option)}>
                                {option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">
                    data per halaman
                </span>
            </div>

            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                    {totalItems > 0
                        ? `${startItem}-${endItem} dari ${totalItems}`
                        : '0 data'}
                </span>
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-700 min-w-[80px] text-center">
                        {totalPages > 0 ? `Hal ${currentPage} / ${totalPages}` : '-'}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

// Helper hook for pagination
export function usePagination<T>(items: T[], defaultPerPage: number = 10) {
    const [currentPage, setCurrentPage] = React.useState(1)
    const [itemsPerPage, setItemsPerPage] = React.useState(defaultPerPage)

    const paginatedItems = React.useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return items.slice(start, start + itemsPerPage)
    }, [items, currentPage, itemsPerPage])

    // Reset to page 1 when items change (e.g., filter applied)
    React.useEffect(() => {
        setCurrentPage(1)
    }, [items.length])

    return {
        paginatedItems,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        setItemsPerPage,
        totalItems: items.length,
    }
}
