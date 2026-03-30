"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import TeacherLayout from '../teacherLayout';
import { useAuth } from '@/hooks/useAuth';
import { useAuthContext } from '@/contexts/AuthContext';
import request from '@/utils/request';
import { getShortcutCardTheme, getSubjectTheme } from '@/lib/constants';
import TeacherPerformancePanel from './components/TeacherPerformancePanel';
import CoordinatorAuditPanel from './components/CoordinatorAuditPanel';

function ShortcutMetricCard({ label, value, tone = 'sky' }) {
  const theme = getShortcutCardTheme(tone);

  return (
    <div className={`rounded-lg border p-3 ${theme.container}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${theme.label}`}>{label}</p>
      <p className={`mt-1 text-2xl font-bold ${theme.value}`}>{value}</p>
    </div>
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
    <div className={`rounded-lg border ${theme.border} bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
      <div className={`${theme.header} text-white p-4`}>
        <h3 className="font-semibold">{title}</h3>
        <div className="text-xs opacity-90">{subtitle}</div>
      </div>

      <div className="p-4 text-sm text-gray-700 space-y-1">
        {details.map((detail) => (
          <div key={detail.label} className="flex justify-between gap-3">
            <span>{detail.label}:</span>
            <span className={detail.emphasize ? 'font-bold text-lg' : 'font-medium'}>{detail.value}</span>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4">
        <Link
          href={href}
          className={`block text-center ${theme.button} px-4 py-2 rounded-md text-sm font-medium transition-colors`}
        >
          {actionLabel}
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
    },
    {
      label: 'Multiple Choice',
      value: dashboardSummary?.questions?.by_type?.MULTIPLE_CHOICE || 0,
      tone: 'indigo',
    },
    {
      label: 'Essay',
      value: dashboardSummary?.questions?.by_type?.ESSAY || 0,
      tone: 'amber',
    },
  ];

  const activityShortcutCards = [
    {
      label: 'Total Ujian',
      value: dashboardSummary?.exams?.total ?? allUjians.length,
      tone: 'sky',
    },
    {
      label: 'Total Bank Soal',
      value: dashboardSummary?.question_banks?.total ?? bankSoal.length,
      tone: 'emerald',
    },
    {
      label: 'Total Soal',
      value: dashboardSummary?.questions?.total ?? 0,
      tone: 'orange',
    },
    {
      label: 'Soal Sulit Terdeteksi',
      value: insightLoading ? '...' : alertCount,
      tone: 'rose',
    },
  ];

  const reviewShortcutCards = [
    {
      label: 'Belum Dinilai',
      value: reviewSummary.pending,
      tone: 'amber',
    },
    {
      label: 'Sudah Dinilai',
      value: reviewSummary.graded,
      tone: 'emerald',
    },
    {
      label: 'Peserta Selesai',
      value: reviewSummary.completed,
      tone: 'sky',
    },
    {
      label: 'Ujian Selesai',
      value: reviewExams.length,
      tone: 'violet',
    },
  ];

  return (
    <TeacherLayout>
      <div className="space-y-8">
        <header className="bg-gradient-to-r from-sky-800 to-sky-700 text-white rounded-lg p-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0118 18.75V21l-6-3-6 3v-2.25c0-2.487-.56-4.59-1.84-7.172L12 14z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold">Selamat Datang{authUser?.full_name ? `, ${authUser.full_name}` : ''}</h1>
            <p className="text-sm opacity-90">Akses bank soal, jadwalkan ujian, dan hasilkan laporan nilai secara otomatis dalam beberapa klik.</p>
          </div>
        </header>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-900">Ringkasan Aktivitas</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {questionTypeShortcutCards.map((card) => (
              <ShortcutMetricCard
                key={card.label}
                label={card.label}
                value={card.value}
                tone={card.tone}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {activityShortcutCards.map((card) => (
              <ShortcutMetricCard
                key={card.label}
                label={card.label}
                value={card.value}
                tone={card.tone}
              />
            ))}
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

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Review Hasil Ujian</h2>
            <Link href="/teacher/exam-results" className="text-sky-700 text-sm font-semibold hover:underline">
              Lihat Semua
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {reviewShortcutCards.map((card) => (
              <ShortcutMetricCard
                key={card.label}
                label={card.label}
                value={card.value}
                tone={card.tone}
              />
            ))}
          </div>

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
                  <div key={exam.exam_id} className="rounded-lg border border-gray-200 bg-gray-50/70 p-4">
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

        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="space-y-2">
            <label htmlFor="examInsightFilter" className="text-sm font-semibold text-gray-800">
              Insight Berdasarkan Ujian
            </label>
            <select
              id="examInsightFilter"
              value={selectedExamId}
              onChange={(event) => setSelectedExamId(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
              disabled={allUjians.length === 0}
            >
              {allUjians.length === 0 && <option value="">Belum ada ujian</option>}
              {allUjians.map((exam) => (
                <option key={exam.exam_id} value={String(exam.exam_id)}>
                  {exam.exam_name} • {exam.subject} • {exam.grade_level}{exam.major ? `-${exam.major}` : ''}
                </option>
              ))}
            </select>
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

