'use client';

import { useEffect, useMemo, useState } from 'react';
import TeacherLayout from '../teacherLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Search, Plus, RefreshCw, Eye, BookOpen, FileText, ListChecks, Home, Filter, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import request from '@/utils/request';
import toast from 'react-hot-toast';
import { useTaxonomy } from '@/contexts/TaxonomyContext';
import { useSubjectThemes } from '@/hooks/useSubjectTheme';
import { motion } from 'framer-motion';
import CardSkeletonGrid from '@/components/motion/card-skeleton-grid';
import FilterPanel from '@/components/filter-panel';
import { StaggerList, StaggerItem } from '@/components/motion/stagger-list';
import { AnimatedCard } from '@/components/motion/animated-card';

export default function BankSoalPage() {
  useAuth(['teacher']);
  const router = useRouter();
  const { gradeLevels, majors } = useTaxonomy();
  const { themeFor } = useSubjectThemes();

  const [bankSoal, setBankSoal] = useState([]);
  const [totalSoal, setTotalSoal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [filterTingkat, setFilterTingkat] = useState('all');
  const [filterJurusan, setFilterJurusan] = useState('all');
  const [sortBy, setSortBy] = useState('terbanyak');

  const fetchBankSoal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await request.get('/questions/bank');
      const data = res.data?.question_bank || [];
      setBankSoal(data);
      setTotalSoal(res.data?.total_questions || 0);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Gagal mengambil data');
      toast.error('Gagal memuat bank soal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankSoal();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, []);

  // Statistik
  const stats = useMemo(() => {
    const totalPG = bankSoal.reduce((sum, b) => sum + (b.mc_count || 0), 0);
    const totalEssay = bankSoal.reduce((sum, b) => sum + (b.essay_count || 0), 0);
    return {
      totalBank: bankSoal.length,
      totalSoal,
      totalPG,
      totalEssay
    };
  }, [bankSoal, totalSoal]);

  const filteredAndSortedBanks = useMemo(() => {
    let result = [...bankSoal];

    // Filter search query
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        b =>
          b.subject.toLowerCase().includes(q) ||
          b.grade_level.toLowerCase().includes(q) ||
          (b.major && b.major.toLowerCase().includes(q))
      );
    }

    // Filter by grade_level
    if (filterTingkat !== 'all') {
      result = result.filter(b => b.grade_level === filterTingkat);
    }

    // Filter by major
    if (filterJurusan !== 'all') {
      result = result.filter(b => b.major === filterJurusan);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'terbanyak':
          return (b.total_questions || 0) - (a.total_questions || 0);
        case 'tersedikit':
          return (a.total_questions || 0) - (b.total_questions || 0);
        case 'nama-asc':
          return a.subject.localeCompare(b.subject);
        case 'nama-desc':
          return b.subject.localeCompare(a.subject);
        default:
          return 0;
      }
    });

    return result;
  }, [bankSoal, query, filterTingkat, filterJurusan, sortBy]);

  const handleViewDetail = (bank) => {
    router.push(`/teacher/question-bank/${bank.question_bank_id}`);
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
            <BreadcrumbPage>Bank Soal</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='space-y-6'>
        <PageHeader
          title="Bank Soal"
          description="Kelola dan lihat semua bank soal yang tersedia"
        >
          <div className='flex items-center gap-3'>
            <Link href='/teacher/add-question'>
              <Button className='bg-[#03356C] hover:bg-[#02509E] text-white flex items-center gap-2'>
                <Plus className='w-4 h-4' /> Tambah Bank Soal
              </Button>
            </Link>
            <Button
              onClick={fetchBankSoal}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className='w-4 h-4' /> Segarkan
            </Button>
          </div>
        </PageHeader>

        {/* Statistik Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <Card className='p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-blue-600 font-medium'>Total Bank Soal</p>
                <p className='text-3xl font-bold text-blue-700 mt-1'>{stats.totalBank}</p>
              </div>
              <div className='w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center'>
                <BookOpen className='w-6 h-6 text-blue-700' />
              </div>
            </div>
          </Card>

          <Card className='p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-purple-600 font-medium'>Total Semua Soal</p>
                <p className='text-3xl font-bold text-purple-700 mt-1'>{stats.totalSoal}</p>
              </div>
              <div className='w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center'>
                <FileText className='w-6 h-6 text-purple-700' />
              </div>
            </div>
          </Card>

          <Card className='p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-green-600 font-medium'>Pilihan Ganda</p>
                <p className='text-3xl font-bold text-green-700 mt-1'>{stats.totalPG}</p>
              </div>
              <div className='w-12 h-12 bg-green-200 rounded-full flex items-center justify-center'>
                <ListChecks className='w-6 h-6 text-green-700' />
              </div>
            </div>
          </Card>

          <Card className='p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-orange-600 font-medium'>Essay</p>
                <p className='text-3xl font-bold text-orange-700 mt-1'>{stats.totalEssay}</p>
              </div>
              <div className='w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center'>
                <FileText className='w-6 h-6 text-orange-700' />
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <FilterPanel
          activeCount={[query, filterTingkat !== 'all', filterJurusan !== 'all'].filter(Boolean).length}
          onReset={() => { setQuery(''); setFilterTingkat('all'); setFilterJurusan('all'); }}
        >
            <div className='relative lg:col-span-1'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Cari bank soal...'
                className='pl-10 h-10 w-full'
              />
            </div>

            <Select value={filterTingkat} onValueChange={setFilterTingkat}>
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

            <Select value={filterJurusan} onValueChange={setFilterJurusan}>
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
                <SelectItem value='terbanyak'>Terbanyak</SelectItem>
                <SelectItem value='tersedikit'>Tersedikit</SelectItem>
                <SelectItem value='nama-asc'>Nama A-Z</SelectItem>
                <SelectItem value='nama-desc'>Nama Z-A</SelectItem>
              </SelectContent>
            </Select>
        </FilterPanel>

        {/* Bank Soal Cards */}
        {loading ? (
          <CardSkeletonGrid count={10} variant='bank' className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4' />
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='text-red-600 bg-red-50 p-4 rounded-lg'
          >
            Error: {error}
          </motion.div>
        ) : filteredAndSortedBanks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className='col-span-full text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200'
          >
            <div className='w-16 h-16 mx-auto rounded-full bg-gray-50 flex items-center justify-center mb-3'>
              <Search className='w-8 h-8 text-gray-300' />
            </div>
            <p className='text-gray-700 font-medium mb-1'>
              {query || filterTingkat !== 'all' || filterJurusan !== 'all'
                ? 'Tidak ada bank soal yang cocok'
                : 'Belum ada bank soal'}
            </p>
            <p className='text-sm text-gray-500 mb-4'>
              {query || filterTingkat !== 'all' || filterJurusan !== 'all'
                ? 'Coba longgarkan kata kunci atau filter Anda.'
                : 'Mulai dengan membuat soal pertama Anda.'}
            </p>
            {!query && filterTingkat === 'all' && filterJurusan === 'all' && (
              <Link href='/teacher/add-question'>
                <Button className='bg-[#03356C] hover:bg-[#02509E]'>
                  <Plus className='w-4 h-4 mr-2' /> Buat Soal Pertama
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <StaggerList className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
            {filteredAndSortedBanks.map((bank) => {
              const classroom = `${bank.grade_level}${bank.major ? ` - ${bank.major}` : ''}`;
              const theme = themeFor(bank.subject);

              return (
                <StaggerItem key={bank.question_bank_id}>
                  <AnimatedCard
                    className={`rounded-xl hover:shadow-xl transition-shadow overflow-hidden shadow-md border bg-white ${theme.border} h-full flex flex-col`}
                  >
                    {/* Header dengan Gradient */}
                    <div className={`${theme.header} px-5 py-4 text-white`}>
                      <h4 className='font-bold text-lg mb-1'>{bank.subject}</h4>
                      <p className='text-sm opacity-90 lowercase'>{classroom}</p>
                    </div>

                    {/* Content */}
                    <div className='px-5 py-4 bg-white space-y-3 flex-1 flex flex-col'>
                      {bank.teacher && (
                        <div className='flex justify-between items-center text-sm'>
                          <span className='text-gray-600'>Pembuat:</span>
                          <span className='font-medium text-gray-700 truncate ml-2'>{bank.teacher.full_name}</span>
                        </div>
                      )}

                      <div className='flex justify-between items-center'>
                        <span className='text-gray-600 font-medium'>Total Soal:</span>
                        <span className='font-bold text-3xl text-gray-900'>{bank.total_questions}</span>
                      </div>

                      <div className='space-y-2 text-sm'>
                        <div className='flex justify-between items-center'>
                          <span className='text-gray-600'>Pilihan Ganda:</span>
                          <span className='font-semibold text-lg text-green-600'>{bank.mc_count}</span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <span className='text-gray-600'>Essay:</span>
                          <span className='font-semibold text-lg text-purple-600'>{bank.essay_count}</span>
                        </div>
                      </div>

                      <div className='pt-2 mt-auto'>
                        <Button
                          onClick={() => handleViewDetail(bank)}
                          size='sm'
                          variant='ghost'
                          className={`w-full flex items-center justify-center gap-2 border transition-colors hover:opacity-90 ${theme.border} ${theme.button}`}
                        >
                          <Eye className='w-4 h-4' />
                          Lihat Detail
                        </Button>
                      </div>
                    </div>
                  </AnimatedCard>
                </StaggerItem>
              );
            })}
          </StaggerList>
        )}
      </div>
    </TeacherLayout>
  );
}
