import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Login - SITAMMU',
    description: 'Masuk ke Sistem Informasi Tamu Destinasi Wisata',
}

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
            {children}
        </div>
    )
}
