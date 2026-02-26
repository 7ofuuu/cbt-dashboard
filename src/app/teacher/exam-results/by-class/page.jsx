'use client';

import { useEffect, useState } from 'react';
import { Search, Home } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import TeacherLayout from '../../teacherLayout';
import KelasCard from './components/ClassCard';
import request from '@/utils/request';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function ListKelasPage() {
  useAuth(['teacher']);
  const params = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [kelasData, setKelasData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const mataPelajaran = params?.get('mata') || 'Matematika';
  const ujianId = params?.get('ujianId');
  
  useEffect(() => {
    const fetchKelasData = async () => {
      setIsLoading(true);
      try {
        const response = await request.get('/exam-results/completed-exams?limit=999');
        
        let selectedUjian = null;
        if (response?.data?.data && Array.isArray(response.data.data)) {
          selectedUjian = response.data.data.find(u => u.exam_id === parseInt(ujianId));
        }
        
        if (selectedUjian && selectedUjian.participant_results) {
          const kelasMap = new Map();
          
          selectedUjian.participant_results.forEach(item => {
            const kelasKey = item.student?.classroom;
            if (kelasKey) {
              if (!kelasMap.has(kelasKey)) {
                kelasMap.set(kelasKey, {
                  id: kelasKey,
                  full_name: kelasKey,
                  mataPelajaran: mataPelajaran,
                  totalSiswa: 0,
                  selesai: 0,
                });
              }
              
              const kelasItem = kelasMap.get(kelasKey);
              kelasItem.totalSiswa += 1;
              if (item.final_score !== null && item.final_score !== undefined) {
                kelasItem.selesai += 1;
              }
            }
          });
          
          const result = Array.from(kelasMap.values());
          setKelasData(result);
        } else {
          setKelasData([]);
        }
      } catch (error) {
        console.error('Gagal memuat data kelas:', error);
        toast.error('Gagal memuat data kelas');
        setKelasData([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (ujianId) {
      fetchKelasData();
    }
  }, [ujianId, mataPelajaran]);
  
  const filteredData = kelasData.filter(classroom =>
    classroom.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <TeacherLayout>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/teacher/dashboard'>
              <Home className='w-4 h-4' />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href='/teacher/exam-results'>Hasil Ujian</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{mataPelajaran}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='space-y-6'>
        <PageHeader
          title={mataPelajaran}
          description="Pilih kelas untuk melihat hasil ujian siswa"
        />

        {/* Search Bar */}
        <div className='relative'>
          <input
            type='text'
            placeholder='Cari Kelas'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-10'
          />
          <Search className='absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
        </div>

        {/* Cards Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5'>
          {isLoading ? (
            <div className='col-span-full text-center py-12'>
              <p className='text-gray-500 text-lg'>Memuat data...</p>
            </div>
          ) : filteredData.length > 0 ? (
            filteredData.map((classroom, i) => (
              <KelasCard key={classroom.id} classroom={classroom} mataPelajaran={mataPelajaran} ujianId={ujianId} index={i} />
            ))
          ) : (
            <div className='col-span-full text-center py-12'>
              <p className='text-gray-500 text-lg'>Kelas tidak ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}
