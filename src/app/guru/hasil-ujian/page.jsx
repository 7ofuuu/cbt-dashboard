'use client';

import { useEffect, useState } from 'react';
import { Search, Home } from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import GuruLayout from '../guruLayout';
import HasilUjianCard from './components/HasilUjianCard';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function HasilUjianPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ujianData, setUjianData] = useState([]);

  useEffect(() => {
    fetchHasilUjian();
  }, []);

  const fetchHasilUjian = async () => {
    setIsLoading(true);
    try {
      const token = Cookies.get('token');
      const userCookie = Cookies.get('user');
      const userData = userCookie ? JSON.parse(userCookie) : {};

      const response = await axios.get(`${process.env.NEXT_PUBLIC_LARAVEL_API}/completed-ujians`, {
        params: {
          user_id: userData.id,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response?.data?.ujians && Array.isArray(response.data.ujians)) {
        const processedData = response.data.ujians.map(ujian => ({
          id: ujian.ujian_id,
          mataPelajaran: ujian.mata_pelajaran,
          kelas: `${ujian.tingkat} - ${ujian.jurusan}`,
          jumlahKelas: ujian.peserta_results?.length > 0 
            ? [...new Set(ujian.peserta_results.map(p => p.siswa?.kelas))].filter(Boolean).length 
            : 0,
          totalSiswa: ujian.statistics?.total_peserta || 0,
          selesai: ujian.statistics?.total_selesai || 0,
        }));

        setUjianData(processedData);
      }
    } catch (error) {
      console.error('Error fetching hasil ujian:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = ujianData.filter(ujian => 
    ujian.mataPelajaran?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ujian.kelas?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <BreadcrumbPage>Hasil Ujian</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <PageHeader
          title="Hasil Ujian"
          description="Lihat dan analisis hasil ujian siswa"
        />

        <div className='relative mb-6'>
          <input
            type='text'
            placeholder='Cari Ujian'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
          />
          <Search className='absolute right-4 top-3 w-5 h-5 text-gray-400' />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          {isLoading ? (
            <div className='col-span-full text-center py-12'>
               <p className='text-gray-500'>Memuat data...</p>
            </div>
          ) : filteredData.length > 0 ? (
            filteredData.map(ujian => (
              <HasilUjianCard key={ujian.id} ujian={ujian} />
            ))
          ) : (
            <div className='col-span-full text-center py-12'>
              <p className='text-gray-500 text-lg'>Hasil ujian tidak ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </GuruLayout>
  );
}