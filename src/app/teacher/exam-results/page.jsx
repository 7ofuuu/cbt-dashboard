'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, Home } from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TeacherLayout from '../teacherLayout';
import ExamResultCard from './components/ExamResultCard';
import request from '@/utils/request';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { SUBJECT_OPTIONS, GRADE_LEVELS, MAJOR_OPTIONS } from '@/lib/constants';

export default function HasilUjianPage() {
  useAuth(['teacher']);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterMajor, setFilterMajor] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [sortBy, setSortBy] = useState('terbaru');
  const [isLoading, setIsLoading] = useState(false);
  const [ujianData, setUjianData] = useState([]);

  useEffect(() => {
    fetchHasilUjian();
  }, []);

  const fetchHasilUjian = async () => {
    setIsLoading(true);
    try {
      const response = await request.get('/exam-results/completed-exams?limit=999');

      if (response?.data?.data && Array.isArray(response.data.data)) {
        const processedData = response.data.data.map(ujian => ({
          id: ujian.exam_id,
          examName: ujian.exam_name,
          mataPelajaran: ujian.subject,
          gradeLevel: ujian.grade_level,
          major: ujian.major,
          classroom: `${ujian.grade_level} - ${ujian.major || '-'}`,
          teacher: ujian.teacher,
          jumlahKelas: ujian.participant_results?.length > 0
            ? [...new Set(ujian.participant_results.map(p => p.student?.classroom))].filter(Boolean).length
            : 0,
          totalSiswa: ujian.statistics?.total_participants || 0,
          selesai: ujian.statistics?.total_completed || 0,
          avgScore: ujian.statistics?.average_score || 0,
        }));

        setUjianData(processedData);
      }
    } catch (error) {
      console.error('Gagal memuat hasil ujian:', error);
      toast.error('Gagal memuat data hasil ujian');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    let result = ujianData.filter(ujian => {
      const q = searchQuery.toLowerCase();
      const matchQuery = !q ||
        ujian.mataPelajaran?.toLowerCase().includes(q) ||
        ujian.examName?.toLowerCase().includes(q) ||
        ujian.classroom?.toLowerCase().includes(q);
      const matchGrade = filterGrade === 'all' || ujian.gradeLevel === filterGrade;
      const matchMajor = filterMajor === 'all' || ujian.major === filterMajor;
      const matchSubject = filterSubject === 'all' || ujian.mataPelajaran === filterSubject;
      return matchQuery && matchGrade && matchMajor && matchSubject;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'score-desc':
          return (b.avgScore || 0) - (a.avgScore || 0);
        case 'score-asc':
          return (a.avgScore || 0) - (b.avgScore || 0);
        case 'nama-asc':
          return (a.examName || '').localeCompare(b.examName || '');
        case 'nama-desc':
          return (b.examName || '').localeCompare(a.examName || '');
        case 'terbaru':
        default:
          return 0; // keep original order (already sorted by backend)
      }
    });

    return result;
  }, [ujianData, searchQuery, filterGrade, filterMajor, filterSubject, sortBy]);

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
            <BreadcrumbPage>Hasil Ujian</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='space-y-6'>
        <PageHeader
          title="Hasil Ujian"
          description="Lihat dan analisis hasil ujian siswa"
        />

        {/* Search & Filters */}
        <div className='flex flex-col sm:flex-row items-center gap-4'>
          <div className='flex-1 w-full'>
            <div className='relative'>
              <Input
                type='text'
                placeholder='Cari ujian (nama, mapel, kelas...)'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pr-10'
              />
              <div className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'>
                <Search className='w-5 h-5' />
              </div>
            </div>
          </div>

          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className='w-full sm:w-48'>
              <SelectValue placeholder='Mata Pelajaran' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Semua Mapel</SelectItem>
              {SUBJECT_OPTIONS.map((subject) => (
                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterGrade} onValueChange={setFilterGrade}>
            <SelectTrigger className='w-full sm:w-40'>
              <SelectValue placeholder='Tingkat' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Semua Tingkat</SelectItem>
              {GRADE_LEVELS.map((grade) => (
                <SelectItem key={grade.value} value={grade.value}>Tingkat {grade.value}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterMajor} onValueChange={setFilterMajor}>
            <SelectTrigger className='w-full sm:w-40'>
              <SelectValue placeholder='Jurusan' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Semua Jurusan</SelectItem>
              {MAJOR_OPTIONS.map((major) => (
                <SelectItem key={major.value} value={major.value}>{major.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className='w-full sm:w-40'>
              <SelectValue placeholder='Urutkan' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='terbaru'>Terbaru</SelectItem>
              <SelectItem value='score-desc'>Nilai Tertinggi</SelectItem>
              <SelectItem value='score-asc'>Nilai Terendah</SelectItem>
              <SelectItem value='nama-asc'>Nama A-Z</SelectItem>
              <SelectItem value='nama-desc'>Nama Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cards Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5'>
          {isLoading ? (
            <div className='col-span-full text-center py-12'>
              <p className='text-gray-500'>Memuat data...</p>
            </div>
          ) : filteredData.length > 0 ? (
            filteredData.map((ujian, i) => (
              <ExamResultCard key={ujian.id} ujian={ujian} index={i} />
            ))
          ) : (
            <div className='col-span-full text-center py-12'>
              <p className='text-gray-500 text-lg'>
                {searchQuery || filterGrade !== 'all' || filterMajor !== 'all' || filterSubject !== 'all'
                  ? 'Tidak ada ujian yang cocok dengan filter'
                  : 'Belum ada ujian yang selesai'}
              </p>
              {!searchQuery && filterGrade === 'all' && filterMajor === 'all' && filterSubject === 'all' && (
                <p className='text-gray-400 text-sm mt-2'>
                  Hasil ujian akan muncul setelah ujian mencapai waktu akhir dan berstatus &quot;ENDED&quot;
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}
