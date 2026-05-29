'use client';

import { Suspense, useEffect, useState } from 'react';
import { Search, Home } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import TeacherLayout from '../../teacherLayout';
import KelasCard from './components/ClassCard';
import request from '@/utils/request';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

function ListKelasPageContent() {
  useAuth(['teacher']);
  const params = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [kelasData, setKelasData] = useState([]);
  const [examName, setExamName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const mataPelajaran = params?.get('mata') || 'Matematika';
  const ujianId = params?.get('ujianId');
  const isArchived = params?.get('archived') === 'true';
  const reviewModeParam = params?.get('review') || 'all';
  const reviewMode = ['all', 'pending', 'graded'].includes(reviewModeParam)
    ? reviewModeParam
    : 'all';

  const reviewLabel = reviewMode === 'pending'
    ? 'Belum Dinilai'
    : reviewMode === 'graded'
    ? 'Sudah Dinilai'
    : 'Semua Hasil';

  useEffect(() => {
    const fetchKelasData = async () => {
      setIsLoading(true);
      try {
        const endpoint = isArchived
          ? '/exam-results/archived-exams?limit=999'
          : '/exam-results/completed-exams?limit=999';
        const response = await request.get(endpoint);

        let selectedUjian = null;
        if (response?.data?.data && Array.isArray(response.data.data)) {
          selectedUjian = response.data.data.find(u => u.exam_id === parseInt(ujianId));
        }

        if (selectedUjian) {
          setExamName(selectedUjian.exam_name || mataPelajaran);
        }

        if (selectedUjian && selectedUjian.participant_results) {
          const kelasMap = new Map();

          selectedUjian.participant_results.forEach(item => {
            const shouldInclude = reviewMode === 'all'
              || (reviewMode === 'pending' && item.exam_status === 'COMPLETED')
              || (reviewMode === 'graded' && item.exam_status === 'GRADED');

            if (!shouldInclude) return;

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

          setKelasData(Array.from(kelasMap.values()));
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
  }, [ujianId, mataPelajaran, reviewMode, isArchived]);

  const filteredData = kelasData.filter(classroom =>
    classroom.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const archivedSuffix = isArchived ? '&archived=true' : '';
  const displayName = examName || mataPelajaran;

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
            <BreadcrumbLink href={isArchived ? '/teacher/exam-results?tab=archived' : '/teacher/exam-results'}>
              Hasil Ujian
            </BreadcrumbLink>
          </BreadcrumbItem>
          {isArchived && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href='/teacher/exam-results?tab=archived'>Arsip</BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{displayName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='space-y-6'>
        <PageHeader
          title={displayName}
          description={`Pilih kelas untuk melihat hasil ujian siswa (${reviewLabel})`}
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
              <KelasCard
                key={classroom.id}
                classroom={classroom}
                mataPelajaran={mataPelajaran}
                ujianId={ujianId}
                review={reviewMode}
                index={i}
                archived={isArchived}
              />
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

export default function ListKelasPage() {
  return (
    <Suspense
      fallback={
        <TeacherLayout>
          <div className='flex justify-center items-center h-64'>
            <p className='text-gray-600'>Loading...</p>
          </div>
        </TeacherLayout>
      }
    >
      <ListKelasPageContent />
    </Suspense>
  );
}
