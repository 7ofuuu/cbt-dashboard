'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import GuruLayout from '../../../guruLayout';
import request from '@/utils/request';

export default function DetailNilaiPage() {
  const params = useSearchParams();
  const mataPelajaran = params.get('mata') || 'Matematika';
  const kelas = params.get('kelas') || 'XII - IPA 1';
  const pesertaUjianId = params.get('pesertaUjianId');
  const ujianId = params.get('ujianId');
  
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (pesertaUjianId) {
      fetchDetailData();
    }
  }, [pesertaUjianId]);

  const fetchDetailData = async () => {
    setIsLoading(true);
    try {
      const response = await request.get(`/hasil-ujian/detail/${pesertaUjianId}`);
      console.log('Fetched detail data:', response.data);
      
      if (response?.data?.hasil_ujian) {
        const hasil = response.data.hasil_ujian;
        const siswa = response.data.siswa;
        const ujian = response.data.ujian;
        
        setData({
          nama: siswa?.nama_lengkap || 'Unknown',
          email: siswa?.email || '-',
          siswaId: siswa?.siswa_id,
          kelas: siswa?.kelas || '-',
          tingkat: siswa?.tingkat || '-',
          jurusan: siswa?.jurusan || '-',
          mataPelajaran: ujian?.mata_pelajaran || 'Unknown',
          namaUjian: ujian?.nama_ujian || '-',
          tanggalMulai: ujian?.tanggal_mulai ? new Date(ujian.tanggal_mulai).toLocaleString('id-ID') : '-',
          tanggalSelesai: hasil?.tanggal_submit ? new Date(hasil.tanggal_submit).toLocaleString('id-ID') : '-',
          statusUjian: 'DINILAI',
          nilaiAkhir: hasil?.nilai_akhir || 0,
          hasilUjianId: hasil?.hasil_ujian_id,
          review: response.data.review || [],
        });
      }
    } catch (error) {
      console.error('Error fetching detail data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <GuruLayout>
        <div className='flex justify-center items-center h-64'>
          <p className='text-gray-600'>Loading...</p>
        </div>
      </GuruLayout>
    );
  }

  if (!data) {
    return (
      <GuruLayout>
        <div className='flex justify-center items-center h-64'>
          <p className='text-gray-600'>Data not found</p>
        </div>
      </GuruLayout>
    );
  }

  return (
    <GuruLayout>
      <div>
        {/* Breadcrumb */}
        <div className='mb-6 text-sm'>
          <h1 className='text-lg font-semibold text-gray-600 mb-4'>
            <Link href='/guru/hasil-ujian' className='text-gray-600 hover:text-gray-900'>
              Hasil Ujian
            </Link>
            {' › '}
            <Link href={`/guru/hasil-ujian/list-kelas?mata=${encodeURIComponent(mataPelajaran)}&ujianId=${ujianId}`} className='text-gray-600 hover:text-gray-900'>
              {mataPelajaran}
            </Link>
            {' › '}
            <Link href={`/guru/hasil-ujian/list-siswa?mata=${encodeURIComponent(mataPelajaran)}&kelas=${encodeURIComponent(kelas)}&ujianId=${ujianId}`} className='text-gray-600 hover:text-gray-900'>
              {kelas}
            </Link>
            {' › '}
            <span className='text-gray-900 font-bold'>Beri Nilai</span>
          </h1>
        </div>

        {/* Card */}
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          {/* Header dengan student info */}
          <div className='flex border-b border-gray-200'>
            {/* Student Info */}
            <div className='flex-1 flex items-center gap-3 p-4'>
              <div className='w-14 h-14 rounded-full overflow-hidden bg-gray-300 flex-shrink-0'>
                <Image src='/next.svg' alt={data.nama} width={56} height={56} className='w-full h-full object-cover' />
              </div>

              <div className='flex-1'>
                <div className='flex items-center gap-2'>
                  <h2 className='text-base font-semibold text-gray-900'>{data.nama}</h2>
                  <div className='bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium'>
                    Siswa
                  </div>
                </div>
                <p className='text-xs text-gray-600'>{data.email}</p>
              </div>
            </div>

            {/* Subject Info */}
            <div className='flex-1 flex items-center justify-center border-l border-gray-200'>
              <div className='text-center'>
                <p className='text-lg font-semibold text-gray-900'>{data.mataPelajaran}</p>
                <p className='text-sm text-gray-600'>{data.kelas}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className='grid grid-cols-[220px_1fr] gap-y-4 p-6'>
            <div className='text-gray-700 text-sm self-center'>Nama Ujian</div>
            <input
              type='text'
              defaultValue={data.namaUjian}
              readOnly
              className='w-[720px] ml-auto px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900'
            />

            <div className='text-gray-700 text-sm self-center'>Selesai di</div>
            <input
              type='text'
              defaultValue={data.tanggalSelesai}
              readOnly
              className='w-[720px] ml-auto px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900'
            />

            <div className='text-gray-700 text-sm self-center'>Status</div>
            <input
              type='text'
              defaultValue={data.statusUjian}
              readOnly
              className='w-[720px] ml-auto px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900'
            />

            <div className='text-gray-700 text-sm self-center'>Nilai Akhir</div>
            <input
              type='text'
              defaultValue={data.nilaiAkhir}
              readOnly
              className='w-[720px] ml-auto px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-900'
            />
          </div>
        </div>

        {/* Button */}
        <div className='mt-6'>
          <button
            className='bg-blue-900 hover:bg-blue-800 text-white px-6 py-2.5 rounded-lg font-semibold transition'
            onClick={() => {
              const url = `/guru/hasil-ujian/list-siswa/detail/essay?mata=${encodeURIComponent(mataPelajaran)}&kelas=${encodeURIComponent(kelas)}&ujianId=${ujianId}&pesertaUjianId=${encodeURIComponent(pesertaUjianId)}&page=1`;
              window.location.href = url;
            }}
          >
            Nilai Essay
          </button>
        </div>
      </div>
    </GuruLayout>
  );
}