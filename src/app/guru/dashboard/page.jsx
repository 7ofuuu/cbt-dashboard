"use client";

import Image from 'next/image';
import Link from 'next/link'; 
import GuruLayout from '../guruLayout';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  useAuth(['guru']);

  // Data akan diambil dari API - sementara kosong
  const ujian = [];

  const bankSoal = [];

  return (
    <GuruLayout>
      <div className="space-y-8">
        <header className="bg-gradient-to-r from-sky-800 to-sky-700 text-white rounded-lg p-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0118 18.75V21l-6-3-6 3v-2.25c0-2.487-.56-4.59-1.84-7.172L12 14z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold">Selamat Datang Guru</h1>
            <p className="text-sm opacity-90">Akses bank soal, jadwalkan ujian, dan hasilkan laporan nilai secara otomatis dalam beberapa klik.</p>
          </div>
        </header>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Ujian</h2>
            <Link href="/guru/jadwal-ujian" className="text-sky-700 font-medium">Lihat semua</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {ujian.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                <p>Belum ada ujian. Silakan buat jadwal ujian terlebih dahulu.</p>
                <Link href="/guru/jadwal-ujian/tambah-jadwal" className="text-sky-700 hover:underline mt-2 inline-block">
                  Tambah Jadwal Ujian
                </Link>
              </div>
            ) : (
              ujian.map((u, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-sky-700 text-white p-4">
                    <h3 className="font-semibold">{u.title}</h3>
                    <div className="text-xs opacity-90">{u.kelas}</div>
                  </div>
                  <div className="p-4 text-sm text-gray-700">
                    <div className="flex justify-between"><span>Peserta :</span><span>{u.peserta}</span></div>
                    <div className="flex justify-between"><span>Status :</span><span>{u.status}</span></div>
                    <div className="flex justify-between"><span>Dimulai pada :</span><span>{u.mulai}</span></div>
                    <div className="flex justify-between"><span>Berakhir pada :</span><span>{u.akhir}</span></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Bank Soal</h2>
            <Link href="/guru/banksoal" className="text-sky-700 font-medium">Lihat semua ››</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {bankSoal.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                <p>Belum ada bank soal. Silakan tambah soal terlebih dahulu.</p>
                <Link href="/guru/tambah-soal" className="text-sky-700 hover:underline mt-2 inline-block">
                  Tambah Soal
                </Link>
              </div>
            ) : (
              bankSoal.map((b, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className={`${b.color} text-white p-4`}>
                    <h3 className="font-semibold">{b.title}</h3>
                    <div className="text-xs opacity-90">{b.jurusan}</div>
                  </div>
                  <div className="p-4 text-sm text-gray-700">
                    <div className="flex justify-between"><span>Isi Pilihan Ganda :</span><span>{b.pg}</span></div>
                    <div className="flex justify-between"><span>Isi Essay :</span><span>{b.essay}</span></div>
                    <div className="flex justify-between"><span>Dibuat pada :</span><span>{b.dibuat}</span></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </GuruLayout>
  );
}

