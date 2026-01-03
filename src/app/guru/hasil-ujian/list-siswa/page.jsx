'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import GuruLayout from '../../guruLayout';
import request from '@/utils/request';

export default function ListSiswaPage() {
  const params = useSearchParams();
  const mataPelajaran = params.get('mata') || 'Matematika';
  const kelas = params.get('kelas') || 'XII - IPA 1';
  const ujianId = params.get('ujianId');

  const [query, setQuery] = useState('');
  const [siswaData, setSiswaData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (ujianId) {
      fetchSiswaList();
    }
  }, [ujianId]);

  const fetchSiswaList = async () => {
    setIsLoading(true);
    try {
      const response = await request.get(`/hasil-ujian/ujian/${ujianId}`);
      console.log('Fetched hasil ujian:', response.data);
      
      if (response?.data?.hasil && Array.isArray(response.data.hasil)) {
        const transformedSiswa = response.data.hasil.map((item) => ({
          id: item.peserta_ujian_id,
          email: item.pesertaUjian?.siswa?.email || '-',
          nama: item.pesertaUjian?.siswa?.nama_lengkap || 'Unknown',
          nilai: item.nilai_akhir,
          kelas: item.pesertaUjian?.siswa?.kelas || '-',
          selesai: item.tanggal_submit ? new Date(item.tanggal_submit).toLocaleDateString('id-ID') : '-',
          statusUjian: item.pesertaUjian?.status_ujian,
        }));
        setSiswaData(transformedSiswa);
      }
    } catch (error) {
      console.error('Error fetching siswa list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = siswaData.filter((s) => {
    const target = `${s.email} ${s.nama} ${s.kelas}`.toLowerCase();
    return target.includes(query.toLowerCase());
  });

  return (
    <GuruLayout>
      <div>
        {/* Breadcrumb title */}
        <h1 className='text-2xl font-bold text-gray-900 mb-4'>
          <Link href='/guru/hasil-ujian' className='text-gray-600 hover:text-gray-900'>
            Hasil Ujian
          </Link>
          {' › '}
          <Link href={`/guru/hasil-ujian/list-kelas?mata=${encodeURIComponent(mataPelajaran)}`} className='text-gray-600 hover:text-gray-900'>
            {mataPelajaran}
          </Link>
          {' › '}<span>{kelas}</span>
        </h1>

        {/* Search */}
        <div className='relative mb-4'>
          <input
            type='text'
            placeholder='Cari Siswa'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className='w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
          />
          <Search className='absolute right-4 top-3 w-5 h-5 text-gray-400' />
        </div>

        {/* Table */}
        <div className='overflow-x-auto bg-white rounded-lg border border-gray-200'>
          <table className='min-w-full text-sm'>
            <thead className='bg-gray-100 text-gray-700'>
              <tr>
                <th className='text-left px-4 py-3 w-24'>Foto</th>
                <th className='text-left px-4 py-3'>Mapel</th>
                <th className='text-left px-4 py-3'>Nama</th>
                <th className='text-left px-4 py-3'>Nilai</th>
                <th className='text-left px-4 py-3'>Kelas</th>
                <th className='text-left px-4 py-3'>Selesai</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className='border-t hover:bg-gray-50 cursor-pointer' onClick={() => window.location.href = `/guru/hasil-ujian/list-siswa/detail?mata=${encodeURIComponent(mataPelajaran)}&kelas=${encodeURIComponent(kelas)}&pesertaUjianId=${s.id}`}>
                  <td className='px-4 py-3'>
                    <div className='w-10 h-10 rounded-full overflow-hidden bg-gray-200'>
                      <Image src='/next.svg' alt={s.nama} width={40} height={40} className='w-full h-full object-cover' />
                    </div>
                  </td>
                  <td className='px-4 py-3 text-gray-900'>{s.email}</td>
                  <td className='px-4 py-3 text-gray-900'>{s.nama}</td>
                  <td className='px-4 py-3 text-gray-900'>{s.nilai === null ? 'Not Reviewed' : s.nilai}</td>
                  <td className='px-4 py-3 text-gray-900'>{s.kelas}</td>
                  <td className='px-4 py-3 text-gray-900'>{s.selesai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </GuruLayout>
  );
}
