'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import GuruLayout from '../../../../guruLayout';
import request from '@/utils/request';

function Question({ jawabanId, number, text, answer, score, onScoreChange }) {
  return (
    <div className='border-l-4 border-blue-500 pl-4 py-4 mb-6'>
      <p className='font-semibold text-gray-800 mb-1'>Pertanyaan {number}</p>
      <p className='text-gray-700 mb-3'>{text}</p>

      <p className='text-gray-600 font-medium mb-2'>Jawaban</p>
      <div className='border rounded-lg p-4 text-gray-800 bg-white'>
        {answer || 'Tidak ada jawaban'}
      </div>

      <div className='mt-3 flex items-center gap-3'>
        <span className='text-gray-700 font-medium'>Masukkan Nilai:</span>
        <input
          type='number'
          min={0}
          max={100}
          value={score || ''}
          onChange={(e) => onScoreChange(jawabanId, e.target.value)}
          placeholder='Angka 0-100'
          className='w-32 px-3 py-2 border rounded-lg text-sm'
        />
      </div>
    </div>
  );
}

export default function BeriNilaiEssayPage() {
  const params = useSearchParams();
  const mataPelajaran = params.get('mata') || 'Matematika';
  const kelas = params.get('kelas') || 'XII - IPA 1';
  const pesertaUjianId = params.get('pesertaUjianId');
  const page = Number(params.get('page') || '1');

  const [essayQuestions, setEssayQuestions] = useState([]);
  const [scores, setScores] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (pesertaUjianId) {
      fetchEssayData();
    }
  }, [pesertaUjianId]);

  const fetchEssayData = async () => {
    setIsLoading(true);
    try {
      const response = await request.get(`/hasil-ujian/detail/${pesertaUjianId}`);
      console.log('Fetched essay data:', response.data);
      
      if (response?.data?.review && Array.isArray(response.data.review)) {
        // Filter only essay questions
        const essayQuestions = response.data.review.filter(
          (item) => item.soal?.tipe_soal === 'ESSAY'
        );
        
        console.log('Essay questions:', essayQuestions);
        setEssayQuestions(essayQuestions);
        
        // Initialize scores with existing nilai_manual
        const initialScores = {};
        essayQuestions.forEach((item) => {
          initialScores[item.jawaban?.jawaban_id] = item.jawaban?.nilai_manual || '';
        });
        setScores(initialScores);
      }
    } catch (error) {
      console.error('Error fetching essay data:', error);
      toast.error('Gagal memuat data essay');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreChange = (jawabanId, value) => {
    setScores((prev) => ({
      ...prev,
      [jawabanId]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validate all scores
    const invalidScores = Object.entries(scores).filter(([jawabanId, score]) => {
      if (score === '' || score === null || score === undefined) return true;
      const num = Number(score);
      return isNaN(num) || num < 0 || num > 100;
    });

    if (invalidScores.length > 0) {
      toast.error('Harap isi semua nilai dengan benar (0-100)');
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Loop through each question and submit score
      for (const item of essayQuestions) {
        const jawabanId = item.jawaban?.jawaban_id;
        const nilaiManual = Number(scores[jawabanId]);

        console.log('Submitting:', { jawaban_id: jawabanId, nilai_manual: nilaiManual });

        try {
          const response = await request.put('/hasil-ujian/nilai-manual', {
            jawaban_id: jawabanId,
            nilai_manual: nilaiManual,
          });
          console.log('Success response:', response.data);
          successCount++;
        } catch (error) {
          console.error(`Error submitting score for jawaban ${jawabanId}:`, error);
          console.error('Error response:', error.response?.data);
          failCount++;
        }
      }

      if (failCount === 0) {
        toast.success('Semua nilai essay berhasil disimpan!');
        // Redirect back to detail page
        setTimeout(() => {
          window.location.href = `/guru/hasil-ujian/list-siswa/detail?mata=${encodeURIComponent(mataPelajaran)}&kelas=${encodeURIComponent(kelas)}&pesertaUjianId=${pesertaUjianId}`;
        }, 1500);
      } else {
        toast.error(`${successCount} nilai berhasil, ${failCount} gagal disimpan`);
      }
    } catch (error) {
      console.error('Error in submit process:', error);
      toast.error('Terjadi kesalahan saat menyimpan nilai');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pagination logic
  const itemsPerPage = 2;
  const totalPages = Math.ceil(essayQuestions.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuestions = essayQuestions.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <GuruLayout>
        <div className='flex justify-center items-center h-64'>
          <p className='text-gray-600'>Loading...</p>
        </div>
      </GuruLayout>
    );
  }

  return (
    <GuruLayout>
      <div>
        {/* Breadcrumb */}
        <div className='mb-6 text-sm'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            <Link href='/guru/hasil-ujian' className='text-gray-600 hover:text-gray-900'>Hasil Ujian</Link>
            {' › '}
            <Link href={`/guru/hasil-ujian/list-kelas?mata=${encodeURIComponent(mataPelajaran)}`} className='text-gray-600 hover:text-gray-900'>
              {mataPelajaran}
            </Link>
            {' › '}
            <Link href={`/guru/hasil-ujian/list-siswa?mata=${encodeURIComponent(mataPelajaran)}&kelas=${encodeURIComponent(kelas)}`} className='text-gray-600 hover:text-gray-900'>
              {kelas}
            </Link>
            {' › '}
            <Link href={`/guru/hasil-ujian/list-siswa/detail?mata=${encodeURIComponent(mataPelajaran)}&kelas=${encodeURIComponent(kelas)}&pesertaUjianId=${encodeURIComponent(pesertaUjianId)}`} className='text-gray-600 hover:text-gray-900'>
              Beri Nilai
            </Link>
            {' › '}
            <span>Beri Nilai Essay</span>
          </h1>
        </div>

        {/* Questions */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          {currentQuestions.length > 0 ? (
            currentQuestions.map((item, index) => (
              <Question
                key={item.jawaban?.jawaban_id}
                jawabanId={item.jawaban?.jawaban_id}
                number={startIndex + index + 1}
                text={item.soal?.teks_soal || 'Soal tidak tersedia'}
                answer={item.jawaban?.teks_jawaban}
                score={scores[item.jawaban?.jawaban_id]}
                onScoreChange={handleScoreChange}
              />
            ))
          ) : (
            <p className='text-gray-500 text-center py-8'>Tidak ada soal essay</p>
          )}

          {/* Footer with submit and pagination */}
          <div className='grid grid-cols-3 items-center pt-2'>
            <div>
              {page === totalPages && essayQuestions.length > 0 ? (
                <button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className='bg-blue-900 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed'
                >
                  {isSubmitting ? 'Menyimpan...' : 'Submit nilai'}
                </button>
              ) : null}
            </div>

            {/* Pagination */}
            <div className='flex items-center justify-center gap-2'>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Link
                  key={pageNum}
                  href={`/guru/hasil-ujian/list-siswa/detail/essay?mata=${encodeURIComponent(mataPelajaran)}&kelas=${encodeURIComponent(kelas)}&pesertaUjianId=${encodeURIComponent(pesertaUjianId)}&page=${pageNum}`}
                  className={`px-3 py-1 rounded ${page === pageNum ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {pageNum}
                </Link>
              ))}
            </div>

            <div />
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </GuruLayout>
  );
}
