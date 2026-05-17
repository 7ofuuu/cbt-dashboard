'use client';

import Link from 'next/link';
import {
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  TrendingUp,
} from 'lucide-react';

const clamp = (value) => Math.max(0, Math.min(100, value ?? 0));

const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return `${Number(value).toFixed(1)}%`;
};

const formatScore = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return Number(value).toFixed(1);
};

const widthByPercent = (value) => `${clamp(value)}%`;

function ReviewAndDistribution({ summary = {}, recentExams = [] }) {
  const totalParticipants = summary.total_participants || 0;
  const completedParticipants = summary.completed_participants || 0;
  const gradedParticipants = summary.graded_participants || 0;
  const gradingBacklog = summary.grading_backlog || 0;
  const unsubmittedParticipants = Math.max(0, totalParticipants - completedParticipants);

  const scoreDistribution = summary.score_distribution || {};
  const scoreBands = [
    {
      label: 'Unggul (>= 85)',
      count: scoreDistribution.excellent || 0,
      rate: scoreDistribution.excellent_rate || 0,
      tone: 'bg-emerald-500',
      chip: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      label: 'Lulus (75-84)',
      count: scoreDistribution.pass || 0,
      rate: scoreDistribution.pass_rate || 0,
      tone: 'bg-sky-500',
      chip: 'bg-sky-50 text-sky-700 border-sky-100',
    },
    {
      label: 'Perlu Remedial (< 75)',
      count: scoreDistribution.remedial || 0,
      rate: scoreDistribution.remedial_rate || 0,
      tone: 'bg-rose-500',
      chip: 'bg-rose-50 text-rose-700 border-rose-100',
    },
  ];

  return (
    <div className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
      <div className='space-y-4 xl:col-span-2'>
        <div className='rounded-lg border border-gray-200 bg-white p-4'>
          <div className='mb-3 flex items-center gap-2'>
            <ClipboardCheck className='h-4 w-4 text-sky-700' />
            <h4 className='text-sm font-semibold text-gray-800'>Status Penilaian</h4>
          </div>

          <div className='space-y-3'>
            <div>
              <div className='mb-1 flex items-center justify-between text-xs text-gray-600'>
                <span>Sudah dinilai (GRADED)</span>
                <span className='font-semibold text-emerald-700'>
                  {gradedParticipants} peserta • {formatPercent(summary.graded_rate)}
                </span>
              </div>
              <div className='h-2 overflow-hidden rounded-full bg-gray-100'>
                <div className='h-2 rounded-full bg-emerald-500' style={{ width: widthByPercent(summary.graded_rate) }} />
              </div>
            </div>

            <div>
              <div className='mb-1 flex items-center justify-between text-xs text-gray-600'>
                <span>Perlu dinilai (COMPLETED)</span>
                <span className='font-semibold text-amber-700'>{gradingBacklog} peserta</span>
              </div>
              <div className='h-2 overflow-hidden rounded-full bg-gray-100'>
                <div
                  className='h-2 rounded-full bg-amber-500'
                  style={{ width: widthByPercent((gradingBacklog / Math.max(1, completedParticipants)) * 100) }}
                />
              </div>
            </div>

            <div>
              <div className='mb-1 flex items-center justify-between text-xs text-gray-600'>
                <span>Belum submit / belum selesai</span>
                <span className='font-semibold text-slate-700'>{unsubmittedParticipants} peserta</span>
              </div>
              <div className='h-2 overflow-hidden rounded-full bg-gray-100'>
                <div
                  className='h-2 rounded-full bg-slate-400'
                  style={{ width: widthByPercent((unsubmittedParticipants / Math.max(1, totalParticipants)) * 100) }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className='rounded-lg border border-gray-200 bg-white p-4'>
          <div className='mb-3 flex items-center gap-2'>
            <BarChart3 className='h-4 w-4 text-violet-700' />
            <h4 className='text-sm font-semibold text-gray-800'>Distribusi Nilai Peserta</h4>
          </div>

          <div className='space-y-3'>
            {scoreBands.map((band) => (
              <div key={band.label}>
                <div className='mb-1 flex items-center justify-between text-xs text-gray-600'>
                  <span>{band.label}</span>
                  <span className={`rounded-full border px-2 py-0.5 font-semibold ${band.chip}`}>
                    {band.count} peserta
                  </span>
                </div>
                <div className='h-2 overflow-hidden rounded-full bg-gray-100'>
                  <div className={`h-2 rounded-full ${band.tone}`} style={{ width: widthByPercent(band.rate) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='rounded-lg border border-gray-200 bg-white p-4 h-full min-h-[340px] flex flex-col'>
        <div className='mb-3 flex items-center gap-2'>
          <Clock3 className='h-4 w-4 text-amber-700' />
          <h4 className='text-sm font-semibold text-gray-800'>Aksi Review Hasil Ujian</h4>
        </div>

        {recentExams.length === 0 ? (
          <p className='text-sm text-gray-500'>Belum ada ujian pada rentang ini untuk direview.</p>
        ) : (
          <div className='space-y-2 overflow-y-auto pr-1'>
            {recentExams.slice(0, 6).map((exam) => {
              const pendingCount = exam.pending_review_count || 0;
              const gradedCount = exam.graded_count || 0;
              const examSubject = exam.subject || '-';
              const examId = exam.exam_id;

              return (
                <div key={examId} className='rounded-md border border-gray-100 bg-gray-50/70 p-3'>
                  <p className='truncate text-sm font-semibold text-gray-900'>{exam.exam_name}</p>
                  <p className='mt-0.5 text-xs text-gray-500'>
                    {examSubject} • Pending {pendingCount} • Dinilai {gradedCount}
                  </p>

                  <div className='mt-2 flex flex-wrap gap-2'>
                    {pendingCount > 0 ? (
                      <Link
                        href={`/teacher/exam-results/by-class?mata=${encodeURIComponent(examSubject)}&ujianId=${examId}&review=pending`}
                        className='rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100'
                      >
                        Review belum dinilai
                      </Link>
                    ) : (
                      <span className='rounded-md border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500'>
                        Tidak ada backlog
                      </span>
                    )}

                    <Link
                      href={`/teacher/exam-results/by-class?mata=${encodeURIComponent(examSubject)}&ujianId=${examId}&review=graded`}
                      className='rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100'
                    >
                      Lihat yang sudah dinilai
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeacherPerformancePanel({
  data,
  loading,
  selectedDays,
  onChangeDays,
  selectedExam,
}) {
  const ranges = [7, 30, 90];

  if (loading) {
    return (
      <section className='rounded-xl border border-gray-200 bg-white p-6'>
        <div className='h-6 w-64 animate-pulse rounded bg-gray-200' />
        <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className='h-20 animate-pulse rounded-lg bg-gray-100' />
          ))}
        </div>
        <div className='mt-4 h-64 animate-pulse rounded-lg bg-gray-100' />
      </section>
    );
  }

  if (!data) {
    return null;
  }

  const summary = data.summary || {};
  const cards = [
    {
      title: 'Rata-rata Nilai',
      value: formatScore(summary.average_score),
      helper: `${summary.score_samples || 0} sampel`,
      icon: TrendingUp,
      iconColor: 'text-sky-700',
      bg: 'bg-sky-50',
    },
    {
      title: 'Pass Rate',
      value: formatPercent(summary.pass_rate),
      helper: 'Batas lulus >= 75',
      icon: ClipboardCheck,
      iconColor: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Completion Rate',
      value: formatPercent(summary.completion_rate),
      helper: `${summary.completed_participants || 0}/${summary.total_participants || 0} peserta`,
      icon: BarChart3,
      iconColor: 'text-violet-700',
      bg: 'bg-violet-50',
    },
    {
      title: 'Sudah Dinilai',
      value: formatPercent(summary.graded_rate),
      helper: `${summary.graded_participants || 0} peserta GRADED`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <section className='rounded-xl border border-gray-200 bg-white p-6'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h3 className='text-xl font-semibold text-gray-900'>Insight Performa Ujian</h3>
          <p className='text-sm text-gray-500'>
            Ringkasan penilaian per ujian, distribusi nilai, dan aksi review hasil ujian yang bisa langsung ditindaklanjuti.
          </p>
          {selectedExam?.exam_name && (
            <p className='mt-1 text-xs text-sky-700'>
              Ujian terpilih: <span className='font-semibold'>{selectedExam.exam_name}</span>
            </p>
          )}
        </div>

        <div className='flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1'>
          {ranges.map((days) => (
            <button
              key={days}
              type='button'
              onClick={() => onChangeDays(days)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedDays === days
                  ? 'bg-sky-700 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {days} hari
            </button>
          ))}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className='rounded-lg border border-gray-200 bg-gray-50/70 p-4'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <p className='text-xs font-medium uppercase tracking-wide text-gray-500'>{card.title}</p>
                  <p className='mt-1 text-2xl font-bold text-gray-900'>{card.value}</p>
                  <p className='mt-1 text-xs text-gray-500'>{card.helper}</p>
                </div>
                <div className={`rounded-full p-2 ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className='mt-5'>
        <ReviewAndDistribution
          summary={summary}
          recentExams={data.recent_exams || []}
        />
      </div>
    </section>
  );
}
