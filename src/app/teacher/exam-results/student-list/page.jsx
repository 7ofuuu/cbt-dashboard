'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Home } from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import TeacherLayout from '../../teacherLayout';
import request from '@/utils/request';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function ListSiswaPage() {
  useAuth(['teacher']);
  const router = useRouter();
  const params = useSearchParams();
  const mataPelajaran = params.get('mata') || 'Matematika';
  const classroom = params.get('classroom') || 'XII - IPA 1';
  const ujianId = params.get('ujianId');

  const [query, setQuery] = useState('');
  const [siswaData, setSiswaData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSiswaList = async () => {
      setIsLoading(true);
      try {
        const response = await request.get('/exam-results/completed-exams?limit=999');
        
        let selectedUjian = null;
        if (response?.data?.data && Array.isArray(response.data.data)) {
          selectedUjian = response.data.data.find(u => u.exam_id === parseInt(ujianId));
        }
        
        if (selectedUjian && selectedUjian.participant_results) {
          const filteredSiswa = selectedUjian.participant_results.filter(item => {
            return item.student?.classroom === classroom;
          });
          
          const transformedSiswa = filteredSiswa.map((item) => ({
            id: item.exam_participant_id,
            email: item.student?.email || '-',
            full_name: item.student?.full_name || 'Unknown',
            nilai: item.final_score,
            classroom: item.student?.classroom || '-',
            selesai: item.submit_date ? new Date(item.submit_date).toLocaleDateString('id-ID') : '-',
            statusUjian: item.exam_status,
          }));
          
          setSiswaData(transformedSiswa);
        } else {
          setSiswaData([]);
        }
      } catch (error) {
        console.error('Gagal memuat data siswa:', error);
        toast.error('Gagal memuat data siswa');
        setSiswaData([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (ujianId) {
      fetchSiswaList();
    }
  }, [ujianId, classroom]);

  const filtered = siswaData.filter((s) => {
    const target = `${s.email} ${s.full_name} ${s.classroom}`.toLowerCase();
    return target.includes(query.toLowerCase());
  });

  const handleRowClick = (studentId) => {
    router.push(`/teacher/exam-results/student-list/detail?mata=${encodeURIComponent(mataPelajaran)}&classroom=${encodeURIComponent(classroom)}&ujianId=${ujianId}&pesertaUjianId=${studentId}`);
  };

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
            <BreadcrumbLink href={`/teacher/exam-results/by-class?mata=${encodeURIComponent(mataPelajaran)}&ujianId=${ujianId}`}>
              {mataPelajaran}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{classroom}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='space-y-6'>
        <PageHeader
          title={classroom}
          description={`Daftar siswa dan hasil ujian ${mataPelajaran}`}
        />

        {/* Search */}
        <div className='relative'>
          <input
            type='text'
            placeholder='Cari Siswa'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className='w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-10'
          />
          <Search className='absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
        </div>

        {/* Table */}
        <div className='overflow-x-auto bg-white rounded-lg border border-gray-200'>
          <table className='min-w-full text-sm'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Siswa</th>
                <th className='text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Nilai</th>
                <th className='text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Kelas</th>
                <th className='text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Selesai</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan='4' className='px-4 py-8 text-center text-gray-500'>
                    Memuat data siswa...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((s) => (
                  <tr
                    key={s.id}
                    className='border-t hover:bg-blue-50/50 cursor-pointer transition-colors'
                    onClick={() => handleRowClick(s.id)}
                  >
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-3'>
                        <div className='w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0'>
                          {s.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'}
                        </div>
                        <span className='text-gray-900 font-medium'>{s.full_name}</span>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      {s.nilai === null ? (
                        <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700'>Belum Dinilai</span>
                      ) : (
                        <span className={`font-semibold ${
                          s.nilai >= 75 ? 'text-green-600' : s.nilai >= 50 ? 'text-yellow-600' : 'text-red-500'
                        }`}>{s.nilai}</span>
                      )}
                    </td>
                    <td className='px-4 py-3 text-gray-600'>{s.classroom}</td>
                    <td className='px-4 py-3 text-gray-600'>{s.selesai}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan='4' className='px-4 py-8 text-center text-gray-500'>
                    Tidak ada data siswa
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </TeacherLayout>
  );
}
