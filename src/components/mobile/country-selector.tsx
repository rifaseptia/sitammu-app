'use client'

import * as React from 'react'
import { Plus, Minus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { POPULAR_COUNTRIES } from '@/lib/constants'

interface CountrySelectorProps {
    value: Record<string, number>
    onChange: (value: Record<string, number>) => void
    totalRequired: number
    disabled?: boolean
    className?: string
}

export function CountrySelector({
    value,
    onChange,
    totalRequired,
    disabled = false,
    className,
}: CountrySelectorProps) {
    const currentTotal = Object.values(value).reduce((a, b) => a + b, 0)
    const remaining = totalRequired - currentTotal

    const handleIncrement = (code: string) => {
        if (remaining <= 0) return
        onChange({
            ...value,
            [code]: (value[code] || 0) + 1,
        })
    }

    const handleDecrement = (code: string) => {
        if (!value[code] || value[code] <= 0) return
        const newValue = { ...value }
        newValue[code] = value[code] - 1
        if (newValue[code] === 0) {
            delete newValue[code]
        }
        onChange(newValue)
    }

    const handleQuickAdd = (code: string, amount: number) => {
        if (remaining < amount) return
        onChange({
            ...value,
            [code]: (value[code] || 0) + amount,
        })
    }

    const handleClear = (code: string) => {
        const newValue = { ...value }
        delete newValue[code]
        onChange(newValue)
    }

    // Get active countries (with count > 0)
    const activeCountries = Object.entries(value).filter(([_, count]) => count > 0)

    return (
        <div className={cn('space-y-4', className)}>
            {/* Status indicator */}
            <div className={cn(
                'p-3 rounded-lg text-sm font-medium',
                remaining === 0
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            )}>
                {remaining === 0 ? (
                    <span>Total WNA sudah sesuai ({totalRequired} orang)</span>
                ) : remaining > 0 ? (
                    <span>Sisa {remaining} WNA belum diassign ke negara</span>
                ) : (
                    <span>Total melebihi jumlah WNA ({Math.abs(remaining)} lebih)</span>
                )}
            </div>

            {/* Active countries */}
            {activeCountries.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm text-gray-600 font-medium">Dipilih:</p>
                    <div className="space-y-2">
                        {activeCountries.map(([code, count]) => {
                            const country = POPULAR_COUNTRIES.find(c => c.code === code) || {
                                code,
                                name: code,
                            }
                            return (
                                <div
                                    key={code}
                                    className="flex items-center justify-between bg-blue-50 rounded-lg p-2"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900">{country.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDecrement(code)}
                                            disabled={disabled}
                                            className="h-8 w-8"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </Button>
                                        <span className="w-8 text-center font-bold text-blue-700">
                                            {count}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleIncrement(code)}
                                            disabled={disabled || remaining <= 0}
                                            className="h-8 w-8"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleClear(code)}
                                            disabled={disabled}
                                            className="h-8 w-8 text-red-500 hover:text-red-700"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Country grid */}
            {remaining > 0 && (
                <div className="space-y-2">
                    <p className="text-sm text-gray-600 font-medium">Pilih negara:</p>
                    <div className="grid grid-cols-2 gap-2">
                        {POPULAR_COUNTRIES.map((country) => {
                            const isActive = !!value[country.code]
                            return (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => handleIncrement(country.code)}
                                    disabled={disabled || remaining <= 0}
                                    className={cn(
                                        'flex items-center gap-2 p-3 rounded-lg border transition-all',
                                        'text-left text-sm',
                                        isActive
                                            ? 'bg-blue-50 border-blue-300'
                                            : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50',
                                        'disabled:opacity-50 disabled:cursor-not-allowed'
                                    )}
                                >
                                    <span className="font-semibold truncate">{country.name}</span>
                                    {isActive && (
                                        <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                                            {value[country.code]}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
