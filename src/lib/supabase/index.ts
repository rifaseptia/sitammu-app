// Re-export untuk kemudahan import
// Client: import { createClient } from '@/lib/supabase/client'
// Server: import { createClient } from '@/lib/supabase/server'

export { createClient as createBrowserClient } from './client'
export { createClient as createServerClient } from './server'
