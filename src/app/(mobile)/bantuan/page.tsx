'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, HelpCircle, ChevronDown, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const faqs = [
    {
        category: "Login & Akses",
        questions: [
            {
                q: "Bagaimana jika saya salah memilih lokasi Destinasi saat login?",
                a: "Anda bisa menekan tombol Keluar (Logout) pada panel profil, kemudian lakukan login ulang dengan memilih lokasi Destinasi yang benar."
            },
            {
                q: "Mengapa nama saya tidak muncul di pilihan Petugas?",
                a: "Pastikan Koordinator atau Admin telah mendaftarkan nama Anda dan menugaskan Anda ke lokasi destinasi yang tepat. Hubungi Admin pusat jika nama Anda masih belum tersedia."
            }
        ]
    },
    {
        category: "Pengisian Laporan",
        questions: [
            {
                q: "Kenapa tombol 'Submit Laporan' tidak bisa ditekan (berwarna abu-abu)?",
                a: "Hanya Koordinator yang memiliki akses untuk melakukan Submit Laporan ke server. Petugas hanya diizinkan untuk menyimpan sebagai Draft. Jika Anda Koordinator, pastikan seluruh data pengunjung dan keuangan sudah terisi valid."
            },
            {
                q: "Kenapa saya mendapat peringatan 'Total Cash + QRIS tidak cocok'?",
                a: "Sistem memverifikasi otomatis jumlah tiket dengan uang yang diterima. Pastikan total penjumlahan nominal Uang Tunai (Cash) dan QRIS sama persis dengan total pendapatan pengunjung."
            },
            {
                q: "Bagaimana cara memperbaiki laporan yang sudah terlanjur di-Submit?",
                a: "Laporan yang statusnya sudah 'Submitted' dikunci dan tidak dapat diubah lagi melalui aplikasi mobile. Anda harus menghubungi Administrator untuk melakukan koreksi."
            }
        ]
    }
]

export default function BantuanPage() {
    const [openIndex, setOpenIndex] = React.useState<string | null>(null)

    const toggleFaq = (idx: string) => {
        setOpenIndex(openIndex === idx ? null : idx)
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b-2 border-gray-100 px-4 py-4 flex items-center sticky top-0 z-10">
                <Link href="/dashboard" className="p-2 -ml-2 rounded-xl hover:bg-gray-100">
                    <ArrowLeft className="w-6 h-6 text-gray-700" />
                </Link>
                <div className="flex-1 text-center pr-6">
                    <h1 className="text-xl font-bold text-gray-900">Pusat Bantuan</h1>
                </div>
            </header>

            <main className="flex-1 p-5 space-y-6">
                <div className="text-center space-y-2 mb-8 mt-2">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HelpCircle className="w-8 h-8 text-zinc-700" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900">Ada yang bisa dibantu?</h2>
                    <p className="text-gray-500 text-sm">Pilih topik pertanyaan yang sering diajukan di bawah ini.</p>
                </div>

                <div className="space-y-6">
                    {faqs.map((group, gIdx) => (
                        <div key={gIdx} className="space-y-3">
                            <h3 className="font-bold text-gray-900 text-lg px-1">{group.category}</h3>
                            <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm">
                                {group.questions.map((faq, qIdx) => {
                                    const idx = `${gIdx}-${qIdx}`
                                    const isOpen = openIndex === idx
                                    return (
                                        <div key={qIdx} className="border-b border-gray-100 last:border-0">
                                            <button
                                                onClick={() => toggleFaq(idx)}
                                                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                                            >
                                                <span className="font-semibold text-gray-800 pr-4">{faq.q}</span>
                                                <ChevronDown 
                                                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
                                                />
                                            </button>
                                            <div 
                                                className={`overflow-hidden transition-all duration-200 px-4 ${isOpen ? 'max-h-96 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}
                                            >
                                                <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 p-5 bg-zinc-50 rounded-2xl border-2 border-zinc-200 text-center space-y-3">
                    <MessageCircle className="w-8 h-8 text-zinc-700 mx-auto" />
                    <h3 className="font-bold text-zinc-900">Masih Butuh Bantuan?</h3>
                    <p className="text-zinc-700/80 text-sm">Hubungi Koordinator lapangan Anda atau Administrator sistem untuk bantuan lebih lanjut.</p>
                </div>
            </main>
        </div>
    )
}
