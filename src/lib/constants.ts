// ============================================
// SITAMMU - Constants & Configuration
// ============================================

/**
 * App Identity
 */
export const APP = {
    name: 'SITAMMU',
    fullName: 'Sistem Informasi Tamu Destinasi Wisata',
    tagline: 'Kelola Tamu-mu, Kelola Data-mu',
    version: '1.0.0',
} as const

/**
 * Harga Tiket per Kategori
 */
export const TICKET_PRICES = {
    anak: 5000,
    dewasa: 15000,
    wna: 50000,
} as const

/**
 * Konfigurasi Tiket dengan Metadata
 */
export const TICKET_CONFIG = {
    anak: {
        label: 'Anak-anak',
        price: TICKET_PRICES.anak,
        requiresGender: true,
        requiresCountry: false,
    },
    dewasa: {
        label: 'Dewasa',
        price: TICKET_PRICES.dewasa,
        requiresGender: true,
        requiresCountry: false,
    },
    wna: {
        label: 'WNA',
        price: TICKET_PRICES.wna,
        requiresGender: false,
        requiresCountry: true,
    },
} as const

/**
 * Role Pengguna
 */
export const ROLES = {
    petugas: {
        label: 'Petugas',
        canInput: true,
        canSubmit: false,
        canGeneratePdf: false,
        canShareWa: false,
    },
    koordinator: {
        label: 'Koordinator',
        canInput: true,
        canSubmit: true,
        canGeneratePdf: true,
        canShareWa: true,
    },
    admin: {
        label: 'Admin',
        canInput: false,
        canSubmit: false,
        canGeneratePdf: true,
        canShareWa: true,
    },
} as const

export type Role = keyof typeof ROLES

/**
 * Status Laporan
 */
export const REPORT_STATUS = {
    draft: {
        label: 'Draft',
        color: 'bg-yellow-100 text-yellow-800',
        icon: '📝',
    },
    submitted: {
        label: 'Submitted',
        color: 'bg-green-100 text-green-800',
        icon: '✅',
    },
} as const

export type ReportStatus = keyof typeof REPORT_STATUS

/**
 * Metode Pembayaran
 */
export const PAYMENT_METHODS = {
    cash: {
        label: 'Cash',
        icon: '💵',
    },
    qris: {
        label: 'QRIS',
        icon: '📱',
    },
} as const

/**
 * Jam Operasional
 */
export const OPERATING_HOURS = {
    open: '08:00',
    close: '19:00',
    inputTime: '18:30', // Waktu rekap harian
} as const

/**
 * Negara Populer untuk WNA (ditampilkan di quick select)
 */
export const POPULAR_COUNTRIES = [
    { code: 'MY', name: 'Malaysia' },
    { code: 'SG', name: 'Singapura' },
    { code: 'CN', name: 'Tiongkok' },
    { code: 'JP', name: 'Jepang' },
    { code: 'KR', name: 'Korea Selatan' },
    { code: 'AU', name: 'Australia' },
    { code: 'US', name: 'Amerika Serikat' },
    { code: 'GB', name: 'Inggris' },
    { code: 'NL', name: 'Belanda' },
    { code: 'DE', name: 'Jerman' },
] as const

/**
 * Validation Limits
 */
export const LIMITS = {
    minPin: 6,
    maxPin: 6,
    maxVisitorsPerDay: 10000,
    maxNotesLength: 500,
} as const
