'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, Home, Filter, X } from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TeacherLayout from '../teacherLayout';
import ExamResultCard from './components/ExamResultCard';
import request from '@/utils/request';
import { useAuth } from '@/hooks/useAuth';
import { useAuthContext } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { useTaxonomy } from '@/contexts/TaxonomyContext';

export default function HasilUjianPage() {
  useAuth(['teacher']);
  const { user } = useAuthContext();
  const { subjects, gradeLevels, majors } = useTaxonomy();
  const isCoordinator = user?.is_coordinator === true;
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
        <div className='bg-white border rounded-lg shadow-sm p-3 space-y-3'>
          <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
            <Filter className='w-4 h-4' />
            <span>Filter & Pencarian</span>
            {(() => {
              const active = [searchQuery, isCoordinator && filterSubject !== 'all', filterGrade !== 'all', filterMajor !== 'all'].filter(Boolean).length;
              return active > 0 ? <Badge variant='secondary' className='ml-1 text-[10px] h-5'>{active} aktif</Badge> : null;
            })()}
            <div className='flex-1' />
            {(searchQuery || filterSubject !== 'all' || filterGrade !== 'all' || filterMajor !== 'all') && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='h-8 text-xs'
                onClick={() => {
                  setSearchQuery('');
                  setFilterSubject('all');
                  setFilterGrade('all');
                  setFilterMajor('all');
                }}
              >
                <X className='w-3.5 h-3.5 mr-1' />
                Reset
              </Button>
            )}
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${isCoordinator ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
            <div className='relative lg:col-span-1'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
              <Input
                type='text'
                placeholder='Cari ujian...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 h-10 w-full'
              />
            </div>

            {isCoordinator && (
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className='h-10 w-full'>
                  <SelectValue placeholder='Mata Pelajaran' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Semua Mapel</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.subject_id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className='h-10 w-full'>
                <SelectValue placeholder='Tingkat' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Semua Tingkat</SelectItem>
                {gradeLevels.map((g) => (
                  <SelectItem key={g.grade_level_id} value={g.value}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterMajor} onValueChange={setFilterMajor}>
              <SelectTrigger className='h-10 w-full'>
                <SelectValue placeholder='Jurusan' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Semua Jurusan</SelectItem>
                {majors.map((m) => (
                  <SelectItem key={m.major_id} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className='h-10 w-full'>
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
