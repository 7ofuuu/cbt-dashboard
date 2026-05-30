'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Home, Archive, BookOpen } from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import TeacherLayout from '../teacherLayout';
import ExamResultCard from './components/ExamResultCard';
import request from '@/utils/request';
import { useAuth } from '@/hooks/useAuth';
import { useAuthContext } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { useTaxonomy } from '@/contexts/TaxonomyContext';
import { StaggerList, StaggerItem } from '@/components/motion/stagger-list';
import CardSkeletonGrid from '@/components/motion/card-skeleton-grid';
import FilterPanel from '@/components/filter-panel';
import { AnimatePresence, motion } from 'framer-motion';

function HasilUjianContent() {
  useAuth(['teacher']);
  const { user } = useAuthContext();
  const { subjects, gradeLevels, majors } = useTaxonomy();
  const isCoordinator = user?.is_coordinator === true;
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(() => {
    return searchParams?.get('tab') === 'archived' ? 'archived' : 'active';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterMajor, setFilterMajor] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [sortBy, setSortBy] = useState('terbaru');
  const [isLoading, setIsLoading] = useState(false);
  const [ujianData, setUjianData] = useState([]);
  const [archivedData, setArchivedData] = useState([]);
  const [confirmSubmit, setConfirmSubmit] = useState(null); // { id, name }
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === 'active') fetchHasilUjian();
    else fetchArchivedUjian();
  }, [activeTab]);

  const mapExam = (ujian) => ({
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
    submittedAt: ujian.teacher_submitted_at || null,
  });

  const fetchHasilUjian = async () => {
    setIsLoading(true);
    try {
      const response = await request.get('/exam-results/completed-exams?limit=999');
      if (response?.data?.data && Array.isArray(response.data.data)) {
        setUjianData(response.data.data.map(mapExam));
      }
    } catch {
      toast.error('Gagal memuat data hasil ujian');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchArchivedUjian = async () => {
    setIsLoading(true);
    try {
      const response = await request.get('/exam-results/archived-exams?limit=999');
      if (response?.data?.data && Array.isArray(response.data.data)) {
        setArchivedData(response.data.data.map(mapExam));
      }
    } catch {
      toast.error('Gagal memuat data arsip');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitExam = async () => {
    if (!confirmSubmit) return;
    setIsSubmitting(true);
    try {
      await request.post(`/exam-results/${confirmSubmit.id}/submit`);
      toast.success(`Ujian "${confirmSubmit.name}" berhasil diarsipkan`);
      setConfirmSubmit(null);
      setUjianData(prev => prev.filter(u => u.id !== confirmSubmit.id));
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal mengarsipkan ujian');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentData = activeTab === 'active' ? ujianData : archivedData;

  const filteredData = useMemo(() => {
    let result = currentData.filter(ujian => {
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

    result.sort((a, b) => {
      switch (sortBy) {
        case 'score-desc': return (b.avgScore || 0) - (a.avgScore || 0);
        case 'score-asc': return (a.avgScore || 0) - (b.avgScore || 0);
        case 'nama-asc': return (a.examName || '').localeCompare(b.examName || '');
        case 'nama-desc': return (b.examName || '').localeCompare(a.examName || '');
        default: return 0;
      }
    });

    return result;
  }, [currentData, searchQuery, filterGrade, filterMajor, filterSubject, sortBy]);

  const hasFilter = searchQuery || filterSubject !== 'all' || filterGrade !== 'all' || filterMajor !== 'all';

  return (
    <TeacherLayout>
      <Breadcrumb className='mb-6'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/teacher/dashboard'><Home className='w-4 h-4' /></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Hasil Ujian</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='space-y-6'>
        <PageHeader title='Hasil Ujian' description='Lihat, nilai, dan arsipkan hasil ujian siswa' />

        {/* Tabs */}
        <div className='flex gap-2 border-b border-gray-200'>
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'active' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen className='w-4 h-4' />
            Aktif
            {ujianData.length > 0 && <Badge variant='secondary' className='text-xs ml-1'>{ujianData.length}</Badge>}
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'archived' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Archive className='w-4 h-4' />
            Arsip
            {archivedData.length > 0 && <Badge variant='secondary' className='text-xs ml-1'>{archivedData.length}</Badge>}
          </button>
        </div>

        {/* Search & Filters */}
        <FilterPanel
          activeCount={[searchQuery, isCoordinator && filterSubject !== 'all', filterGrade !== 'all', filterMajor !== 'all'].filter(Boolean).length}
          onReset={() => { setSearchQuery(''); setFilterSubject('all'); setFilterGrade('all'); setFilterMajor('all'); }}
          gridClassName={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${isCoordinator ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}
        >
            <div className='relative lg:col-span-1'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
              <Input type='text' placeholder='Cari ujian...' value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} className='pl-10 h-10 w-full' />
            </div>
            {isCoordinator && (
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className='h-10 w-full'><SelectValue placeholder='Mata Pelajaran' /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Semua Mapel</SelectItem>
                  {subjects.map(s => <SelectItem key={s.subject_id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className='h-10 w-full'><SelectValue placeholder='Tingkat' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Semua Tingkat</SelectItem>
                {gradeLevels.map(g => <SelectItem key={g.grade_level_id} value={g.value}>{g.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterMajor} onValueChange={setFilterMajor}>
              <SelectTrigger className='h-10 w-full'><SelectValue placeholder='Jurusan' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Semua Jurusan</SelectItem>
                {majors.map(m => <SelectItem key={m.major_id} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className='h-10 w-full'><SelectValue placeholder='Urutkan' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='terbaru'>Terbaru</SelectItem>
                <SelectItem value='score-desc'>Nilai Tertinggi</SelectItem>
                <SelectItem value='score-asc'>Nilai Terendah</SelectItem>
                <SelectItem value='nama-asc'>Nama A-Z</SelectItem>
                <SelectItem value='nama-desc'>Nama Z-A</SelectItem>
              </SelectContent>
            </Select>
        </FilterPanel>

        {/* Cards */}
        {isLoading ? (
          <CardSkeletonGrid count={8} variant='exam' />
        ) : filteredData.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className='text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200'
          >
            <p className='text-gray-500 text-lg'>
              {hasFilter
                ? 'Tidak ada ujian yang cocok dengan filter'
                : activeTab === 'active' ? 'Belum ada ujian yang selesai' : 'Belum ada ujian yang diarsipkan'}
            </p>
            {!hasFilter && activeTab === 'active' && (
              <p className='text-gray-400 text-sm mt-2'>
                Hasil ujian muncul setelah ujian mencapai waktu akhir dan berstatus &quot;ENDED&quot;
              </p>
            )}
          </motion.div>
        ) : (
          <StaggerList className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5'>
            <AnimatePresence mode='popLayout'>
              {filteredData.map((ujian, i) => (
                <StaggerItem key={ujian.id}>
                  <ExamResultCard
                    ujian={ujian}
                    index={i}
                    isArchived={activeTab === 'archived'}
                    onSubmit={activeTab === 'active' ? (id, name) => setConfirmSubmit({ id, name }) : undefined}
                  />
                </StaggerItem>
              ))}
            </AnimatePresence>
          </StaggerList>
        )}
      </div>

      {/* Confirm submit dialog */}
      <AlertDialog open={!!confirmSubmit} onOpenChange={(open) => !open && setConfirmSubmit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit & Arsipkan Ujian?</AlertDialogTitle>
            <AlertDialogDescription>
              Ujian <strong>&quot;{confirmSubmit?.name}&quot;</strong> akan dipindahkan ke arsip dan tidak lagi muncul di daftar hasil ujian aktif.
              Data nilai dan jawaban siswa tetap tersimpan dan dapat dilihat di tab Arsip.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitExam}
              disabled={isSubmitting}
              className='bg-orange-600 hover:bg-orange-700'
            >
              {isSubmitting ? 'Mengarsipkan...' : 'Ya, Arsipkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TeacherLayout>
  );
}

export default function HasilUjianPage() {
  return (
    <Suspense fallback={<TeacherLayout><div className='flex justify-center items-center h-64'><p className='text-gray-600'>Loading...</p></div></TeacherLayout>}>
      <HasilUjianContent />
    </Suspense>
  );
}
