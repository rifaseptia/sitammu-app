'use client'

import * as React from 'react'

/**
 * Lightweight CSS-based chart components
 * No external library - pure CSS & SVG
 */

// Color palette - senada (harmonious)
export const CHART_COLORS = {
    primary: '#6366f1',    // Indigo
    secondary: '#8b5cf6',  // Violet
    tertiary: '#a78bfa',   // Light Violet
    success: '#10b981',    // Emerald
    warning: '#f59e0b',    // Amber
    info: '#3b82f6',       // Blue
    pink: '#ec4899',       // Pink
    gray: '#94a3b8',       // Slate
}

interface DonutChartProps {
    data: { label: string; value: number; color: string }[]
    size?: number
    strokeWidth?: number
    showLegend?: boolean
    showPercentage?: boolean
    centerLabel?: string
    centerValue?: string
}

export function DonutChart({
    data,
    size = 160,
    strokeWidth = 24,
    showLegend = true,
    showPercentage = true,
    centerLabel,
    centerValue,
}: DonutChartProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius

    let cumulativePercentage = 0

    return (
        <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    {data.map((item, index) => {
                        const percentage = total > 0 ? (item.value / total) * 100 : 0
                        const offset = circumference * (cumulativePercentage / 100)
                        const length = circumference * (percentage / 100)
                        cumulativePercentage += percentage

                        return (
                            <circle
                                key={index}
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                fill="none"
                                stroke={item.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${length} ${circumference - length}`}
                                strokeDashoffset={-offset}
                                className="transition-all duration-500"
                            />
                        )
                    })}
                </svg>
                {(centerLabel || centerValue) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {centerValue && <span className="text-2xl font-bold">{centerValue}</span>}
                        {centerLabel && <span className="text-xs text-gray-500">{centerLabel}</span>}
                    </div>
                )}
            </div>

            {showLegend && (
                <div className="flex flex-col gap-2">
                    {data.map((item, index) => {
                        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
                        return (
                            <div key={index} className="flex items-center gap-2 text-sm">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-gray-600">{item.label}</span>
                                {showPercentage && (
                                    <span className="font-semibold text-gray-800">{percentage}%</span>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

interface BarChartProps {
    data: { label: string; value: number; color?: string }[]
    maxValue?: number
    height?: number
    showValues?: boolean
    formatValue?: (value: number) => string
}

export function HorizontalBarChart({
    data,
    maxValue,
    height = 24,
    showValues = true,
    formatValue = (v) => String(v),
}: BarChartProps) {
    const max = maxValue || Math.max(...data.map((d) => d.value))

    return (
        <div className="space-y-3">
            {data.map((item, index) => {
                const percentage = max > 0 ? (item.value / max) * 100 : 0
                return (
                    <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{item.label}</span>
                            {showValues && (
                                <span className="font-medium text-gray-800">
                                    {formatValue(item.value)}
                                </span>
                            )}
                        </div>
                        <div className="bg-gray-100 rounded-full overflow-hidden" style={{ height }}>
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${percentage}%`,
                                    backgroundColor: item.color || CHART_COLORS.primary,
                                }}
                            />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

interface VerticalBarChartProps {
    data: { label: string; value: number; color?: string }[]
    maxValue?: number
    barWidth?: number
    height?: number
    showValues?: boolean
    formatValue?: (value: number) => string
}

export function VerticalBarChart({
    data,
    maxValue,
    barWidth = 32,
    height = 120,
    showValues = true,
    formatValue = (v) => String(v),
}: VerticalBarChartProps) {
    const max = maxValue || Math.max(...data.map((d) => d.value))

    return (
        <div className="flex items-end justify-around gap-2" style={{ height: height + 40 }}>
            {data.map((item, index) => {
                const percentage = max > 0 ? (item.value / max) * 100 : 0
                const barHeight = (percentage / 100) * height
                return (
                    <div key={index} className="flex flex-col items-center gap-1">
                        {showValues && (
                            <span className="text-xs font-medium text-gray-600">
                                {formatValue(item.value)}
                            </span>
                        )}
                        <div
                            className="rounded-t transition-all duration-500"
                            style={{
                                width: barWidth,
                                height: barHeight,
                                backgroundColor: item.color || CHART_COLORS.primary,
                            }}
                        />
                        <span className="text-xs text-gray-500 mt-1">{item.label}</span>
                    </div>
                )
            })}
        </div>
    )
}

interface ProgressRingProps {
    percentage: number
    size?: number
    strokeWidth?: number
    color?: string
    label?: string
}

export function ProgressRing({
    percentage,
    size = 80,
    strokeWidth = 8,
    color = CHART_COLORS.primary,
    label,
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold">{percentage}%</span>
                {label && <span className="text-[10px] text-gray-500">{label}</span>}
            </div>
        </div>
    )
}
