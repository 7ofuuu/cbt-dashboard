"use client";

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TeacherLayout from '../../../teacherLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { Home, Search, CheckCircle2, BookOpen, Loader2, ArrowLeft } from 'lucide-react';
import { getSubjectColor } from '@/lib/constants';
import request from '@/utils/request';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

// Must match the key used by add/page.jsx
const DRAFT_KEY = 'teacher.examDraft';

function PilihBankSoalPageContent() {
  useAuth(['teacher']);
  const router = useRouter();

  const [draft, setDraft] = useState(null);
  const [draftChecked, setDraftChecked] = useState(false);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Hydrate the exam draft from sessionStorage. If absent the teacher landed
  // here directly without filling step 1 — send them back.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        setDraft(JSON.parse(raw));
      } else {
        toast.error('Lengkapi data ujian terlebih dahulu.');
        router.replace('/teacher/exam-schedule/add');
      }
    } catch (_) {
      router.replace('/teacher/exam-schedule/add');
    } finally {
      setDraftChecked(true);
    }
  }, [router]);

  useEffect(() => {
    fetchBankSoal();
  }, []);

  const fetchBankSoal = async () => {
    try {
      const res = await request.get('/questions/bank');
      setBanks(res.data.question_bank || []);
    } catch (error) {
      toast.error('Gagal memuat Bank Soal');
    } finally {
      setLoading(false);
    }
  };

  // Atomic create-then-assign: only commit the exam after a bank is chosen.
  // If the assign step fails after the exam exists, roll back the exam so the
  // teacher never ends up with an orphan record.
  const handleConfirm = async () => {
    if (!selectedBank) return toast.error('Pilih salah satu Bank Soal!');
    if (!draft) return toast.error('Data ujian tidak ditemukan.');

    setSubmitting(true);
    let createdExamId = null;

    try {
      const startTime = new Date(`${draft.tanggal}T${draft.pukul}:00.000+07:00`);
      const duration = parseInt(draft.duration_minutes) || 120;
      const endTime = new Date(startTime.getTime() + duration * 60000);

      const examPayload = {
        exam_name: draft.exam_name,
        subject: draft.subject,
        grade_level: draft.grade_level,
        major: draft.major,
        start_date: startTime.toISOString(),
        end_date: endTime.toISOString(),
        duration_minutes: duration,
        is_shuffle_questions: draft.is_shuffle_questions,
      };

      const createRes = await request.post('/exams', examPayload);
      createdExamId = createRes.data.exam.exam_id;
      const siswaAssigned = createRes.data.auto_assigned_students || 0;

      await request.post('/exams/assign-bank', {
        exam_id: createdExamId,
        question_bank_id: selectedBank.question_bank_id,
      });

      if (siswaAssigned > 0) {
        toast.success(
          `Jadwal berhasil dibuat! ${siswaAssigned} siswa di-assign otomatis.`,
          { duration: 4000 }
        );
      } else {
        toast.success('Jadwal berhasil dibuat!');
        toast('Tidak ada siswa yang cocok untuk di-assign otomatis.', {
          icon: '⚠️',
          duration: 5000,
          style: { background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' },
        });
      }

      sessionStorage.removeItem(DRAFT_KEY);
      router.push('/teacher/exam-schedule');
    } catch (error) {
      // Rollback the exam if it was created before the assign step failed,
      // so we never leave an exam without questions.
      if (createdExamId) {
        try {
          await request.delete(`/exams/${createdExamId}`);
        } catch (_) {
          // Swallow rollback errors — the original failure is what we surface.
        }
      }

      let errorMessage = 'Gagal membuat jadwal ujian.';
      if (error.response) {
        const status = error.response.status;
        const serverMsg = error.response.data?.error;
        if (serverMsg) errorMessage = serverMsg;
        else if (status === 400) errorMessage = 'Data tidak valid. Periksa form Anda.';
        else if (status === 403) errorMessage = 'Anda tidak memiliki akses.';
        else if (status === 409) errorMessage = 'Jadwal ujian dengan data tersebut sudah ada.';
      } else if (error.request) {
        errorMessage = 'Server tidak merespons. Pastikan koneksi internet Anda.';
      }
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBanks = banks.filter((bank) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      (bank.subject || '').toLowerCase().includes(q) ||
      (bank.bank_name || '').toLowerCase().includes(q) ||
      (bank.grade_level || '').toLowerCase().includes(q) ||
      (bank.major || '').toLowerCase().includes(q)
    );
  });

  // Block render until we know whether the draft exists — avoids a flash of
  // the bank list before the redirect kicks in.
  if (!draftChecked || !draft) {
    return (
      <TeacherLayout>
        <div className='flex items-center justify-center py-20'>
          <Loader2 className='w-6 h-6 animate-spin text-muted-foreground mr-2' />
          <span className='text-muted-foreground'>Loading...</span>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/teacher/dashboard'>
              <Home className='w-4 h-4' />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href='/teacher/exam-schedule'>Jadwal Ujian</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href='/teacher/exam-schedule/add'>Tambah Jadwal</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Pilih Bank Soal</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Pilih Bank Soal</h2>
            <p className="text-sm text-muted-foreground">
              Pilih bank soal untuk <strong>{draft.exam_name}</strong> ({draft.subject})
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/teacher/exam-schedule/add')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={submitting || !selectedBank}
              className="bg-[#03356C] hover:bg-[#02509E] text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Buat Ujian
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari bank soal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected bank info */}
        {selectedBank && (
          <Card className="border-[#03356C] bg-blue-50/50">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#03356C]" />
              <span className="text-sm font-medium">
                Dipilih: <strong>{selectedBank.bank_name || selectedBank.subject}</strong> — {selectedBank.total_questions} soal
              </span>
            </CardContent>
          </Card>
        )}

        {/* Bank list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
            <span className="text-muted-foreground">Memuat Bank Soal...</span>
          </div>
        ) : filteredBanks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-lg font-medium">Tidak ada bank soal ditemukan</p>
            <p className="text-sm">
              {searchQuery ? 'Coba ubah kata kunci pencarian.' : 'Buat bank soal terlebih dahulu.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBanks.map((bank) => {
              const isSelected = selectedBank?.question_bank_id === bank.question_bank_id;
              const subjectColor = getSubjectColor(bank.subject);

              return (
                <Card
                  key={bank.question_bank_id}
                  onClick={() => setSelectedBank(bank)}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? 'ring-2 ring-[#03356C] border-[#03356C] shadow-md'
                      : 'hover:border-gray-300'
                  }`}
                >
                  <CardContent className="p-0">
                    {/* Subject header */}
                    <div className="px-4 pt-4 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">
                            {bank.bank_name || bank.subject}
                          </h3>
                          <Badge className={`mt-1.5 text-xs ${subjectColor}`} variant="secondary">
                            {bank.subject}
                          </Badge>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-[#03356C] flex-shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="px-4 pb-4 space-y-2 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tingkat</span>
                        <span className="font-medium text-foreground">{bank.grade_level || '-'}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Jurusan</span>
                        <span className="font-medium text-foreground">{bank.major || '-'}</span>
                      </div>
                      <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-[#03356C]">
                        <span>Total Soal</span>
                        <span>{bank.total_questions ?? 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}

export default function PilihBankSoalPage() {
  return (
    <Suspense
      fallback={
        <TeacherLayout>
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='w-6 h-6 animate-spin text-muted-foreground mr-2' />
            <span className='text-muted-foreground'>Loading...</span>
          </div>
        </TeacherLayout>
      }
    >
      <PilihBankSoalPageContent />
    </Suspense>
  );
}
