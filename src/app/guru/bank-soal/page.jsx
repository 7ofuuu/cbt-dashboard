'use client';

import { useEffect, useMemo, useState } from 'react';
import GuruLayout from '../guruLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, RefreshCw, Eye, BookOpen, FileText, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import request from '@/utils/request';
import { getUser } from '@/utils/auth';
import toast from 'react-hot-toast';

export default function BankSoalPage() {
  useAuth(['guru']);
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
      const res = await request.get('/soal/bank');
      const data = res.data?.bankSoal || [];
      setBankSoal(data);
      setTotalSoal(res.data?.total_soal || 0);
    } catch (err) {
      console.error(err);
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
    const totalPG = bankSoal.reduce((sum, b) => sum + (b.jumlah_pg || 0), 0);
    const totalEssay = bankSoal.reduce((sum, b) => sum + (b.jumlah_essay || 0), 0);
    return {
      totalBank: bankSoal.length,
      totalSoal,
      totalPG,
      totalEssay
    };
  }, [bankSoal, totalSoal]);

  const filteredAndSortedBanks = useMemo(() => {
    let result = [...bankSoal];

    // Filter by search query
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        b => 
          b.mata_pelajaran.toLowerCase().includes(q) || 
          b.tingkat.toLowerCase().includes(q) ||
          (b.jurusan && b.jurusan.toLowerCase().includes(q))
      );
    }

    // Filter by tingkat
    if (filterTingkat !== 'all') {
      result = result.filter(b => b.tingkat === filterTingkat);
    }

    // Filter by jurusan
    if (filterJurusan !== 'all') {
      result = result.filter(b => b.jurusan === filterJurusan);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'terbanyak':
          return (b.jumlah_soal || 0) - (a.jumlah_soal || 0);
        case 'tersedikit':
          return (a.jumlah_soal || 0) - (b.jumlah_soal || 0);
        case 'nama-asc':
          return a.mata_pelajaran.localeCompare(b.mata_pelajaran);
        case 'nama-desc':
          return b.mata_pelajaran.localeCompare(a.mata_pelajaran);
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

  const user = getUser();

  const handleViewDetail = (bank) => {
    const bankId = `${bank.mata_pelajaran}-${bank.tingkat}-${bank.jurusan || 'umum'}`;
    router.push(`/guru/bank-soal/${encodeURIComponent(bankId)}`);
  };

  return (
    <GuruLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold'>Bank Soal</h2>
          <div className='flex items-center gap-3'>
            <Link href='/guru/tambah-soal'>
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
        </div>

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
              <SelectItem value='X'>Tingkat X</SelectItem>
              <SelectItem value='XI'>Tingkat XI</SelectItem>
              <SelectItem value='XII'>Tingkat XII</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterJurusan} onValueChange={setFilterJurusan}>
            <SelectTrigger className='w-full sm:w-40'>
              <SelectValue placeholder='Jurusan' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Semua Jurusan</SelectItem>
              <SelectItem value='IPA'>IPA</SelectItem>
              <SelectItem value='IPS'>IPS</SelectItem>
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
                  <Link href='/guru/tambah-soal'>
                    <Button className='bg-[#03356C] hover:bg-[#02509E]'>
                      <Plus className='w-4 h-4 mr-2' /> Buat Soal Pertama
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {filteredAndSortedBanks.map(bank => {
              const bankId = `${bank.mata_pelajaran}-${bank.tingkat}-${bank.jurusan || 'umum'}`;
              const kelas = `${bank.tingkat}${bank.jurusan ? ` - ${bank.jurusan}` : ''}`;
              const color = getBankColor(bank.mata_pelajaran);

              return (
                <Card key={bankId} className='rounded-xl hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-md'>
                  {/* Header dengan Gradient */}
                  <div className={`${color} px-5 py-4`}>
                    <h4 className='font-bold text-lg mb-1'>{bank.mata_pelajaran}</h4>
                    <p className='text-sm opacity-90 lowercase'>{kelas}</p>
                  </div>

                  {/* Content */}
                  <div className='px-5 py-4 bg-white space-y-3'>
                    {/* Total Soal - Featured */}
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600 font-medium'>Total Soal:</span>
                      <span className='font-bold text-3xl text-blue-600'>{bank.jumlah_soal}</span>
                    </div>

                    {/* Detail Soal */}
                    <div className='space-y-2 text-sm'>
                      <div className='flex justify-between items-center'>
                        <span className='text-gray-600'>Pilihan Ganda:</span>
                        <span className='font-semibold text-lg text-green-600'>{bank.jumlah_pg}</span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-gray-600'>Essay:</span>
                        <span className='font-semibold text-lg text-purple-600'>{bank.jumlah_essay}</span>
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
    </GuruLayout>
  );
}
