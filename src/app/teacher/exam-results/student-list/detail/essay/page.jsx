'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { Home, CheckCircle, AlertCircle } from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import toast from 'react-hot-toast';
import TeacherLayout from '../../../../teacherLayout';
import request from '@/utils/request';
import { useAuth } from '@/hooks/useAuth';

function stripGradePrefix(text) {
  return (text || '').replace(/^\[.*?\]\s*/, '');
}

function Question({ jawabanId, number, text, answer, initialScore }) {
  const hasAnswer = jawabanId !== null && jawabanId !== undefined;
  const [score, setScore] = useState(initialScore ?? '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(initialScore !== null && initialScore !== undefined && initialScore !== '');

  const validate = useCallback((val) => {
    if (val === '' || val === null || val === undefined) {
      return 'Nilai tidak boleh kosong';
    }
    const num = Number(val);
    if (isNaN(num)) return 'Nilai harus berupa angka';
    if (!Number.isInteger(num)) return 'Nilai harus bilangan bulat';
    if (num < 0) return 'Nilai minimal 0';
    if (num > 100) return 'Nilai maksimal 100';
    return '';
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setScore(val);
    setIsSaved(false);
    if (val !== '') {
      setError(validate(val));
    } else {
      setError('');
    }
  };

  const handleSubmit = async () => {
    const validationError = validate(score);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setIsSaving(true);
    try {
      await request.put('/exam-results/manual-score', {
        answer_id: jawabanId,
        manual_score: Number(score),
      });
      toast.success(`Nilai pertanyaan ${number} berhasil disimpan`);
      setIsSaved(true);
      setError('');
    } catch (err) {
      // toast handled by axios interceptor in request.jsx
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`border-l-4 ${error ? 'border-red-500' : isSaved ? 'border-green-500' : 'border-blue-500'} pl-4 py-4 mb-6`}>
      <div className='flex items-center gap-2 mb-1'>
        <p className='font-semibold text-gray-800'>Pertanyaan {number}</p>
        {isSaved && !error && <CheckCircle className='w-4 h-4 text-green-500' />}
        {error && <AlertCircle className='w-4 h-4 text-red-500' />}
      </div>
      <p className='text-gray-700 mb-3'>{stripGradePrefix(text)}</p>

      <p className='text-gray-600 font-medium mb-2'>Jawaban</p>
      <div className='border rounded-lg p-4 text-gray-800 bg-white'>
        {answer || <span className='text-gray-400 italic'>Tidak ada jawaban</span>}
      </div>

      <div className='mt-3'>
        {!hasAnswer ? (
          <p className='text-gray-400 italic text-sm'>Siswa tidak menjawab — nilai otomatis 0</p>
        ) : (
        <div className='flex items-center gap-3'>
          <span className='text-gray-700 font-medium'>Masukkan Nilai:</span>
          <input
            type='number'
            min={0}
            max={100}
            step={1}
            value={score}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            placeholder='0-100'
            className={`w-28 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-400 focus:ring-red-300 bg-red-50'
                : isSaved
                ? 'border-green-400 focus:ring-green-300 bg-green-50'
                : 'border-gray-300 focus:ring-blue-300'
            }`}
          />
          <button
            onClick={handleSubmit}
            disabled={isSaving || !!error}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              isSaved && !error
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-900 hover:bg-blue-800 text-white'
            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            {isSaving ? 'Menyimpan...' : isSaved && !error ? 'Tersimpan ✓' : 'Simpan Nilai'}
          </button>
        </div>
        )}
        {error && (
          <p className='text-red-500 text-xs mt-1 ml-[120px]'>{error}</p>
        )}
      </div>
    </div>
  );
}

export default function BeriNilaiEssayPage() {
  useAuth(['teacher']);
  const router = useRouter();
  const params = useSearchParams();
  const mataPelajaran = params.get('mata') || 'Matematika';
  const classroom = params.get('classroom') || 'XII - IPA 1';
  const ujianId = params.get('ujianId');
  const pesertaUjianId = params.get('pesertaUjianId');
  const page = Number(params.get('page') || '1');

  const [essayQuestions, setEssayQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchEssayData = async () => {
      setIsLoading(true);
      try {
        const response = await request.get(`/exam-results/detail/${pesertaUjianId}`);
        
        if (response?.data?.review && Array.isArray(response.data.review)) {
          const essayQuestions = response.data.review.filter(
            (item) => item.question?.question_type === 'ESSAY'
          );
          
          setEssayQuestions(essayQuestions);
        }
      } catch (error) {
        toast.error('Gagal memuat data essay');
      } finally {
        setIsLoading(false);
      }
    };

    if (pesertaUjianId) {
      fetchEssayData();
    }
  }, [pesertaUjianId]);

  // Pagination logic
  const itemsPerPage = 2;
  const totalPages = Math.ceil(essayQuestions.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuestions = essayQuestions.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <TeacherLayout>
        <div className='flex justify-center items-center h-64'>
          <p className='text-gray-600'>Loading...</p>
        </div>
      </TeacherLayout>
    );
  }

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
            <BreadcrumbLink href='/teacher/exam-results'>Hasil Ujian</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/teacher/exam-results/by-class?mata=${encodeURIComponent(mataPelajaran)}&ujianId=${ujianId}`}>
              {mataPelajaran}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/teacher/exam-results/student-list?mata=${encodeURIComponent(mataPelajaran)}&classroom=${encodeURIComponent(classroom)}&ujianId=${ujianId}`}>
              {classroom}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/teacher/exam-results/student-list/detail?mata=${encodeURIComponent(mataPelajaran)}&classroom=${encodeURIComponent(classroom)}&ujianId=${ujianId}&pesertaUjianId=${encodeURIComponent(pesertaUjianId)}`}>
              Detail Nilai
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Essay</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='space-y-6'>
        <PageHeader
          title="Beri Nilai Essay"
          description="Periksa dan beri nilai untuk setiap soal essay"
        />

        {/* Questions */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          {currentQuestions.length > 0 ? (
            currentQuestions.map((item, index) => (
              <Question
                key={item.question?.question_id || `q-${startIndex + index}`}
                jawabanId={item.answer?.answer_id}
                number={startIndex + index + 1}
                text={item.question?.question_text || 'Soal tidak tersedia'}
                answer={item.answer?.essay_answer_text}
                initialScore={item.answer?.manual_score}
              />
            ))
          ) : (
            <p className='text-gray-500 text-center py-8'>Tidak ada soal essay</p>
          )}

          {/* Pagination */}
          <div className='flex items-center justify-center pt-4'>
            <div className='flex items-center gap-2'>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Link
                  key={pageNum}
                  href={`/teacher/exam-results/student-list/detail/essay?mata=${encodeURIComponent(mataPelajaran)}&classroom=${encodeURIComponent(classroom)}&ujianId=${ujianId}&pesertaUjianId=${encodeURIComponent(pesertaUjianId)}&page=${pageNum}`}
                  className={`px-3 py-1 rounded ${page === pageNum ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {pageNum}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
