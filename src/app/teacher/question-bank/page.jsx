'use client';

import { useEffect, useMemo, useState } from 'react';
import TeacherLayout from '../teacherLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Search, Plus, RefreshCw, Eye, BookOpen, FileText, ListChecks, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import request from '@/utils/request';
import toast from 'react-hot-toast';
import { GRADE_LEVELS, MAJOR_OPTIONS } from '@/lib/constants';

export default function BankSoalPage() {
  useAuth(['teacher']);
  const router = useRouter();

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

  const getBankColor = (mataPelajaran) => {
    const subject = (mataPelajaran || '').toLowerCase();
    if (subject.includes('matematika')) return 'bg-teal-700 text-white';
    if (subject.includes('fisika')) return 'bg-sky-700 text-white';
    if (subject.includes('biologi')) return 'bg-emerald-600 text-white';
    if (subject.includes('kimia')) return 'bg-fuchsia-600 text-white';
    if (subject.includes('bahasa')) return 'bg-violet-400 text-white';
    return 'bg-gray-200 text-gray-800';
  };

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
        <div className='flex flex-col sm:flex-row items-center gap-4'>
          <div className='flex-1 w-full'>
            <div className='relative'>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Cari Bank Soal (mata pelajaran, tingkat, atau jurusan)'
                className='pr-10'
              />
              <div className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'>
                <Search className='w-5 h-5' />
              </div>
            </div>
          </div>

          <Select value={filterTingkat} onValueChange={setFilterTingkat}>
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

          <Select value={filterJurusan} onValueChange={setFilterJurusan}>
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
              <SelectItem value='terbanyak'>Terbanyak</SelectItem>
              <SelectItem value='tersedikit'>Tersedikit</SelectItem>
              <SelectItem value='nama-asc'>Nama A-Z</SelectItem>
              <SelectItem value='nama-desc'>Nama Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bank Soal Cards */}
        {loading ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
              <Card key={i} className='rounded-lg animate-pulse'>
                <div className='-mt-6 px-6'>
                  <div className='h-20 bg-gray-300 rounded-t-lg'></div>
                </div>
                <div className='px-6 pt-4 pb-6 space-y-3'>
                  <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                  <div className='h-4 bg-gray-200 rounded w-full'></div>
                  <div className='h-4 bg-gray-200 rounded w-2/3'></div>
                  <div className='h-8 bg-gray-200 rounded mt-4'></div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className='text-red-600 bg-red-50 p-4 rounded-lg'>
            Error: {error}
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
            {filteredAndSortedBanks.length === 0 && (
              <div className='col-span-full text-center py-12'>
                <div className='text-gray-400 mb-2'>
                  <Search className='w-12 h-12 mx-auto mb-3' />
                </div>
                <p className='text-gray-500 mb-4'>
                  {query || filterTingkat !== 'all' || filterJurusan !== 'all'
                    ? 'Tidak ada bank soal yang cocok dengan filter'
                    : 'Belum ada bank soal'}
                </p>
                {!query && filterTingkat === 'all' && filterJurusan === 'all' && (
                  <Link href='/teacher/add-question'>
                    <Button className='bg-[#03356C] hover:bg-[#02509E]'>
                      <Plus className='w-4 h-4 mr-2' /> Buat Soal Pertama
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {filteredAndSortedBanks.map(bank => {
              const classroom = `${bank.grade_level}${bank.major ? ` - ${bank.major}` : ''}`;
              const color = getBankColor(bank.subject);

              return (
                <Card key={bank.question_bank_id} className='rounded-xl hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-md'>
                  {/* Header dengan Gradient */}
                  <div className={`${color} px-5 py-4`}>
                    <h4 className='font-bold text-lg mb-1'>{bank.subject}</h4>
                    <p className='text-sm opacity-90 lowercase'>{classroom}</p>
                  </div>

                  {/* Content */}
                  <div className='px-5 py-4 bg-white space-y-3'>
                    {/* Pembuat */}
                    {bank.teacher && (
                      <div className='flex justify-between items-center text-sm'>
                        <span className='text-gray-600'>Pembuat:</span>
                        <span className='font-medium text-blue-600'>{bank.teacher.full_name}</span>
                      </div>
                    )}

                    {/* Total Soal - Featured */}
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600 font-medium'>Total Soal:</span>
                      <span className='font-bold text-3xl text-blue-600'>{bank.total_questions}</span>
                    </div>

                    {/* Detail Soal */}
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

                    {/* Action Button */}
                    <div className='pt-2'>
                      <Button
                        onClick={() => handleViewDetail(bank)}
                        size='sm'
                        variant='outline'
                        className='w-full flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors'
                      >
                        <Eye className='w-4 h-4' />
                        Lihat Detail
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
