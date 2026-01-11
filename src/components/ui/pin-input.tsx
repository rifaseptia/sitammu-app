'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface PinInputProps {
    length?: number
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    error?: boolean
    className?: string
}

export function PinInput({
    length = 6,
    value,
    onChange,
    disabled = false,
    error = false,
    className,
}: PinInputProps) {
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

    const handleChange = (index: number, char: string) => {
        if (!/^\d*$/.test(char)) return // Only allow digits

        const newValue = value.split('')
        newValue[index] = char
        const result = newValue.join('').slice(0, length)
        onChange(result)

        // Move to next input
        if (char && index < length - 1) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!value[index] && index > 0) {
                // Move to previous input on backspace if current is empty
                inputRefs.current[index - 1]?.focus()
                const newValue = value.split('')
                newValue[index - 1] = ''
                onChange(newValue.join(''))
            } else {
                const newValue = value.split('')
                newValue[index] = ''
                onChange(newValue.join(''))
            }
            e.preventDefault()
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus()
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
        onChange(pastedData)

        const focusIndex = Math.min(pastedData.length, length - 1)
        inputRefs.current[focusIndex]?.focus()
    }

    return (
        <div className={cn('flex gap-2 justify-center', className)}>
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[index] || ''}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className={cn(
                        'w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-gray-50 text-black placeholder:text-gray-300',
                        'focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500',
                        'transition-all duration-200',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        error
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300',
                    )}
                    aria-label={`PIN digit ${index + 1}`}
                />
            ))}
        </div>
    )
}
