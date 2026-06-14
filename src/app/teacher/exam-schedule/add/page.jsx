"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import TeacherLayout from '../../teacherLayout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home, X, Clock, BookOpen, FileText, Calendar, ArrowRight, Info,
  GraduationCap, Layers, Shuffle, Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTaxonomy } from '@/contexts/TaxonomyContext';
import { SubjectSelect } from '@/components/SubjectSelect';
import { DatePicker } from '@/components/DatePicker';
import { TimePicker } from '@/components/TimePicker';

// Key used to hand the exam draft to the select-bank step. The exam is not
// created in the backend until the teacher completes both steps - closing the
// tab or navigating away discards the draft, so no orphan exams are produced.
const DRAFT_KEY = 'teacher.examDraft';

export default function TambahJadwalPage() {
  useAuth(['teacher']);
  const router = useRouter();
  const { gradeLevels, majors, loading: taxonomyLoading } = useTaxonomy();

  const [form, setForm] = useState({
    exam_name: '',
    tanggal: '',
    pukul: '',
    grade_level: '',
    major: '',
    subject: '',
    duration_minutes: 120,
    is_shuffle_questions: true,
  });
  const [hydrated, setHydrated] = useState(false);

  // Rehydrate the form if the teacher came back from the select-bank step.
  // We wait for the taxonomy to finish loading first: the Select components
  // (subject/grade/major) only display a value when a matching option already
  // exists. If we restored the draft while the dropdowns still held the
  // fallback list, Radix would silently drop values not in that fallback -
  // which is why subject/grade/major appeared blank after going "Kembali".
  useEffect(() => {
    if (taxonomyLoading || hydrated) return;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-shot rehydration from sessionStorage once taxonomy is ready
      if (raw) setForm((s) => ({ ...s, ...JSON.parse(raw) }));
    } catch (_) {}
    setHydrated(true);
  }, [taxonomyLoading, hydrated]);

  const update = (field) => (e) => setForm((s) => ({ ...s, [field]: e.target.value }));
  const updateSelect = (field) => (value) => setForm((s) => ({ ...s, [field]: value }));

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.exam_name || !form.tanggal || !form.pukul || !form.grade_level || !form.major || !form.subject) {
      toast.error('Harap lengkapi semua field yang wajib diisi.');
      return;
    }

    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch (_) {
      toast.error('Browser tidak mendukung penyimpanan sementara.');
      return;
    }

    router.push('/teacher/exam-schedule/add/select-bank');
  }

  const formComplete = form.exam_name && form.tanggal && form.pukul && form.grade_level && form.major && form.subject;

  const endPreview = useMemo(() => {
    if (!form.tanggal || !form.pukul || !form.duration_minutes) return null;
    try {
      const start = new Date(`${form.tanggal}T${form.pukul}`);
      const end = new Date(start.getTime() + (parseInt(form.duration_minutes) || 0) * 60000);
      return {
        dayLabel: start.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
        startLabel: form.pukul,
        endLabel: end.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
    } catch (_) {
      return null;
    }
  }, [form.tanggal, form.pukul, form.duration_minutes]);

  const durationLabel = form.duration_minutes
    ? `${Math.floor(form.duration_minutes / 60)} jam ${form.duration_minutes % 60} menit`
    : '-';

  // Hold the form back until the draft has been restored (after taxonomy load)
  // so the Select fields mount with their final values and render correctly.
  if (!hydrated) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <span className="w-5 h-5 mr-2 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
          Memuat...
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/teacher/dashboard'><Home className='w-4 h-4' /></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href='/teacher/exam-schedule'>Jadwal Ujian</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Tambah Jadwal</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Tambah Jadwal Ujian"
        description="Buat jadwal ujian baru untuk siswa"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* ════════════ MAIN FORM (lg col-span-8) ════════════ */}
          <div className="lg:col-span-8 space-y-4">
            {/* Bento row 1: HERO (Nama + Subject) - full width */}
            <BentoCard
              icon={<FileText className="w-4 h-4" />}
              title="Informasi Ujian"
              accent="sky"
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="md:col-span-3 space-y-1.5">
                  <Label htmlFor="exam_name" className="text-xs">Nama Ujian <span className="text-red-500">*</span></Label>
                  <Input
                    id="exam_name"
                    required
                    placeholder="UTS Matematika"
                    value={form.exam_name}
                    onChange={update('exam_name')}
                    className="h-10 w-full"
                  />
                </div>
                <div className="md:col-span-2">
                  <SubjectSelect
                    id="subject"
                    required
                    value={form.subject}
                    onChange={updateSelect('subject')}
                  />
                </div>
              </div>
            </BentoCard>

            {/* Bento row 2: Tingkat + Jurusan + Shuffle (3 cards in 1 row) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <BentoCard
                icon={<GraduationCap className="w-4 h-4" />}
                title="Tingkat"
                accent="violet"
                compact
              >
                <Select value={form.grade_level} onValueChange={updateSelect('grade_level')}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Pilih tingkat *" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevels.map((g) => (
                      <SelectItem key={g.grade_level_id} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </BentoCard>

              <BentoCard
                icon={<Layers className="w-4 h-4" />}
                title="Jurusan"
                accent="emerald"
                compact
              >
                <Select value={form.major} onValueChange={updateSelect('major')}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Pilih jurusan *" />
                  </SelectTrigger>
                  <SelectContent>
                    {majors.map((m) => (
                      <SelectItem key={m.major_id} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </BentoCard>

              <BentoCard
                icon={<Shuffle className="w-4 h-4" />}
                title="Acak Soal"
                accent="amber"
                compact
              >
                <RadioGroup
                  value={form.is_shuffle_questions ? 'true' : 'false'}
                  onValueChange={(v) => setForm(s => ({ ...s, is_shuffle_questions: v === 'true' }))}
                  className="gap-2"
                >
                  <ShuffleOption value="true" label="Diacak per siswa" checked={form.is_shuffle_questions} />
                  <ShuffleOption value="false" label="Urutan tetap" checked={!form.is_shuffle_questions} />
                </RadioGroup>
              </BentoCard>
            </div>

            {/* Auto-assign banner - informative only when both filled */}
            {form.grade_level && form.major && (
              <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50 px-4 py-3 flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-sky-700 flex-shrink-0" />
                <p className="text-xs text-sky-900 font-medium">
                  Siswa <strong>Tingkat {form.grade_level} - {form.major}</strong> akan otomatis di-assign sebagai peserta.
                </p>
              </div>
            )}

            {/* Bento row 3: WAKTU (full-width card with internal 3-col grid) */}
            <BentoCard
              icon={<Calendar className="w-4 h-4" />}
              title="Waktu & Durasi"
              accent="rose"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tanggal <span className="text-red-500">*</span></Label>
                  <DatePicker value={form.tanggal} onChange={updateSelect('tanggal')} placeholder="Pilih tanggal *" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Waktu Mulai <span className="text-red-500">*</span></Label>
                  <TimePicker value={form.pukul} onChange={updateSelect('pukul')} placeholder="Pilih waktu *" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Durasi (menit) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    required
                    min="1"
                    max="480"
                    value={form.duration_minutes}
                    onChange={(e) => setForm(s => ({ ...s, duration_minutes: e.target.value }))}
                    className="h-10 w-full"
                  />
                </div>
              </div>

              {endPreview && (
                <div className="mt-3 rounded-lg border bg-gray-50 px-3 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <span className="font-medium">{endPreview.dayLabel}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-700">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span className="font-mono">{endPreview.startLabel}</span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <span className="font-mono">{endPreview.endLabel}</span>
                    <span className="text-gray-500">WIB</span>
                  </div>
                  <Badge variant="secondary" className="ml-auto text-[10px]">{durationLabel}</Badge>
                </div>
              )}
            </BentoCard>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href="/teacher/exam-schedule"><X className="w-4 h-4 mr-1" /> Batal</Link>
              </Button>
              <Button type="submit" size="sm" className="bg-sky-800 hover:bg-sky-900">
                Lanjut Pilih Soal
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
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
                  <StepDot active={!formComplete} done={formComplete} n={1} />
                  <div className="flex-1 -mt-0.5">
                    <p className={`text-sm font-semibold ${formComplete ? 'text-green-700' : 'text-gray-800'}`}>Isi Data Ujian</p>
                    <p className="text-xs text-gray-500 mt-0.5">Informasi, target, dan waktu ujian.</p>
                    {formComplete && (
                      <Badge className="mt-1.5 text-[10px] bg-green-50 text-green-700 border-green-200" variant="outline">Lengkap</Badge>
                    )}
                  </div>
                </li>
                <li className="flex gap-3">
                  <StepDot n={2} />
                  <div className="flex-1 -mt-0.5">
                    <p className="text-sm font-semibold text-gray-400">Pilih Bank Soal</p>
                    <p className="text-xs text-gray-400 mt-0.5">Pilih bank soal yang akan dipakai.</p>
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
              {formComplete ? (
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <dt className="text-gray-500">Nama</dt>
                  <dd className="text-right font-medium truncate">{form.exam_name}</dd>
                  <dt className="text-gray-500">Mapel</dt>
                  <dd className="text-right"><Badge variant="secondary" className="text-[10px]">{form.subject}</Badge></dd>
                  <dt className="text-gray-500">Target</dt>
                  <dd className="text-right font-medium">{form.grade_level} - {form.major}</dd>
                  <dt className="text-gray-500">Tanggal</dt>
                  <dd className="text-right font-medium">{form.tanggal}</dd>
                  <dt className="text-gray-500">Waktu</dt>
                  <dd className="text-right font-mono">{form.pukul} WIB</dd>
                  <dt className="text-gray-500">Durasi</dt>
                  <dd className="text-right font-medium">{durationLabel}</dd>
                  <dt className="text-gray-500">Acak Soal</dt>
                  <dd className="text-right">
                    <Badge variant={form.is_shuffle_questions ? 'default' : 'secondary'} className="text-[10px]">
                      {form.is_shuffle_questions ? 'Ya' : 'Tidak'}
                    </Badge>
                  </dd>
                </dl>
              ) : (
                <div className="text-center py-3">
                  <FileText className="w-7 h-7 mx-auto text-gray-300 mb-1.5" />
                  <p className="text-xs text-gray-400">Lengkapi form untuk melihat ringkasan</p>
                </div>
              )}
            </BentoCard>
          </aside>
        </div>
      </form>
    </TeacherLayout>
  );
}

// ─── Local components ─────────────────────────────────────────────────────

const ACCENT = {
  sky: { iconBg: 'bg-sky-100', iconText: 'text-sky-700' },
  violet: { iconBg: 'bg-violet-100', iconText: 'text-violet-700' },
  emerald: { iconBg: 'bg-emerald-100', iconText: 'text-emerald-700' },
  amber: { iconBg: 'bg-amber-100', iconText: 'text-amber-700' },
  rose: { iconBg: 'bg-rose-100', iconText: 'text-rose-700' },
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

function ShuffleOption({ value, label, checked }) {
  return (
    <Label
      htmlFor={`shuffle-${value}`}
      className={`flex items-center gap-2.5 cursor-pointer rounded-lg border px-3 h-9 transition-colors ${
        checked ? 'border-amber-300 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'
      }`}
    >
      <RadioGroupItem
        id={`shuffle-${value}`}
        value={value}
        className="text-amber-600 border-amber-400 focus-visible:ring-amber-500/40"
      />
      <span className={`text-sm ${checked ? 'text-amber-900 font-medium' : 'text-gray-600'}`}>{label}</span>
    </Label>
  );
}
