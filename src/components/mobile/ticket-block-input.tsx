'use client'

import * as React from 'react'
import { Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TicketBlockEntry {
    id: string
    block_no: string
    start_no: string
    end_no: string
}

export interface TicketBlockData {
    anak: TicketBlockEntry[]
    dewasa: TicketBlockEntry[]
    wna: TicketBlockEntry[]
}

interface TicketBlockInputProps {
    value: TicketBlockData
    onChange: (data: TicketBlockData) => void
    expectedCounts: {
        anak: number
        dewasa: number
        wna: number
    }
    disabled?: boolean
    alwaysShow?: boolean
}

/**
 * Calculate count from ticket range (end - start + 1)
 */
export function calculateCount(start: string, end: string): number {
    const startNum = parseInt(start, 10)
    const endNum = parseInt(end, 10)
    if (isNaN(startNum) || isNaN(endNum)) return 0
    if (endNum < startNum) return 0
    return endNum - startNum + 1
}

function generateId(): string {
    return `block_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
}

export function TicketBlockInput({
    value,
    onChange,
    expectedCounts,
    disabled = false,
    alwaysShow = false,
}: TicketBlockInputProps) {
    const addBlock = (category: 'anak' | 'dewasa' | 'wna') => {
        const newBlock: TicketBlockEntry = {
            id: generateId(),
            block_no: '',
            start_no: '',
            end_no: '',
        }
        onChange({
            ...value,
            [category]: [...value[category], newBlock],
        })
    }

    const removeBlock = (category: 'anak' | 'dewasa' | 'wna', id: string) => {
        onChange({
            ...value,
            [category]: value[category].filter(b => b.id !== id),
        })
    }

    const updateBlock = (
        category: 'anak' | 'dewasa' | 'wna',
        id: string,
        field: 'block_no' | 'start_no' | 'end_no',
        newValue: string
    ) => {
        onChange({
            ...value,
            [category]: value[category].map(b =>
                b.id === id ? { ...b, [field]: newValue } : b
            ),
        })
    }

    const categories = [
        { key: 'anak' as const, label: 'Anak' },
        { key: 'dewasa' as const, label: 'Dewasa' },
        { key: 'wna' as const, label: 'WNA' },
    ]

    return (
        <div className="space-y-4">
            {categories.map(({ key, label }) => {
                const blocks = value[key]
                const totalCount = blocks.reduce(
                    (sum, b) => sum + calculateCount(b.start_no, b.end_no),
                    0
                )
                const expected = expectedCounts[key]
                const isMatch = totalCount === expected
                const hasBlocks = blocks.length > 0 && blocks.some(b => b.start_no && b.end_no)

                // Check if any block has content (user is typing)
                const hasInput = blocks.some(b => b.block_no || b.start_no || b.end_no)

                // Skip if no expected count AND no input AND not forced to show
                if (!alwaysShow && expected === 0 && !hasInput) return null

                return (
                    <div key={key} className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white">
                        {/* Header */}
                        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-gray-50">
                            <span className="text-gray-900 font-bold text-lg">
                                Tiket {label}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    'px-3 py-1 rounded-full text-sm font-bold border',
                                    hasBlocks && isMatch && 'bg-green-50 text-green-600 border-green-200',
                                    hasBlocks && !isMatch && 'bg-red-50 text-red-600 border-red-200',
                                    !hasBlocks && 'bg-gray-100 text-gray-500 border-gray-200'
                                )}>
                                    {totalCount} / {expected}
                                </span>
                                {hasBlocks && (
                                    isMatch ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                    )
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-3">
                            {/* Labels */}
                            <div className="grid grid-cols-12 gap-2 px-1">
                                <div className="col-span-3">
                                    <Label className="text-sm font-bold text-gray-500">Blok</Label>
                                </div>
                                <div className="col-span-4">
                                    <Label className="text-sm font-bold text-gray-500">Awal</Label>
                                </div>
                                <div className="col-span-4">
                                    <Label className="text-sm font-bold text-gray-500">Akhir</Label>
                                </div>
                                <div className="col-span-1"></div>
                            </div>

                            {/* Block Entries */}
                            {blocks.map((block) => (
                                <div key={block.id} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-3">
                                        <Input
                                            value={block.block_no}
                                            onChange={(e) => updateBlock(key, block.id, 'block_no', e.target.value)}
                                            placeholder="197"
                                            inputMode="numeric"
                                            className="h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-xl placeholder:text-gray-300 placeholder:font-normal"
                                            disabled={disabled}
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <Input
                                            value={block.start_no}
                                            onChange={(e) => updateBlock(key, block.id, 'start_no', e.target.value)}
                                            placeholder="00001"
                                            inputMode="numeric"
                                            className="h-12 font-mono text-base text-center border-2 border-gray-200 rounded-xl placeholder:text-gray-300"
                                            disabled={disabled}
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <Input
                                            value={block.end_no}
                                            onChange={(e) => updateBlock(key, block.id, 'end_no', e.target.value)}
                                            placeholder="00100"
                                            inputMode="numeric"
                                            className="h-12 font-mono text-base text-center border-2 border-gray-200 rounded-xl placeholder:text-gray-300"
                                            disabled={disabled}
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeBlock(key, block.id)}
                                            disabled={disabled || blocks.length <= 1}
                                            className="h-10 w-10 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {/* Count display */}
                            {hasBlocks && (
                                <div className="text-center py-2 text-gray-600 font-bold">
                                    Total: {totalCount} tiket
                                </div>
                            )}

                            {/* Add Block Button */}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => addBlock(key)}
                                disabled={disabled}
                                className="w-full h-12 text-base font-bold rounded-xl border-2 border-dashed border-gray-300 text-gray-600 hover:border-pink-300 hover:text-pink-600"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Tambah Blok
                            </Button>

                            {/* Validation Message */}
                            {hasBlocks && !isMatch && (
                                <p className="text-sm text-red-600 text-center font-medium flex items-center justify-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    Total ({totalCount}) tidak sama dengan Jumlah {label} ({expected})
                                </p>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

/**
 * Helper to create empty ticket block data with one empty block per category
 */
export function createEmptyTicketBlockData(): TicketBlockData {
    return {
        anak: [{ id: generateId(), block_no: '', start_no: '', end_no: '' }],
        dewasa: [{ id: generateId(), block_no: '', start_no: '', end_no: '' }],
        wna: [{ id: generateId(), block_no: '', start_no: '', end_no: '' }],
    }
}

/**
 * Convert TicketBlockData to array format for database storage
 */
export function ticketBlockDataToArray(data: TicketBlockData) {
    const result = []

    for (const category of ['anak', 'dewasa', 'wna'] as const) {
        for (const block of data[category]) {
            if (block.start_no && block.end_no) {
                const count = calculateCount(block.start_no, block.end_no)
                result.push({
                    category,
                    block_no: block.block_no,
                    start_no: block.start_no,
                    end_no: block.end_no,
                    count,
                })
            }
        }
    }

    return result
}

/**
 * Convert database array format back to TicketBlockData for UI
 */
export function arrayToTicketBlockData(data: any[]): TicketBlockData {
    const result = createEmptyTicketBlockData()

    if (!Array.isArray(data) || data.length === 0) return result

    // Group by category
    const grouped: Record<string, any[]> = {
        anak: [],
        dewasa: [],
        wna: []
    }

    data.forEach(item => {
        if (item.category && grouped[item.category]) {
            grouped[item.category].push(item)
        }
    })

    // Update result with loaded data
    for (const category of ['anak', 'dewasa', 'wna'] as const) {
        if (grouped[category].length > 0) {
            result[category] = grouped[category].map(item => ({
                id: generateId(), // Generate new ID for UI handling
                block_no: item.block_no || '',
                start_no: item.start_no || '',
                end_no: item.end_no || '',
            }))
        }
    }

    return result
}
