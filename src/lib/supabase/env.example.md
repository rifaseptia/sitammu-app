# Supabase Environment Variables

Buat file `.env.local` di root project dengan isi:

```env
# Supabase Configuration
# Dapatkan dari: Supabase Dashboard → Project Settings → API

NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Cara Mendapatkan Credentials

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project SITAMMU
3. Klik **Project Settings** (ikon gear)
4. Klik **API** di sidebar
5. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
6. Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
