'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Home, FileText, Calendar, Award, CheckCircle2 } from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import TeacherLayout from '../../../teacherLayout';
import request from '@/utils/request';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function DetailNilaiPage() {
  useAuth(['teacher']);
  const router = useRouter();
  const params = useSearchParams();
  const mataPelajaran = params.get('mata') || 'Matematika';
  const classroom = params.get('classroom') || 'XII - IPA 1';
  const ujianId = params.get('ujianId');
  const pesertaUjianId = params.get('pesertaUjianId');
  
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDetailData = async () => {
      setIsLoading(true);
      try {
        const response = await request.get(`/exam-results/detail/${pesertaUjianId}`);
        
        const hasil = response.data?.exam_result;
        const siswa = response.data?.student;
        const ujian = response.data?.exam;
        
        if (siswa && ujian) {
          setData({
            full_name: siswa?.full_name || 'Unknown',
            nisn: siswa?.nisn || '-',
            siswaId: siswa?.student_id,
            classroom: siswa?.classroom || '-',
            grade_level: siswa?.grade_level || '-',
            major: siswa?.major || '-',
            mataPelajaran: ujian?.subject || 'Unknown',
            namaUjian: ujian?.exam_name || '-',
            tanggalMulai: ujian?.start_date ? new Date(ujian.start_date).toLocaleString('id-ID') : '-',
            tanggalSelesai: hasil?.submit_date ? new Date(hasil.submit_date).toLocaleString('id-ID') : '-',
            statusUjian: response.data?.exam_status || (hasil ? 'GRADED' : 'BELUM DINILAI'),
            nilaiAkhir: hasil?.final_score != null ? Number(hasil.final_score.toFixed(2)) : null,
            hasilUjianId: hasil?.exam_result_id,
            review: response.data.review || [],
          });
        }
      } catch (error) {
        console.error('Gagal memuat detail nilai:', error);
        toast.error('Gagal memuat detail nilai siswa');
      } finally {
        setIsLoading(false);
      }
    };

    if (pesertaUjianId) {
      fetchDetailData();
    }
  }, [pesertaUjianId]);

  if (isLoading) {
    return (
      <TeacherLayout>
        <div className='flex justify-center items-center h-64'>
          <p className='text-gray-600'>Loading...</p>
        </div>
      </TeacherLayout>
    );
  }

  if (!data) {
    return (
      <TeacherLayout>
        <div className='flex justify-center items-center h-64'>
          <p className='text-gray-600'>Data tidak ditemukan</p>
        </div>
      </TeacherLayout>
    );
  }

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
            <BreadcrumbLink href={`/teacher/exam-results/student-list?mata=${encodeURIComponent(mataPelajaran)}&classroom=${encodeURIComponent(classroom)}&ujianId=${ujianId}`}>
              {classroom}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Detail Nilai</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='space-y-6'>
        <PageHeader
          title="Detail Nilai"
          description={`Detail hasil ujian ${data.full_name}`}
        />

        {/* Card */}
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          {/* Header with student info */}
          <div className='flex flex-col sm:flex-row border-b border-gray-200'>
            {/* Student Info */}
            <div className='flex-1 flex items-center gap-4 p-5'>
              <div className='w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0'>
                {data.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'}
              </div>

              <div className='flex-1'>
                <div className='flex items-center gap-2'>
                  <h2 className='text-base font-semibold text-gray-900'>{data.full_name}</h2>
                  <span className='bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium'>Siswa</span>
                </div>
                <p className='text-sm text-gray-500 mt-0.5'>{data.classroom}</p>
                {data.nisn !== '-' && <p className='text-xs text-gray-400'>NISN: {data.nisn}</p>}
              </div>
            </div>

            {/* Score Info */}
            <div className='flex items-center justify-center border-t sm:border-t-0 sm:border-l border-gray-200 p-5 sm:px-10'>
              <div className='text-center'>
                <p className='text-xs font-medium text-gray-400 uppercase tracking-wider mb-1'>Nilai Akhir</p>
                {data.nilaiAkhir != null ? (
                  <p className={`text-3xl font-bold ${
                    data.nilaiAkhir >= 75 ? 'text-green-600' : data.nilaiAkhir >= 50 ? 'text-yellow-600' : 'text-red-500'
                  }`}>{data.nilaiAkhir}</p>
                ) : (
                  <p className='text-lg font-semibold text-gray-400'>Belum Dinilai</p>
                )}
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100'>
            <div className='p-5'>
              <div className='flex items-center gap-2 mb-1'>
                <FileText className='w-3.5 h-3.5 text-gray-400' />
                <p className='text-xs font-medium text-gray-400 uppercase tracking-wider'>Nama Ujian</p>
              </div>
              <p className='text-sm font-medium text-gray-900'>{data.namaUjian}</p>
            </div>
            <div className='p-5'>
              <div className='flex items-center gap-2 mb-1'>
                <Award className='w-3.5 h-3.5 text-gray-400' />
                <p className='text-xs font-medium text-gray-400 uppercase tracking-wider'>Mata Pelajaran</p>
              </div>
              <p className='text-sm font-medium text-gray-900'>{data.mataPelajaran}</p>
            </div>
            <div className='p-5'>
              <div className='flex items-center gap-2 mb-1'>
                <Calendar className='w-3.5 h-3.5 text-gray-400' />
                <p className='text-xs font-medium text-gray-400 uppercase tracking-wider'>Selesai di</p>
              </div>
              <p className='text-sm font-medium text-gray-900'>{data.tanggalSelesai}</p>
            </div>
            <div className='p-5'>
              <div className='flex items-center gap-2 mb-1'>
                <CheckCircle2 className='w-3.5 h-3.5 text-gray-400' />
                <p className='text-xs font-medium text-gray-400 uppercase tracking-wider'>Status</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                data.statusUjian === 'GRADED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>{data.statusUjian}</span>
            </div>
          </div>
        </div>

        {/* Button */}
        <div>
          <button
            className='bg-blue-900 hover:bg-blue-800 text-white px-6 py-2.5 rounded-lg font-semibold transition'
            onClick={() => {
              router.push(`/teacher/exam-results/student-list/detail/essay?mata=${encodeURIComponent(mataPelajaran)}&classroom=${encodeURIComponent(classroom)}&ujianId=${ujianId}&pesertaUjianId=${encodeURIComponent(pesertaUjianId)}&page=1`);
            }}
          >
            Nilai Essay
          </button>
        </div>
      </div>
    </TeacherLayout>
  );
}