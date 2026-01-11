import { z } from 'zod'
import { TICKET_PRICES, LIMITS } from './constants'

// ============================================
// SITAMMU - Zod Validation Schemas
// Zod v4 compatible
// ============================================

// ============================================
// Login Schema
// ============================================

export const loginSchema = z.object({
    destination_id: z
        .string()
        .uuid('Destinasi tidak valid'),

    user_id: z
        .string()
        .uuid('Petugas tidak valid'),

    pin: z
        .string()
        .length(LIMITS.minPin, `PIN harus ${LIMITS.minPin} digit`)
        .regex(/^\d+$/, 'PIN harus berupa angka'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// ============================================
// WNA Countries Schema
// ============================================

export const wnaCountryEntrySchema = z.object({
    country_code: z.string().length(2, 'Kode negara tidak valid'),
    count: z.number().int().min(0, 'Jumlah tidak boleh negatif'),
})

export const wnaCountriesSchema = z.record(
    z.string(),
    z.number().int().min(0)
)

// ============================================
// Daily Report Schema
// ============================================

export const dailyReportSchema = z.object({
    // Metadata
    destination_id: z
        .string()
        .uuid('Destinasi tidak valid'),

    report_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),

    // Visitor counts
    anak_count: z
        .number()
        .int('Jumlah harus bilangan bulat')
        .min(0, 'Jumlah tidak boleh negatif')
        .max(LIMITS.maxVisitorsPerDay, 'Jumlah melebihi batas'),

    dewasa_count: z
        .number()
        .int('Jumlah harus bilangan bulat')
        .min(0, 'Jumlah tidak boleh negatif')
        .max(LIMITS.maxVisitorsPerDay, 'Jumlah melebihi batas'),

    wna_count: z
        .number()
        .int('Jumlah harus bilangan bulat')
        .min(0, 'Jumlah tidak boleh negatif')
        .max(LIMITS.maxVisitorsPerDay, 'Jumlah melebihi batas'),

    // Dewasa gender breakdown
    dewasa_male: z
        .number()
        .int('Jumlah harus bilangan bulat')
        .min(0, 'Jumlah tidak boleh negatif'),

    dewasa_female: z
        .number()
        .int('Jumlah harus bilangan bulat')
        .min(0, 'Jumlah tidak boleh negatif'),

    // WNA countries breakdown
    wna_countries: wnaCountriesSchema.default({}),

    // Payment methods
    cash_amount: z
        .number()
        .int('Jumlah harus bilangan bulat')
        .min(0, 'Jumlah tidak boleh negatif'),

    qris_amount: z
        .number()
        .int('Jumlah harus bilangan bulat')
        .min(0, 'Jumlah tidak boleh negatif'),

    // Notes
    notes: z
        .string()
        .max(LIMITS.maxNotesLength, `Catatan maksimal ${LIMITS.maxNotesLength} karakter`)
        .optional()
        .nullable(),
})
    // Custom refinements for business logic validation
    .refine(
        (data) => data.dewasa_male + data.dewasa_female === data.dewasa_count,
        {
            message: 'Jumlah laki-laki + perempuan harus sama dengan total dewasa',
            path: ['dewasa_male'],
        }
    )
    .refine(
        (data) => {
            if (data.wna_count === 0) return true
            const sumCountries = Object.values(data.wna_countries).reduce((a, b) => a + b, 0)
            return sumCountries === data.wna_count
        },
        {
            message: 'Total WNA per negara harus sama dengan jumlah WNA',
            path: ['wna_countries'],
        }
    )
    .refine(
        (data) => {
            const totalRevenue =
                (data.anak_count * TICKET_PRICES.anak) +
                (data.dewasa_count * TICKET_PRICES.dewasa) +
                (data.wna_count * TICKET_PRICES.wna)
            return data.cash_amount + data.qris_amount === totalRevenue
        },
        {
            message: 'Cash + QRIS harus sama dengan total pendapatan',
            path: ['cash_amount'],
        }
    )

export type DailyReportFormData = z.infer<typeof dailyReportSchema>

// ============================================
// Draft Schema (for saving incomplete reports)
// Note: Cannot use .partial() on refined schemas in Zod v4
// ============================================

export const dailyReportDraftSchema = z.object({
    destination_id: z.string().uuid(),
    report_date: z.string(),
    anak_count: z.number().int().min(0).optional(),
    dewasa_count: z.number().int().min(0).optional(),
    wna_count: z.number().int().min(0).optional(),
    dewasa_male: z.number().int().min(0).optional(),
    dewasa_female: z.number().int().min(0).optional(),
    wna_countries: wnaCountriesSchema.optional(),
    cash_amount: z.number().int().min(0).optional(),
    qris_amount: z.number().int().min(0).optional(),
    notes: z.string().max(LIMITS.maxNotesLength).optional().nullable(),
})

export type DailyReportDraftData = z.infer<typeof dailyReportDraftSchema>

// ============================================
// Submit Schema (for koordinator only)
// ============================================

export const submitReportSchema = z.object({
    report_id: z.string().uuid('Report ID tidak valid'),
})

export type SubmitReportData = z.infer<typeof submitReportSchema>

// ============================================
// Helper: Calculate revenue from counts
// ============================================

export function calculateRevenue(data: {
    anak_count: number
    dewasa_count: number
    wna_count: number
}) {
    return {
        anak_revenue: data.anak_count * TICKET_PRICES.anak,
        dewasa_revenue: data.dewasa_count * TICKET_PRICES.dewasa,
        wna_revenue: data.wna_count * TICKET_PRICES.wna,
        total_revenue:
            (data.anak_count * TICKET_PRICES.anak) +
            (data.dewasa_count * TICKET_PRICES.dewasa) +
            (data.wna_count * TICKET_PRICES.wna),
    }
}

// ============================================
// Helper: Get default form values
// ============================================

export function getDefaultReportValues(
    destination_id: string,
    report_date: string
): DailyReportFormData {
    return {
        destination_id,
        report_date,
        anak_count: 0,
        dewasa_count: 0,
        wna_count: 0,
        dewasa_male: 0,
        dewasa_female: 0,
        wna_countries: {},
        cash_amount: 0,
        qris_amount: 0,
        notes: null,
    }
}

// ============================================
// Helper: Validate specific field
// ============================================

export function validateDewasaGender(
    total: number,
    male: number,
    female: number
): { valid: boolean; message?: string } {
    if (male + female !== total) {
        return {
            valid: false,
            message: `Laki-laki (${male}) + Perempuan (${female}) = ${male + female}, tapi total dewasa ${total}`,
        }
    }
    return { valid: true }
}

export function validateWnaCountries(
    total: number,
    countries: Record<string, number>
): { valid: boolean; message?: string } {
    const sum = Object.values(countries).reduce((a, b) => a + b, 0)
    if (sum !== total) {
        return {
            valid: false,
            message: `Total per negara (${sum}) tidak sama dengan jumlah WNA (${total})`,
        }
    }
    return { valid: true }
}

export function validatePayment(
    totalRevenue: number,
    cash: number,
    qris: number
): { valid: boolean; message?: string } {
    if (cash + qris !== totalRevenue) {
        return {
            valid: false,
            message: `Cash (${cash}) + QRIS (${qris}) = ${cash + qris}, tapi total pendapatan ${totalRevenue}`,
        }
    }
    return { valid: true }
}
