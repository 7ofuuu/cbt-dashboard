"use client";

import { useState, useEffect } from 'react'; // Add this line
import GuruLayout from '../guruLayout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/useAuth';
import { Home, Plus } from 'lucide-react';
import Link from 'next/link';
import request from '@/utils/request';

export default function JadwalUjianPage() {
  useAuth(['guru']);

  const [ujians, setUjians] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchJadwal = async () => {
      try {
        setLoading(true);
        const response = await request.get('/ujian');
        setUjians(response.data.ujians);
      } catch (error) {
        console.error("Failed to fetch ujian:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJadwal();
  }, []);

  const getColor = (index) => {
    const colors = ['bg-teal-700', 'bg-orange-400', 'bg-pink-400', 'bg-blue-600'];
    return colors[index % colors.length];
  };

  return (
    <GuruLayout>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/guru/dashboard'>
              <Home className='w-4 h-4' />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Jadwal Ujian</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-6">
        <PageHeader
          title="Jadwal Ujian"
          description="Kelola dan lihat semua jadwal ujian"
        >
          <Link href="/guru/jadwal-ujian/tambah-jadwal" className="inline-flex items-center gap-2 bg-sky-800 text-white px-4 py-2 rounded-md hover:bg-sky-900">
            <Plus className="h-5 w-5" />
            Tambah Jadwal Ujian
          </Link>
        </PageHeader>

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

            {loading ? (
              <div className="text-center py-10">Memuat data...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {ujians.map((u, i) => (
                  <div key={u.ujian_id} className="bg-white rounded-lg shadow-sm overflow-hidden border">

                    <div className={`${getColor(i)} text-white p-4`}>
                      <h3 className="font-semibold">{u.nama_ujian}</h3>
                    </div>
                    <div className="p-4 text-sm text-gray-700">
                      <div className="flex justify-between border-b py-1">
                        <span className="font-medium">Mapel:</span>
                        <span>{u.mata_pelajaran}</span>
                      </div>
                      <div className="flex justify-between border-b py-1">
                        <span className="font-medium">Jurusan/Tingkat:</span>
                        <span>{u.jurusan} / {u.tingkat}</span>
                      </div>
                      <div className="flex justify-between border-b py-1">
                        <span className="font-medium">Durasi:</span>
                        <span>{u.durasi_menit} Menit</span>
                      </div>
                      <div className="flex flex-col mt-2">
                        <span className="font-medium text-xs text-gray-400 uppercase">Mulai:</span>
                        <span>{new Date(u.tanggal_mulai).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex flex-col mt-1">
                        <span className="font-medium text-xs text-gray-400 uppercase">Selesai:</span>
                        <span>{new Date(u.tanggal_selesai).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </GuruLayout>
  );
}
