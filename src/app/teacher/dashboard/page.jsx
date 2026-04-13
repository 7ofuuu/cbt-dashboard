"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import TeacherLayout from '../teacherLayout';
import { useAuth } from '@/hooks/useAuth';
import { useAuthContext } from '@/contexts/AuthContext';
import request from '@/utils/request';
import { getShortcutCardTheme, getSubjectTheme } from '@/lib/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GraduationCap,
  ClipboardList,
  Library,
  Layers,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Users,
  ArrowRight,
} from 'lucide-react';
import TeacherPerformancePanel from './components/TeacherPerformancePanel';
import CoordinatorAuditPanel from './components/CoordinatorAuditPanel';
import { StaggerList, StaggerItem } from '@/components/motion/stagger-list';
import { AnimatedCard } from '@/components/motion/animated-card';
import { CountUp } from '@/components/motion/count-up';

function ShortcutMetricCard({ label, value, tone = 'sky', icon: Icon }) {
  const theme = getShortcutCardTheme(tone);
  const isNumeric = typeof value === 'number';

  return (
    <AnimatedCard className={`rounded-xl border p-4 ${theme.container} flex items-center gap-3`}>
      {Icon && (
        <div className={`w-10 h-10 rounded-lg bg-white/70 flex items-center justify-center ${theme.value} flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className={`text-xs font-semibold uppercase tracking-wide ${theme.label} truncate`}>{label}</p>
        <p className={`mt-0.5 text-2xl font-bold ${theme.value}`}>
          {isNumeric ? <CountUp value={value} /> : value}
        </p>
      </div>
    </AnimatedCard>
  );
}

function SubjectFeatureCard({
  title,
  subtitle,
  subject,
  details,
  href,
  actionLabel,
}) {
  const theme = getSubjectTheme(subject);

  return (
    <div className={`rounded-xl border ${theme.border} bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col`}>
      <div className={`${theme.header} text-white p-4`}>
        <h3 className="font-semibold truncate">{title}</h3>
        <div className="text-xs opacity-90 truncate">{subtitle}</div>
      </div>

      <div className="p-4 text-sm text-gray-700 space-y-1 flex-1">
        {details.map((detail) => (
          <div key={detail.label} className="flex justify-between gap-3">
            <span className="text-gray-500">{detail.label}:</span>
            <span className={detail.emphasize ? 'font-bold text-lg' : 'font-medium'}>{detail.value}</span>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4">
        <Link
          href={href}
          className={`flex items-center justify-center gap-1.5 ${theme.button} px-4 py-2 rounded-md text-sm font-medium transition-colors`}
        >
          {actionLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  useAuth(['teacher']);
  const { user: authUser } = useAuthContext();

  const [allUjians, setAllUjians] = useState([]);
  const [ujians, setUjians] = useState([]);
  const [bankSoal, setBankSoal] = useState([]);
  const [reviewExams, setReviewExams] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [performanceOverview, setPerformanceOverview] = useState(null);
  const [coordinatorAuditOverview, setCoordinatorAuditOverview] = useState(null);
  const [selectedDays, setSelectedDays] = useState(30);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [baseLoading, setBaseLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(true);
  const [coordinatorAuditLoading, setCoordinatorAuditLoading] = useState(true);

  const isCoordinator = authUser?.is_coordinator === true;

  const fetchBaseData = useCallback(async () => {
    setBaseLoading(true);
    try {
      const [ujianRes, bankRes, summaryRes, reviewRes] = await Promise.allSettled([
        request.get('/exams'),
        request.get('/questions/bank'),
        request.get('/analytics/dashboard-summary'),
        request.get('/exam-results/completed-exams?limit=6'),
      ]);

      const ujianData = ujianRes.status === 'fulfilled'
        ? (ujianRes.value.data?.data || [])
        : [];

      setAllUjians(ujianData);
      setUjians(ujianData.slice(0, 3)); // Ambil 3 ujian terbaru
      setSelectedExamId((prev) => prev || (ujianData[0] ? String(ujianData[0].exam_id) : ''));

      const bankData = bankRes.status === 'fulfilled'
        ? (bankRes.value.data?.question_bank || [])
        : [];
      setBankSoal(bankData.slice(0, 5)); // Ambil 5 bank soal

      const reviewData = reviewRes.status === 'fulfilled'
        ? (reviewRes.value.data?.data || [])
        : [];
      setReviewExams(reviewData);

      setDashboardSummary(summaryRes.status === 'fulfilled' ? (summaryRes.value.data || null) : null);
    } catch (error) {
      console.error('Gagal memuat data dasar dashboard:', error);
    } finally {
      setBaseLoading(false);
    }
  }, []);

  const fetchInsightData = useCallback(async () => {
    if (!selectedExamId) {
      setPerformanceOverview(null);
      setInsightLoading(false);
      return;
    }

    setInsightLoading(true);
    try {
      const performanceRes = await request.get(
        `/analytics/teacher-performance?days=${selectedDays}&exam_id=${selectedExamId}`
      );

      setPerformanceOverview(performanceRes.data || null);
    } catch (error) {
      console.error('Gagal memuat insight performa:', error);
      setPerformanceOverview(null);
    } finally {
      setInsightLoading(false);
    }
  }, [selectedDays, selectedExamId]);

  useEffect(() => {
    fetchBaseData();
  }, [fetchBaseData]);

  useEffect(() => {
    fetchInsightData();
  }, [fetchInsightData]);

  useEffect(() => {
    const fetchCoordinatorAudit = async () => {
      if (!isCoordinator) {
        setCoordinatorAuditOverview(null);
        setCoordinatorAuditLoading(false);
        return;
      }

      setCoordinatorAuditLoading(true);
      try {
        const response = await request.get('/analytics/coordinator-audit?days=30&limit=50');
        setCoordinatorAuditOverview(response.data || null);
      } catch (error) {
        console.error('Gagal memuat audit koordinator:', error);
        setCoordinatorAuditOverview(null);
      } finally {
        setCoordinatorAuditLoading(false);
      }
    };

    fetchCoordinatorAudit();
  }, [isCoordinator]);

  const selectedExam = allUjians.find((item) => String(item.exam_id) === String(selectedExamId)) || null;
  const alertCount = performanceOverview?.question_alerts?.length || 0;

  const reviewSummary = useMemo(() => {
    return reviewExams.reduce(
      (acc, exam) => {
        const participantResults = exam.participant_results || [];
        const pendingReviewCount = participantResults.filter((item) => item.exam_status === 'COMPLETED').length;
        const gradedCount = participantResults.filter((item) => item.exam_status === 'GRADED').length;

        acc.pending += pendingReviewCount;
        acc.graded += gradedCount;
        acc.completed += participantResults.length;
        acc.totalParticipants += exam.statistics?.total_participants || 0;
        return acc;
      },
      { pending: 0, graded: 0, completed: 0, totalParticipants: 0 }
    );
  }, [reviewExams]);

  const questionTypeShortcutCards = [
    {
      label: 'Single Choice',
      value: dashboardSummary?.questions?.by_type?.SINGLE_CHOICE || 0,
      tone: 'sky',
      icon: ClipboardList,
    },
    {
      label: 'Multiple Choice',
      value: dashboardSummary?.questions?.by_type?.MULTIPLE_CHOICE || 0,
      tone: 'indigo',
      icon: Layers,
    },
    {
      label: 'Essay',
      value: dashboardSummary?.questions?.by_type?.ESSAY || 0,
      tone: 'amber',
      icon: FileText,
    },
  ];

  const activityShortcutCards = [
    {
      label: 'Total Ujian',
      value: dashboardSummary?.exams?.total ?? allUjians.length,
      tone: 'sky',
      icon: ClipboardList,
    },
    {
      label: 'Total Bank Soal',
      value: dashboardSummary?.question_banks?.total ?? bankSoal.length,
      tone: 'emerald',
      icon: Library,
    },
    {
      label: 'Total Soal',
      value: dashboardSummary?.questions?.total ?? 0,
      tone: 'orange',
      icon: FileText,
    },
    {
      label: 'Soal Sulit Terdeteksi',
      value: insightLoading ? '...' : alertCount,
      tone: 'rose',
      icon: AlertTriangle,
    },
  ];

  const reviewShortcutCards = [
    {
      label: 'Belum Dinilai',
      value: reviewSummary.pending,
      tone: 'amber',
      icon: AlertTriangle,
    },
    {
      label: 'Sudah Dinilai',
      value: reviewSummary.graded,
      tone: 'emerald',
      icon: CheckCircle2,
    },
    {
      label: 'Peserta Selesai',
      value: reviewSummary.completed,
      tone: 'sky',
      icon: Users,
    },
    {
      label: 'Ujian Selesai',
      value: reviewExams.length,
      tone: 'violet',
      icon: ClipboardList,
    },
  ];

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-sky-800 to-sky-600 rounded-xl p-8 text-white">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-14 h-14 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Selamat Datang{authUser?.full_name ? `, ${authUser.full_name}` : ''}</h1>
              <p className="text-sky-100">Akses bank soal, jadwalkan ujian, dan hasilkan laporan nilai secara otomatis dalam beberapa klik.</p>
            </div>
          </div>
        </div>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ringkasan Aktivitas</h2>
            <p className="text-sm text-gray-500 mt-1">Statistik bank soal dan ujian yang Anda kelola</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Distribusi Tipe Soal</p>
            <StaggerList className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {questionTypeShortcutCards.map((card) => (
                <StaggerItem key={card.label}>
                  <ShortcutMetricCard
                    label={card.label}
                    value={card.value}
                    tone={card.tone}
                    icon={card.icon}
                  />
                </StaggerItem>
              ))}
            </StaggerList>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Aktivitas Keseluruhan</p>
            <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {activityShortcutCards.map((card) => (
                <StaggerItem key={card.label}>
                  <ShortcutMetricCard
                    label={card.label}
                    value={card.value}
                    tone={card.tone}
                    icon={card.icon}
                  />
                </StaggerItem>
              ))}
            </StaggerList>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Ujian Terbaru</h3>
              <Link href="/teacher/exam-schedule" className="text-sky-700 text-sm font-semibold hover:underline">
                Lihat Semua
              </Link>
            </div>

            {baseLoading ? (
              <div className="text-center py-8 text-gray-500">Memuat data...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {ujians.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <p>Belum ada ujian. Silakan buat jadwal ujian terlebih dahulu.</p>
                    <Link href="/teacher/exam-schedule/add" className="text-sky-700 hover:underline mt-2 inline-block">
                      Tambah Jadwal Ujian
                    </Link>
                  </div>
                ) : (
                  ujians.map((u) => (
                    <SubjectFeatureCard
                      key={u.exam_id}
                      title={u.exam_name}
                      subtitle={`${u.grade_level} ${u.major ? `- ${u.major}` : ''}`}
                      subject={u.subject}
                      details={[
                        { label: 'Mata Pelajaran', value: u.subject || '-' },
                        { label: 'Durasi', value: `${u.duration_minutes} menit` },
                        { label: 'Peserta', value: `${u._count?.exam_participants || 0} siswa` },
                        { label: 'Soal', value: `${u._count?.exam_questions || 0} soal` },
                      ]}
                      href="/teacher/exam-schedule"
                      actionLabel="Lihat Detail"
                    />
                  ))
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Bank Soal</h3>
              <Link href="/teacher/question-bank" className="text-sky-700 text-sm font-semibold hover:underline">
                Lihat Semua
              </Link>
            </div>

            {baseLoading ? (
              <div className="text-center py-8 text-gray-500">Memuat data...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {bankSoal.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <p>Belum ada bank soal. Silakan tambah soal terlebih dahulu.</p>
                    <Link href="/teacher/add-question" className="text-sky-700 hover:underline mt-2 inline-block">
                      Tambah Soal
                    </Link>
                  </div>
                ) : (
                  bankSoal.map((b) => (
                    <SubjectFeatureCard
                      key={b.question_bank_id}
                      title={b.subject || 'Bank Soal'}
                      subtitle={`${b.grade_level} ${b.major ? `- ${b.major}` : ''}`}
                      subject={b.subject}
                      details={[
                        { label: 'Total Soal', value: b.total_questions, emphasize: true },
                        { label: 'Pilihan Ganda', value: b.mc_count },
                        { label: 'Essay', value: b.essay_count },
                      ]}
                      href={`/teacher/question-bank/${b.question_bank_id}`}
                      actionLabel="Lihat Detail"
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Review Hasil Ujian</h2>
              <p className="text-sm text-gray-500 mt-1">Ringkasan backlog penilaian dan hasil yang sudah dinilai</p>
            </div>
            <Link href="/teacher/exam-results" className="text-sky-700 text-sm font-semibold hover:underline">
              Lihat Semua
            </Link>
          </div>

          <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {reviewShortcutCards.map((card) => (
              <StaggerItem key={card.label}>
                <ShortcutMetricCard
                  label={card.label}
                  value={card.value}
                  tone={card.tone}
                  icon={card.icon}
                />
              </StaggerItem>
            ))}
          </StaggerList>

          <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {baseLoading ? (
              <div className="text-center py-8 text-gray-500">Memuat data review...</div>
            ) : reviewExams.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                Belum ada ujian berakhir untuk direview.
              </div>
            ) : (
              reviewExams.map((exam) => {
                const participantResults = exam.participant_results || [];
                const pendingReviewCount = participantResults.filter((item) => item.exam_status === 'COMPLETED').length;
                const gradedCount = participantResults.filter((item) => item.exam_status === 'GRADED').length;

                return (
                  <div key={exam.exam_id} className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{exam.exam_name}</p>
                        <p className="text-xs text-gray-500">
                          {exam.subject} • {exam.grade_level}{exam.major ? ` - ${exam.major}` : ''} •
                          {' '}Pending {pendingReviewCount} • Dinilai {gradedCount}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {pendingReviewCount > 0 ? (
                          <Link
                            href={`/teacher/exam-results/by-class?mata=${encodeURIComponent(exam.subject || '-')}&ujianId=${exam.exam_id}&review=pending`}
                            className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                          >
                            Review belum dinilai
                          </Link>
                        ) : (
                          <span className="rounded-md border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500">
                            Tidak ada backlog
                          </span>
                        )}

                        <Link
                          href={`/teacher/exam-results/by-class?mata=${encodeURIComponent(exam.subject || '-')}&ujianId=${exam.exam_id}&review=graded`}
                          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Lihat yang sudah dinilai
                        </Link>

                        <Link
                          href={`/teacher/exam-results/by-class?mata=${encodeURIComponent(exam.subject || '-')}&ujianId=${exam.exam_id}&review=all`}
                          className="rounded-md border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                        >
                          Semua hasil
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <label htmlFor="examInsightFilter" className="text-sm font-semibold text-gray-800">
              Insight Berdasarkan Ujian
            </label>
            <Select
              value={selectedExamId}
              onValueChange={setSelectedExamId}
              disabled={allUjians.length === 0}
            >
              <SelectTrigger id="examInsightFilter" className="w-full">
                <SelectValue placeholder={allUjians.length === 0 ? 'Belum ada ujian' : 'Pilih ujian'} />
              </SelectTrigger>
              <SelectContent>
                {allUjians.map((exam) => (
                  <SelectItem key={exam.exam_id} value={String(exam.exam_id)}>
                    {exam.exam_name} • {exam.subject} • {exam.grade_level}{exam.major ? `-${exam.major}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Pilih ujian untuk mengubah ringkasan penilaian, distribusi nilai, dan daftar aksi review hasil ujian.
            </p>
          </div>
        </section>

        <TeacherPerformancePanel
          data={performanceOverview}
          loading={insightLoading || baseLoading}
          selectedDays={selectedDays}
          onChangeDays={setSelectedDays}
          selectedExam={selectedExam || performanceOverview?.meta?.selected_exam}
        />

        {isCoordinator && (
          <CoordinatorAuditPanel
            data={coordinatorAuditOverview}
            loading={coordinatorAuditLoading}
          />
        )}
      </div>
    </TeacherLayout>
  );
}

