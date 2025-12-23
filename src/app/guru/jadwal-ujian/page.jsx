"use client";

import GuruLayout from '../guruLayout';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function JadwalUjianPage() {
  // Protect this page - only guru can access
  useAuth(['guru']);

  const jadwal = [
    { title: 'Ujian Akhir Semester', mapel: 'Matematika', jurusan: 'XII - IPA', peserta: 86, status: 'Tidak Aktif', mulai: '08:30, 20 Juni 2025', akhir: '09:30, 20 Juni 2025', color: 'bg-teal-700' },
    { title: 'Ujian Akhir Semester', mapel: 'B. Indonesia', jurusan: 'XII - IPA', peserta: 90, status: 'Tidak Aktif', mulai: '07:30, 21 Juni 2025', akhir: '08:30, 21 Juni 2025', color: 'bg-teal-700' },
    { title: 'Ujian Akhir Semester', mapel: 'Sosiologi', jurusan: 'XII - IPS', peserta: 70, status: 'Tidak Aktif', mulai: '08:30, 22 Juni 2025', akhir: '09:30, 22 Juni 2025', color: 'bg-orange-400' },
    { title: 'Ujian Tengah Semester', mapel: 'Geografi', jurusan: 'XII - IPS', peserta: 83, status: 'Tidak Aktif', mulai: '09:30, 20 Maret 2025', akhir: '10:30, 20 Maret 2025', color: 'bg-orange-400' },
    { title: 'Ujian Tengah Semester', mapel: 'B. Inggris', jurusan: 'XII - IPA', peserta: 90, status: 'Tidak Aktif', mulai: '10:30, 23 Maret 2025', akhir: '11:30, 23 Maret 2025', color: 'bg-pink-400' },
  ];

  return (
    <GuruLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Jadwal Ujian</h1>
          <Link href="/guru/jadwal-ujian/tambah-jadwal" className="inline-flex items-center gap-2 bg-sky-800 text-white px-4 py-2 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Jadwal Ujian
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-3">
            <div className="flex gap-4 mb-4">
              <input type="search" placeholder="Cari Bank Soal" className="flex-1 border rounded-md px-4 py-3 shadow-sm" />
              <button className="px-4 py-3 border rounded-md">🔍</button>
            </div>

            <div className="flex gap-3 mb-6">
              <button className="px-4 py-2 border rounded-full">Semua Jurusan ▾</button>
              <button className="px-4 py-2 border rounded-full">Semua Tingkat ▾</button>
              <button className="px-4 py-2 border rounded-full">Semua Kelas ▾</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {jadwal.map((j, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className={`${j.color} text-white p-4`}>
                    <h3 className="font-semibold">{j.title}</h3>
                  </div>
                  <div className="p-4 text-sm text-gray-700">
                    <div className="flex justify-between"><span>Mapel :</span><span>{j.mapel}</span></div>
                    <div className="flex justify-between"><span>Jurusan/Tingkat :</span><span>{j.jurusan}</span></div>
                    <div className="flex justify-between"><span>Peserta :</span><span>{j.peserta}</span></div>
                    <div className="flex justify-between"><span>Status :</span><span>{j.status}</span></div>
                    <div className="flex justify-between"><span>Dimulai pada :</span><span>{j.mulai}</span></div>
                    <div className="flex justify-between"><span>Berakhir pada :</span><span>{j.akhir}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </GuruLayout>
  );
}
