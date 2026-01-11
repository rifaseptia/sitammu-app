'use client'

import * as React from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface NumberStepperProps {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function NumberStepper({
    value,
    onChange,
    min = 0,
    max = 99999,
    step = 1,
    disabled = false,
    size = 'md',
    className,
}: NumberStepperProps) {
    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleIncrement = () => {
        if (value + step <= max) {
            onChange(value + step)
        }
    }

    const handleDecrement = () => {
        if (value - step >= min) {
            onChange(value - step)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseInt(e.target.value, 10)
        if (!isNaN(newValue) && newValue >= min && newValue <= max) {
            onChange(newValue)
        } else if (e.target.value === '') {
            onChange(min)
        }
    }

    const sizeClasses = {
        sm: {
            button: 'h-11 w-11',
            input: 'h-11 w-20 text-lg',
            icon: 'w-5 h-5',
        },
        md: {
            button: 'h-12 w-12',
            input: 'h-12 w-24 text-xl',
            icon: 'w-6 h-6',
        },
        lg: {
            button: 'h-14 w-14',
            input: 'h-14 w-28 text-2xl',
            icon: 'w-7 h-7',
        },
    }

    const s = sizeClasses[size]

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleDecrement}
                disabled={disabled || value <= min}
                className={cn(s.button, 'rounded-full shrink-0')}
            >
                <Minus className={s.icon} />
            </Button>

            <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                value={value}
                onChange={handleInputChange}
                disabled={disabled}
                min={min}
                max={max}
                className={cn(
                    s.input,
                    'text-center font-semibold rounded-lg border border-gray-300',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                )}
            />

            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleIncrement}
                disabled={disabled || value >= max}
                className={cn(s.button, 'rounded-full shrink-0')}
            >
                <Plus className={s.icon} />
            </Button>
        </div>
    )
}
