'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { Home, CheckCircle, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import TeacherLayout from '../../../../teacherLayout';
import request from '@/utils/request';
import { useAuth } from '@/hooks/useAuth';

function stripGradePrefix(text) {
  return (text || '').replace(/^\[.*?\]\s*/, '');
}

// ── Essay question with inline scoring ──────────────────────────────────────

function EssayQuestion({ jawabanId, number, text, answer, initialScore }) {
  const hasAnswer = jawabanId !== null && jawabanId !== undefined;
  const [score, setScore] = useState(initialScore ?? '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(initialScore !== null && initialScore !== undefined && initialScore !== '');

  const validate = useCallback((val) => {
    if (val === '' || val === null || val === undefined) return 'Nilai tidak boleh kosong';
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
    setError(val !== '' ? validate(val) : '');
  };

  const handleSubmit = async () => {
    const validationError = validate(score);
    if (validationError) { setError(validationError); toast.error(validationError); return; }
    setIsSaving(true);
    try {
      await request.put('/exam-results/manual-score', { answer_id: jawabanId, manual_score: Number(score) });
      toast.success(`Nilai soal ${number} berhasil disimpan`);
      setIsSaved(true);
      setError('');
    } catch { /* handled by axios interceptor */ }
    finally { setIsSaving(false); }
  };

  return (
    <div className={`border-l-4 ${error ? 'border-red-500' : isSaved ? 'border-green-500' : 'border-blue-500'} pl-4 py-4 mb-6`}>
      <div className='flex items-center gap-2 mb-1'>
        <Badge variant='outline' className='text-xs bg-blue-50 text-blue-700 border-blue-200'>Essay #{number}</Badge>
        {isSaved && !error && <CheckCircle className='w-4 h-4 text-green-500' />}
        {error && <AlertCircle className='w-4 h-4 text-red-500' />}
      </div>
      <p className='text-gray-700 mb-3 font-medium'>{stripGradePrefix(text)}</p>
      <p className='text-gray-500 text-xs font-medium mb-1 uppercase tracking-wide'>Jawaban Siswa</p>
      <div className='border rounded-lg p-4 text-gray-800 bg-white mb-3'>
        {answer || <span className='text-gray-400 italic'>Tidak ada jawaban</span>}
      </div>
      {!hasAnswer ? (
        <p className='text-gray-400 italic text-sm'>Siswa tidak menjawab — nilai otomatis 0</p>
      ) : (
        <div className='flex items-center gap-3'>
          <span className='text-gray-700 font-medium text-sm'>Nilai (0–100):</span>
          <input
            type='number' min={0} max={100} step={1} value={score} onChange={handleChange}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            placeholder='0-100'
            className={`w-24 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
              error ? 'border-red-400 focus:ring-red-300 bg-red-50'
              : isSaved ? 'border-green-400 focus:ring-green-300 bg-green-50'
              : 'border-gray-300 focus:ring-blue-300'
            }`}
          />
          <button
            onClick={handleSubmit} disabled={isSaving || !!error}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              isSaved && !error ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-900 hover:bg-blue-800 text-white'
            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            {isSaving ? 'Menyimpan...' : isSaved && !error ? 'Tersimpan ✓' : 'Simpan Nilai'}
          </button>
          {error && <p className='text-red-500 text-xs'>{error}</p>}
        </div>
      )}
    </div>
  );
}

// ── PG / MC question (read-only review) ─────────────────────────────────────

function PGQuestion({ number, text, options = [], selectedIds = [], isCorrect }) {
  const selectedSet = new Set(selectedIds.map(Number));
  return (
    <div className='border-l-4 border-gray-200 pl-4 py-3 mb-4'>
      <div className='flex items-center gap-2 mb-2'>
        <Badge variant='outline' className='text-xs bg-gray-50 text-gray-600 border-gray-200'>PG #{number}</Badge>
        {isCorrect === true && <CheckCircle className='w-4 h-4 text-green-500' />}
        {isCorrect === false && <AlertCircle className='w-4 h-4 text-red-400' />}
        {isCorrect === null && <span className='text-xs text-gray-400 italic'>Tidak dijawab</span>}
      </div>
      <p className='text-gray-700 mb-3 font-medium text-sm'>{stripGradePrefix(text)}</p>
      <div className='space-y-1.5'>
        {options.map((opt) => {
          const selected = selectedSet.has(opt.option_id);
          const correct = opt.is_correct;
          return (
            <div
              key={opt.option_id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                selected && correct ? 'bg-green-50 border-green-300 text-green-800'
                : selected && !correct ? 'bg-red-50 border-red-300 text-red-800'
                : correct ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
            >
              <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                selected && correct ? 'bg-green-500 border-green-500'
                : selected && !correct ? 'bg-red-500 border-red-500'
                : correct ? 'border-green-400'
                : 'border-gray-300'
              }`} />
              <span>{opt.option_text}</span>
              {selected && <span className='ml-auto text-xs font-medium'>Dipilih</span>}
              {correct && !selected && <span className='ml-auto text-xs text-green-600'>Benar</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page content ────────────────────────────────────────────────────────

function BeriNilaiEssayPageContent() {
  useAuth(['teacher']);
  const params = useSearchParams();
  const mataPelajaran = params.get('mata') || 'Matematika';
  const classroom = params.get('classroom') || 'XII - IPA 1';
  const ujianId = params.get('ujianId');
  const pesertaUjianId = params.get('pesertaUjianId');
  const page = Number(params.get('page') || '1');
  const isArchived = params.get('archived') === 'true';
  const archivedSuffix = isArchived ? '&archived=true' : '';

  const [essayQuestions, setEssayQuestions] = useState([]);
  const [pgQuestions, setPgQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!pesertaUjianId) return;
    const fetch = async () => {
      setIsLoading(true);
      try {
        const response = await request.get(`/exam-results/detail/${pesertaUjianId}`);
        if (response?.data?.review && Array.isArray(response.data.review)) {
          const all = response.data.review;
          setEssayQuestions(all.filter(i => i.question?.question_type === 'ESSAY'));
          setPgQuestions(all.filter(i => i.question?.question_type !== 'ESSAY'));
        }
      } catch { toast.error('Gagal memuat data soal'); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, [pesertaUjianId]);

  const itemsPerPage = 3;
  const totalPages = Math.ceil(essayQuestions.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const currentEssays = essayQuestions.slice(startIndex, startIndex + itemsPerPage);

  const buildHref = (p) =>
    `/teacher/exam-results/student-list/detail/essay?mata=${encodeURIComponent(mataPelajaran)}&classroom=${encodeURIComponent(classroom)}&ujianId=${ujianId}&pesertaUjianId=${encodeURIComponent(pesertaUjianId)}&page=${p}${archivedSuffix}`;

  if (isLoading) {
    return (
      <TeacherLayout>
        <div className='flex justify-center items-center h-64'>
          <p className='text-gray-600'>Memuat soal...</p>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <Breadcrumb className='mb-6'>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href='/teacher/dashboard'><Home className='w-4 h-4' /></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={isArchived ? '/teacher/exam-results?tab=archived' : '/teacher/exam-results'}>
              Hasil Ujian
            </BreadcrumbLink>
          </BreadcrumbItem>
          {isArchived && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href='/teacher/exam-results?tab=archived'>Arsip</BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/teacher/exam-results/by-class?mata=${encodeURIComponent(mataPelajaran)}&ujianId=${ujianId}${archivedSuffix}`}>
              {mataPelajaran}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/teacher/exam-results/student-list?mata=${encodeURIComponent(mataPelajaran)}&classroom=${encodeURIComponent(classroom)}&ujianId=${ujianId}${archivedSuffix}`}>
              {classroom}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/teacher/exam-results/student-list/detail?mata=${encodeURIComponent(mataPelajaran)}&classroom=${encodeURIComponent(classroom)}&ujianId=${ujianId}&pesertaUjianId=${encodeURIComponent(pesertaUjianId)}${archivedSuffix}`}>
              Detail Nilai
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Penilaian</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='space-y-6'>
        <PageHeader title='Penilaian Soal' description='Essay dinilai manual · Pilihan Ganda tampil sebagai referensi' />

        {/* ── Essay section ── */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-center gap-2 mb-5'>
            <span className='text-sm font-semibold text-gray-800'>Soal Essay</span>
            <Badge variant='secondary' className='text-xs'>{essayQuestions.length} soal</Badge>
          </div>

          {currentEssays.length > 0 ? (
            currentEssays.map((item, i) => (
              <EssayQuestion
                key={item.question?.question_id || `e-${startIndex + i}`}
                jawabanId={item.answer?.answer_id}
                number={startIndex + i + 1}
                text={item.question?.question_text || 'Soal tidak tersedia'}
                answer={item.answer?.essay_answer_text}
                initialScore={item.answer?.manual_score}
              />
            ))
          ) : (
            <p className='text-gray-500 text-sm text-center py-6'>Tidak ada soal essay</p>
          )}

          {totalPages > 1 && (
            <div className='flex items-center justify-between pt-4 border-t border-gray-100'>
              <Link href={buildHref(Math.max(1, page - 1))}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md ${page <= 1 ? 'text-gray-300 pointer-events-none' : 'text-gray-600 hover:bg-gray-100'}`}>
                <ChevronLeft className='w-4 h-4' /> Sebelumnya
              </Link>
              <div className='flex items-center gap-1.5'>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Link key={p} href={buildHref(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded text-sm ${p === page ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {p}
                  </Link>
                ))}
              </div>
              <Link href={buildHref(Math.min(totalPages, page + 1))}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md ${page >= totalPages ? 'text-gray-300 pointer-events-none' : 'text-gray-600 hover:bg-gray-100'}`}>
                Berikutnya <ChevronRight className='w-4 h-4' />
              </Link>
            </div>
          )}
        </div>

        {/* ── PG section (read-only) ── */}
        {pgQuestions.length > 0 && (
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <div className='flex items-center gap-2 mb-5'>
              <span className='text-sm font-semibold text-gray-800'>Soal Pilihan Ganda</span>
              <Badge variant='secondary' className='text-xs'>{pgQuestions.length} soal</Badge>
              <span className='text-xs text-gray-400 ml-1'>· otomatis dinilai, hanya untuk referensi</span>
            </div>
            {pgQuestions.map((item, i) => {
              const selectedIds = item.answer?.mc_option_ids
                ? item.answer.mc_option_ids.split(',').map(Number).filter(Boolean)
                : [];
              return (
                <PGQuestion
                  key={item.question?.question_id || `pg-${i}`}
                  number={i + 1}
                  text={item.question?.question_text || 'Soal tidak tersedia'}
                  options={item.question?.answer_options || []}
                  selectedIds={selectedIds}
                  isCorrect={item.answer ? item.is_correct : null}
                />
              );
            })}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}

export default function BeriNilaiEssayPage() {
  return (
    <Suspense fallback={<TeacherLayout><div className='flex justify-center items-center h-64'><p className='text-gray-600'>Memuat...</p></div></TeacherLayout>}>
      <BeriNilaiEssayPageContent />
    </Suspense>
  );
}
