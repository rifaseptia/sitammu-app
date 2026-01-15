'use client'

import * as React from 'react'
import { Ticket, Hash, Plus, Trash2 } from 'lucide-react'

import { formatRupiah } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import type { Attraction } from '@/types'

// Ticket block entry for attractions
interface AttractionTicketBlock {
    id: string
    block_no: string
    start_no: string
    end_no: string
}

// State for a single attraction's input
export interface AttractionInputData {
    attraction_id: string
    visitor_count: number
    ticket_blocks: AttractionTicketBlock[]
}

interface AttractionInputProps {
    attraction: Attraction
    data: AttractionInputData
    onChange: (data: AttractionInputData) => void
    disabled?: boolean
}

const generateId = () => Math.random().toString(36).substring(2, 9)

const calculateCount = (start: string, end: string): number => {
    const s = parseInt(start) || 0
    const e = parseInt(end) || 0
    return e >= s ? e - s + 1 : 0
}

export function AttractionInput({ attraction, data, onChange, disabled }: AttractionInputProps) {
    const revenue = data.visitor_count * attraction.price

    // For count-only attractions (no ticket block)
    const handleCountChange = (val: number) => {
        onChange({
            ...data,
            visitor_count: val,
        })
    }

    // For ticket block attractions
    const addTicketBlock = () => {
        onChange({
            ...data,
            ticket_blocks: [...data.ticket_blocks, { id: generateId(), block_no: '', start_no: '', end_no: '' }],
        })
    }

    const removeTicketBlock = (id: string) => {
        const newBlocks = data.ticket_blocks.filter(b => b.id !== id)
        const totalCount = newBlocks.reduce((sum, block) => {
            return sum + calculateCount(block.start_no, block.end_no)
        }, 0)
        onChange({
            ...data,
            ticket_blocks: newBlocks,
            visitor_count: totalCount,
        })
    }

    const updateTicketBlock = (id: string, field: keyof AttractionTicketBlock, value: string) => {
        const newBlocks = data.ticket_blocks.map(block => {
            if (block.id === id) {
                return { ...block, [field]: value }
            }
            return block
        })

        // Recalculate total count
        const totalCount = newBlocks.reduce((sum, block) => {
            return sum + calculateCount(block.start_no, block.end_no)
        }, 0)

        onChange({
            ...data,
            ticket_blocks: newBlocks,
            visitor_count: totalCount,
        })
    }

    return (
        <div className="border-2 border-gray-200 rounded-2xl bg-white overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                    {attraction.requires_ticket_block ? (
                        <Ticket className="w-5 h-5 text-pink-600" />
                    ) : (
                        <Hash className="w-5 h-5 text-pink-600" />
                    )}
                    <span className="font-bold text-gray-900">{attraction.name}</span>
                    <Badge variant="outline" className="text-pink-600 border-pink-200">{formatRupiah(attraction.price)}</Badge>
                </div>
                <span className="text-base font-bold text-gray-700">
                    {formatRupiah(revenue)}
                </span>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {attraction.requires_ticket_block ? (
                    // Ticket block input mode
                    <>
                        <div className="space-y-3">
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

                            {data.ticket_blocks.map((block) => (
                                <div key={block.id} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-3">
                                        <Input
                                            value={block.block_no}
                                            onChange={(e) => updateTicketBlock(block.id, 'block_no', e.target.value)}
                                            placeholder="197"
                                            inputMode="numeric"
                                            className="h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-xl placeholder:text-gray-300 placeholder:font-normal"
                                            disabled={disabled}
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <Input
                                            value={block.start_no}
                                            onChange={(e) => updateTicketBlock(block.id, 'start_no', e.target.value)}
                                            placeholder="00001"
                                            inputMode="numeric"
                                            className="h-12 font-mono text-base text-center border-2 border-gray-200 rounded-xl placeholder:text-gray-300"
                                            disabled={disabled}
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <Input
                                            value={block.end_no}
                                            onChange={(e) => updateTicketBlock(block.id, 'end_no', e.target.value)}
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
                                            className="h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                            onClick={() => removeTicketBlock(block.id)}
                                            disabled={disabled || data.ticket_blocks.length <= 1}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addTicketBlock}
                            disabled={disabled}
                            className="w-full h-12 text-base font-bold rounded-xl border-2 border-dashed border-gray-300 text-gray-600 hover:border-pink-300 hover:text-pink-600"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Tambah Blok
                        </Button>
                        <div className="text-center text-base text-gray-600 font-bold">
                            Total: {data.visitor_count} pengunjung
                        </div>
                    </>
                ) : (
                    // Simple count input mode
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-bold">Jumlah</Label>
                        <div className="flex items-center gap-3">
                            <Input
                                type="number"
                                inputMode="numeric"
                                value={data.visitor_count || ''}
                                onChange={(e) => handleCountChange(parseInt(e.target.value) || 0)}
                                className="w-24 h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-xl"
                                disabled={disabled}
                            />
                            <span className="text-base text-gray-500">pengunjung</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// Helper to create empty attraction input data
export function createEmptyAttractionData(attractionId: string): AttractionInputData {
    return {
        attraction_id: attractionId,
        visitor_count: 0,
        ticket_blocks: [{ id: generateId(), block_no: '', start_no: '', end_no: '' }],
    }
}

// Helper to convert to database format
export function attractionDataToDbFormat(data: AttractionInputData, price: number) {
    return {
        attraction_id: data.attraction_id,
        visitor_count: data.visitor_count,
        ticket_blocks: data.ticket_blocks.filter(b => b.start_no && b.end_no).map(b => ({
            block_no: b.block_no,
            start_no: b.start_no,
            end_no: b.end_no,
            count: parseInt(b.end_no) - parseInt(b.start_no) + 1,
        })),
        revenue: data.visitor_count * price,
    }
}

// Helper to convert from database to UI format
export function dbToAttractionData(dbData: any): AttractionInputData {
    return {
        attraction_id: dbData.attraction_id,
        visitor_count: dbData.visitor_count || 0,
        ticket_blocks: dbData.ticket_blocks?.length > 0
            ? dbData.ticket_blocks.map((b: any) => ({
                id: generateId(),
                block_no: b.block_no || '',
                start_no: b.start_no || '',
                end_no: b.end_no || '',
            }))
            : [{ id: generateId(), block_no: '', start_no: '', end_no: '' }],
    }
}
