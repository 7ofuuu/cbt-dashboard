'use client';

import { useEffect, useMemo, useState } from 'react';
import GuruLayout from '../guruLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import Link from 'next/link';
import request from '@/utils/request';
import { getUser } from '@/utils/auth';
import toast from 'react-hot-toast';

export default function BankSoalPage() {
  useAuth(['guru']);

  const [soals, setSoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchSoals = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await request.get('/soal');
        const data = res.data?.soals || [];
        if (mounted) setSoals(data);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.error || err.message || 'Gagal mengambil data');
        toast.error('Gagal memuat bank soal');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSoals();

    return () => {
      mounted = false;
    };
  }, []);

  const banks = useMemo(() => {
    // group by mata_pelajaran + tingkat + jurusan
    const map = new Map();

    soals.forEach(s => {
      const key = `${s.mata_pelajaran || 'Umum'}|${s.tingkat || ''}|${s.jurusan || ''}`;
      const cur = map.get(key) || { title: s.mata_pelajaran || 'Umum', tingkat: s.tingkat || '', jurusan: s.jurusan || '', items: [] };
      cur.items.push(s);
      map.set(key, cur);
    });

    const arr = Array.from(map.values()).map(group => {
      const pilihan = group.items.filter(i => i.tipe_soal !== 'ESSAY').length;
      const essay = group.items.filter(i => i.tipe_soal === 'ESSAY').length;
      const createdAt = group.items[0]?.createdAt;
      const created = createdAt ? new Date(createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

      // pick a color based on subject name
      const subject = (group.title || '').toLowerCase();
      const color = subject.includes('matematika') ? 'bg-teal-700 text-white' : subject.includes('fisika') ? 'bg-sky-700 text-white' : subject.includes('biologi') ? 'bg-emerald-600 text-white' : subject.includes('kimia') ? 'bg-fuchsia-600 text-white' : subject.includes('bahasa') ? 'bg-violet-400 text-white' : 'bg-gray-200 text-gray-800';

      return {
        id: `${group.title}-${group.tingkat}-${group.jurusan}`,
        title: group.title,
        kelas: `${group.tingkat}${group.jurusan ? ' - ' + group.jurusan : ''}`,
        pilihan,
        essay,
        created,
        color
      };
    });

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return arr.filter(b => b.title.toLowerCase().includes(q) || b.kelas.toLowerCase().includes(q));
    }

    return arr;
  }, [soals, query]);

  const user = getUser();

  return (
    <GuruLayout>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold'>Bank Soal</h2>
            {user?.profile?.nama_lengkap && <p className='text-sm text-gray-600'>Halo, {user.profile.nama_lengkap}</p>}
          </div>
          <div className='flex items-center gap-3'>
            <Link href='/guru/tambah-soal'>
              <Button className='bg-[#03356C] hover:bg-[#02509E] text-white flex items-center gap-2'>
                <Plus className='w-4 h-4' /> Tambah Bank Soal
              </Button>
            </Link>
            <Button onClick={() => {
              setLoading(true);
              request.get('/soal').then(r => setSoals(r.data?.soals || [])).catch(e => toast.error('Gagal memuat bank soal')).finally(() => setLoading(false));
            }}>Segarkan</Button>
          </div>
        </div>

        <div className='flex items-center gap-4'>
          <div className='flex-1'>
            <div className='relative'>
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder='Cari Bank Soal (mata pelajaran atau kelas)' className='pr-10' />
              <div className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'>
                <Search className='w-5 h-5' />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div>Memuat...</div>
        ) : error ? (
          <div className='text-red-600'>Error: {error}</div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
            {banks.length === 0 && <div className='text-gray-500'>Belum ada bank soal. Buat bank soal baru dengan menambahkan soal.</div>}

            {banks.map(b => (
              <Card key={b.id} className='rounded-lg'>
                <div className='-mt-6 px-6'>
                  <div className={`rounded-t-lg px-4 py-3 ${b.color} `}>
                    <h4 className='font-semibold'>{b.title}</h4>
                    <p className='text-sm'>{b.kelas}</p>
                  </div>
                </div>
                <div className='px-6 pt-4 pb-6 bg-white rounded-b-lg -mt-2 text-sm text-gray-600'>
                  <div className='mb-2'>Isi Pilihan Ganda : <span className='font-medium'>{b.pilihan}</span></div>
                  <div className='mb-2'>Isi Essay : <span className='font-medium'>{b.essay}</span></div>
                  <div>Dibuat pada : <span className='font-medium'>{b.created}</span></div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </GuruLayout>
  );
}
