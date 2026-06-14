"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TeacherLayout from '../../../teacherLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Search, CheckCircle2, BookOpen, Loader2, ArrowLeft, X, Filter, Info } from 'lucide-react';
import { getSubjectColor } from '@/lib/constants';
import { useTaxonomy } from '@/contexts/TaxonomyContext';
import request from '@/utils/request';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

// Must match the key used by add/page.jsx
const DRAFT_KEY = 'teacher.examDraft';
// Stores the bank pick across navigations so teachers don't lose their
// selection when they hop back to step 1 to tweak the exam fields.
const SELECTED_BANK_KEY = 'teacher.examSelectedBank';

const ANY = '__any__';

function PilihBankSoalPageContent() {
  useAuth(['teacher']);
  const router = useRouter();
  const { subjects, gradeLevels, majors } = useTaxonomy();

  const [draft, setDraft] = useState(null);
  const [draftChecked, setDraftChecked] = useState(false);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ subject: ANY, grade_level: ANY, major: ANY });

  // Hydrate draft + previous selection on mount. The page remounts on every
  // navigation into it, so this always re-reads the latest draft from step 1
  // and re-seeds the filters from it - keeping the bank list, filters, and the
  // summary in sync with whatever was just chosen on the previous page.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) {
        toast.error('Lengkapi data ujian terlebih dahulu.');
        router.replace('/teacher/exam-schedule/add');
        return;
      }
      const parsedDraft = JSON.parse(raw);
      setDraft(parsedDraft);

      // Always derive filters from the current draft so step 2 reflects the
      // exam's subject/grade/major selected on step 1.
      setFilters({
        subject: parsedDraft.subject || ANY,
        grade_level: parsedDraft.grade_level || ANY,
        major: parsedDraft.major || ANY,
      });

      // Keep a previously chosen bank only if it still matches the draft's
      // subject - otherwise the target changed and the old pick is stale.
      const savedBank = sessionStorage.getItem(SELECTED_BANK_KEY);
      if (savedBank) {
        const parsedBank = JSON.parse(savedBank);
        if (!parsedDraft.subject || parsedBank.subject === parsedDraft.subject) {
          setSelectedBank(parsedBank);
        } else {
          sessionStorage.removeItem(SELECTED_BANK_KEY);
        }
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

  const handleSelectBank = (bank) => {
    setSelectedBank(bank);
    try {
      sessionStorage.setItem(SELECTED_BANK_KEY, JSON.stringify(bank));
    } catch (_) {}
  };

  const handleClearSelection = () => {
    setSelectedBank(null);
    sessionStorage.removeItem(SELECTED_BANK_KEY);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilters({ subject: ANY, grade_level: ANY, major: ANY });
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
      sessionStorage.removeItem(SELECTED_BANK_KEY);
      router.push('/teacher/exam-schedule');
    } catch (error) {
      // Rollback the exam if it was created before the assign step failed,
      // so we never leave an exam without questions.
      if (createdExamId) {
        try {
          await request.delete(`/exams/${createdExamId}`);
        } catch (_) {
          // Swallow rollback errors - the original failure is what we surface.
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

  const filteredBanks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return banks.filter((bank) => {
      if (filters.subject !== ANY && bank.subject !== filters.subject) return false;
      if (filters.grade_level !== ANY && bank.grade_level !== filters.grade_level) return false;
      if (filters.major !== ANY && bank.major !== filters.major) return false;
      if (!q) return true;
      return (
        (bank.subject || '').toLowerCase().includes(q) ||
        (bank.bank_name || '').toLowerCase().includes(q) ||
        (bank.grade_level || '').toLowerCase().includes(q) ||
        (bank.major || '').toLowerCase().includes(q)
      );
    });
  }, [banks, searchQuery, filters]);

  const activeFilterCount =
    (filters.subject !== ANY ? 1 : 0) +
    (filters.grade_level !== ANY ? 1 : 0) +
    (filters.major !== ANY ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const durationLabel = draft?.duration_minutes
    ? `${Math.floor(draft.duration_minutes / 60)} jam ${draft.duration_minutes % 60} menit`
    : '-';

  // Block render until we know whether the draft exists - avoids a flash of
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ════════════ MAIN (lg col-span-8) ════════════ */}
        <div className="lg:col-span-8 space-y-6">
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

          {/* Filters */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Filter className="w-4 h-4" />
                <span>Filter & Pencarian</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] h-5">
                    {activeFilterCount} aktif
                  </Badge>
                )}
                <div className="flex-1" />
                {activeFilterCount > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-8 text-xs"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama bank soal..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={filters.subject}
                  onValueChange={(v) => setFilters((s) => ({ ...s, subject: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mata Pelajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Semua Mata Pelajaran</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.subject_id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.grade_level}
                  onValueChange={(v) => setFilters((s) => ({ ...s, grade_level: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tingkat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Semua Tingkat</SelectItem>
                    {gradeLevels.map((g) => (
                      <SelectItem key={g.grade_level_id} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.major}
                  onValueChange={(v) => setFilters((s) => ({ ...s, major: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Jurusan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Semua Jurusan</SelectItem>
                    {majors.map((m) => (
                      <SelectItem key={m.major_id} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Selected bank info */}
          {selectedBank && (
            <Card className="border-[#03356C] bg-blue-50/50">
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#03356C] flex-shrink-0" />
                <span className="text-sm font-medium flex-1">
                  Dipilih: <strong>{selectedBank.bank_name || selectedBank.subject}</strong> - {selectedBank.total_questions} soal
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Batal pilih
                </Button>
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
                {activeFilterCount > 0
                  ? 'Coba longgarkan filter atau kata kunci pencarian.'
                  : 'Buat bank soal terlebih dahulu.'}
              </p>
              {activeFilterCount > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="mt-4"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Reset Filter
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="text-xs text-muted-foreground">
                Menampilkan {filteredBanks.length} dari {banks.length} bank soal
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredBanks.map((bank) => {
                  const isSelected = selectedBank?.question_bank_id === bank.question_bank_id;
                  const subjectColor = getSubjectColor(bank.subject);

                  return (
                    <Card
                      key={bank.question_bank_id}
                      onClick={() => handleSelectBank(bank)}
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
            </>
          )}
        </div>

        {/* ════════════ SIDEBAR (lg col-span-4) ════════════ */}
        <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-4 self-start">
          {/* Step Progress */}
          <BentoCard
            icon={<Info className="w-4 h-4" />}
            title="Langkah Pembuatan"
            accent="sky"
            compact
          >
            <ol className="space-y-3">
              <li className="flex gap-3">
                <StepDot n={1} done />
                <div className="flex-1 -mt-0.5">
                  <p className="text-sm font-semibold text-green-700">Isi Data Ujian</p>
                  <p className="text-xs text-gray-500 mt-0.5">Informasi, target, dan waktu ujian.</p>
                  <Badge className="mt-1.5 text-[10px] bg-green-50 text-green-700 border-green-200" variant="outline">Lengkap</Badge>
                </div>
              </li>
              <li className="flex gap-3">
                <StepDot n={2} active />
                <div className="flex-1 -mt-0.5">
                  <p className="text-sm font-semibold text-gray-800">Pilih Bank Soal</p>
                  <p className="text-xs text-gray-500 mt-0.5">Pilih bank soal yang akan dipakai.</p>
                  {selectedBank && (
                    <Badge className="mt-1.5 text-[10px] bg-sky-50 text-sky-700 border-sky-200" variant="outline">Terpilih</Badge>
                  )}
                </div>
              </li>
            </ol>
          </BentoCard>

          {/* Summary */}
          <BentoCard
            icon={<BookOpen className="w-4 h-4" />}
            title="Ringkasan"
            accent="emerald"
            compact
          >
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <dt className="text-gray-500">Nama</dt>
              <dd className="text-right font-medium truncate">{draft.exam_name}</dd>
              <dt className="text-gray-500">Mapel</dt>
              <dd className="text-right"><Badge variant="secondary" className="text-[10px]">{draft.subject}</Badge></dd>
              <dt className="text-gray-500">Target</dt>
              <dd className="text-right font-medium">{draft.grade_level} - {draft.major}</dd>
              <dt className="text-gray-500">Tanggal</dt>
              <dd className="text-right font-medium">{draft.tanggal}</dd>
              <dt className="text-gray-500">Waktu</dt>
              <dd className="text-right font-mono">{draft.pukul} WIB</dd>
              <dt className="text-gray-500">Durasi</dt>
              <dd className="text-right font-medium">{durationLabel}</dd>
              <dt className="text-gray-500">Acak Soal</dt>
              <dd className="text-right">
                <Badge variant={draft.is_shuffle_questions ? 'default' : 'secondary'} className="text-[10px]">
                  {draft.is_shuffle_questions ? 'Ya' : 'Tidak'}
                </Badge>
              </dd>
              <div className="col-span-2 border-t mt-1" />
              <dt className="text-gray-500">Bank Soal</dt>
              <dd className="text-right font-medium truncate">
                {selectedBank ? (selectedBank.bank_name || selectedBank.subject) : <span className="text-gray-400">Belum dipilih</span>}
              </dd>
              {selectedBank && (
                <>
                  <dt className="text-gray-500">Jumlah Soal</dt>
                  <dd className="text-right font-semibold text-[#03356C]">{selectedBank.total_questions ?? 0}</dd>
                </>
              )}
            </dl>
          </BentoCard>
        </aside>
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

// ─── Local components (mirrors add/page.jsx so the sidebar looks identical) ──

const ACCENT = {
  sky: { iconBg: 'bg-sky-100', iconText: 'text-sky-700' },
  emerald: { iconBg: 'bg-emerald-100', iconText: 'text-emerald-700' },
};

function BentoCard({ icon, title, accent = 'sky', compact = false, className = '', children }) {
  const a = ACCENT[accent] || ACCENT.sky;
  return (
    <div className={`bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b">
        <div className={`w-7 h-7 rounded-lg ${a.iconBg} ${a.iconText} flex items-center justify-center`}>{icon}</div>
        <h3 className="font-semibold text-sm text-gray-800">{title}</h3>
      </div>
      <div className={compact ? 'p-3' : 'p-4'}>{children}</div>
    </div>
  );
}

function StepDot({ n, active = false, done = false }) {
  let cls = 'bg-gray-100 text-gray-400 border-gray-300';
  if (done) cls = 'bg-green-100 text-green-700 border-green-400';
  else if (active) cls = 'bg-sky-100 text-sky-700 border-sky-400 animate-pulse';
  return (
    <div className="flex flex-col items-center pt-0.5">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${cls}`}>{n}</div>
    </div>
  );
}
