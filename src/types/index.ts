// ============================================
// SITAMMU - TypeScript Type Definitions
// Generated from database schema
// ============================================

// ============================================
// Enums & Constants Types
// ============================================

export type Role = 'petugas' | 'koordinator' | 'admin'
export type ReportStatus = 'draft' | 'submitted'
export type PaymentMethod = 'cash' | 'qris'
export type TicketCategory = 'anak' | 'dewasa' | 'wna'

// ============================================
// Database Row Types
// ============================================

/**
 * Destinasi Wisata
 */
export interface Destination {
    id: string
    code: string
    name: string
    location: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

/**
 * Pengguna Aplikasi
 */
export interface User {
    id: string
    destination_id: string | null
    name: string
    pin_hash: string
    role: Role
    is_active: boolean
    last_login_at: string | null
    created_at: string
    updated_at: string
}

/**
 * User dengan relasi destination
 */
export interface UserWithDestination extends User {
    destination: Destination | null
}

/**
 * Negara untuk WNA
 */
export interface Country {
    code: string
    name: string
    flag_emoji: string | null
    is_popular: boolean
    sort_order: number
    created_at: string
}

/**
 * WNA Countries breakdown (JSONB)
 * Key: country code, Value: count
 */
export type WnaCountries = Record<string, number>

/**
 * Laporan Harian
 */
export interface DailyReport {
    id: string
    destination_id: string
    report_date: string // YYYY-MM-DD

    // Visitor counts
    anak_count: number
    dewasa_count: number
    wna_count: number

    // Dewasa gender breakdown
    dewasa_male: number
    dewasa_female: number

    // Anak gender breakdown
    anak_male: number
    anak_female: number

    // WNA countries breakdown
    wna_countries: WnaCountries

    // Revenue breakdown
    anak_revenue: number
    dewasa_revenue: number
    wna_revenue: number

    // Payment methods
    cash_amount: number
    qris_amount: number

    // Computed columns (read-only from DB)
    total_visitors: number
    total_revenue: number

    // Notes
    notes: string | null

    // Status & submission
    status: ReportStatus
    submitted_by: string | null
    submitted_at: string | null

    // Metadata
    created_by: string | null
    created_at: string
    updated_at: string
}

/**
 * Laporan dengan relasi
 */
export interface DailyReportWithRelations extends DailyReport {
    destination: Destination
    submitter: User | null
    creator: User | null
}

/**
 * Audit Trail Laporan
 */
export interface ReportLog {
    id: string
    report_id: string
    user_id: string | null
    action: string
    changes: Record<string, unknown> | null
    ip_address: string | null
    user_agent: string | null
    created_at: string
}

/**
 * Log Aktivitas User
 */
export interface ActivityLog {
    id: string
    user_id: string | null
    destination_id: string | null
    action: string
    details: Record<string, unknown> | null
    ip_address: string | null
    created_at: string
}

/**
 * Log Edit Laporan (Audit Trail)
 */
export interface ReportEditLog {
    id: string
    report_id: string
    edited_by: string
    edited_at: string
    changes: Record<string, { old: unknown; new: unknown }>
    reason: string | null
    created_at: string
}

/**
 * ReportEditLog dengan relasi user
 */
export interface ReportEditLogWithUser extends ReportEditLog {
    editor: User | null
}

// ============================================
// View Types
// ============================================

/**
 * Status laporan hari ini per destinasi
 */
export interface TodayReportStatus {
    destination_id: string
    code: string
    name: string
    report_id: string | null
    status: ReportStatus | null
    total_visitors: number | null
    total_revenue: number | null
    submitted_at: string | null
    daily_status: 'pending' | 'draft' | 'submitted'
}

/**
 * Ringkasan mingguan per destinasi
 */
export interface WeeklySummary {
    destination_id: string
    code: string
    name: string
    week_start: string
    report_count: number
    total_visitors: number
    total_revenue: number
    anak_count: number
    dewasa_count: number
    wna_count: number
}

// ============================================
// Form Input Types
// ============================================

/**
 * Input untuk create/update laporan harian
 */
export interface DailyReportInput {
    destination_id: string
    report_date: string

    // Visitor counts
    anak_count: number
    dewasa_count: number
    wna_count: number

    // Dewasa gender breakdown
    dewasa_male: number
    dewasa_female: number

    // Anak gender breakdown
    anak_male: number
    anak_female: number

    // WNA countries breakdown
    wna_countries: WnaCountries

    // Payment methods
    cash_amount: number
    qris_amount: number

    // Notes
    notes?: string

    // Ticket blocks for audit trail
    ticket_blocks?: Array<{
        category: 'anak' | 'dewasa' | 'wna'
        block_no: string
        start_no: string
        end_no: string
        count: number
    }>
}

/**
 * Input untuk login
 */
export interface LoginInput {
    destination_id: string
    user_id: string
    pin: string
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

// ============================================
// UI State Types
// ============================================

/**
 * Auth state untuk Zustand store
 */
export interface AuthState {
    user: UserWithDestination | null
    isAuthenticated: boolean
    isLoading: boolean
}

/**
 * Report form state
 */
export interface ReportFormState {
    isDirty: boolean
    isSubmitting: boolean
    lastSaved: string | null
}

// ============================================
// Utility Types
// ============================================

/**
 * Type untuk insert (tanpa id dan timestamps)
 */
export type InsertDestination = Omit<Destination, 'id' | 'created_at' | 'updated_at'>
export type InsertUser = Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_login_at'>
export type InsertDailyReport = Omit<DailyReport, 'id' | 'created_at' | 'updated_at' | 'total_visitors' | 'total_revenue'>

/**
 * Type untuk update (partial tanpa id)
 */
export type UpdateDestination = Partial<InsertDestination>
export type UpdateUser = Partial<InsertUser>
export type UpdateDailyReport = Partial<InsertDailyReport>

// ============================================
// Supabase Database Types (untuk type-safe queries)
// ============================================

export interface Database {
    public: {
        Tables: {
            destinations: {
                Row: Destination
                Insert: InsertDestination
                Update: UpdateDestination
            }
            users: {
                Row: User
                Insert: InsertUser
                Update: UpdateUser
            }
            countries: {
                Row: Country
                Insert: Omit<Country, 'created_at'>
                Update: Partial<Omit<Country, 'code' | 'created_at'>>
            }
            daily_reports: {
                Row: DailyReport
                Insert: InsertDailyReport
                Update: UpdateDailyReport
            }
            report_logs: {
                Row: ReportLog
                Insert: Omit<ReportLog, 'id' | 'created_at'>
                Update: never
            }
            activity_logs: {
                Row: ActivityLog
                Insert: Omit<ActivityLog, 'id' | 'created_at'>
                Update: never
            }
        }
        Views: {
            v_today_report_status: {
                Row: TodayReportStatus
            }
            v_weekly_summary: {
                Row: WeeklySummary
            }
        }
    }
}
