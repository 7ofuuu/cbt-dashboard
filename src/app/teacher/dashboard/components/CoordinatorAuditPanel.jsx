'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  Gauge,
  Search,
  Users,
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

const riskBadgeClass = (riskScore) => {
  if (riskScore >= 70) return 'bg-red-100 text-red-700 border-red-200';
  if (riskScore >= 45) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
};

const widthByPercent = (value) => `${clamp(value)}%`;

const describeStudentRisk = (student) => {
  const reasons = [];

  if ((student.completion_rate ?? 0) < 70) {
    reasons.push(`penyelesaian ujian ${formatPercent(student.completion_rate)}`);
  }
  if (student.average_score !== null && student.average_score !== undefined && student.average_score < 75) {
    reasons.push(`rata-rata nilai ${formatScore(student.average_score)} (< 75)`);
  }
  if ((student.not_started_exams ?? 0) > 0) {
    reasons.push(`${student.not_started_exams} ujian belum dimulai`);
  }
  if ((student.low_score_count ?? 0) > 0) {
    reasons.push(`${student.low_score_count} hasil bernilai rendah`);
  }

  if (!reasons.length) {
    return 'Butuh pemantauan karena kombinasi progres dan hasil belajar pada rentang ini.';
  }

  return `Perlu pendampingan karena ${reasons.join(', ')}.`;
};

function TeacherPerformanceCompact({ items = [] }) {
  const [searchTeacher, setSearchTeacher] = useState('');
  const query = searchTeacher.trim().toLowerCase();

  const rows = useMemo(() => {
    if (!query) return items;

    return items.filter((teacher) => {
      const haystack = `${teacher.full_name || ''} ${teacher.subject || ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [items, query]);

  if (!items.length) {
    return (
      <div className='rounded-lg border border-gray-200 bg-white p-4 h-[460px] flex flex-col'>
        <h4 className='text-sm font-semibold text-gray-800'>Performa Guru</h4>
        <p className='mt-2 text-sm text-gray-500'>Belum ada data performa guru untuk rentang ini.</p>
      </div>
    );
  }

  return (
    <div className='rounded-lg border border-gray-200 bg-white p-4 h-[460px] flex flex-col'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <BarChart3 className='h-4 w-4 text-sky-700' />
          <h4 className='text-sm font-semibold text-gray-800'>Performa Guru</h4>
          <span className='rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700'>
            {rows.length}/{items.length}
          </span>
        </div>

        <label className='relative w-full max-w-xs'>
          <Search className='pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400' />
          <input
            type='text'
            value={searchTeacher}
            onChange={(event) => setSearchTeacher(event.target.value)}
            placeholder='Cari nama guru atau mapel'
            className='h-8 w-full rounded-md border border-gray-200 bg-white pl-8 pr-2 text-xs text-gray-700 outline-none ring-0 placeholder:text-gray-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100'
          />
        </label>
      </div>

      {rows.length === 0 ? (
        <div className='flex h-full items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50/60 p-4 text-sm text-gray-500'>
          Tidak ada guru yang cocok dengan kata kunci pencarian.
        </div>
      ) : (
        <div className='space-y-2 overflow-y-auto pr-1'>
          {rows.map((teacher) => (
            <div key={teacher.teacher_id} className='rounded-md border border-gray-100 bg-gray-50/70 p-3'>
              <div className='mb-1 flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-semibold text-gray-900'>{teacher.full_name}</p>
                  <p className='truncate text-xs text-gray-500'>
                    {teacher.subject || '-'} • {teacher.total_exams || 0} ujian • {teacher.assigned_participants || 0} peserta
                  </p>
                </div>
                <div className='text-right text-xs'>
                  <p className='font-semibold text-sky-700'>Avg {formatScore(teacher.average_score)}</p>
                  <p className='text-gray-500'>Completion {formatPercent(teacher.completion_rate)}</p>
                </div>
              </div>

              <div className='mb-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-600'>
                <span className='rounded-full border border-gray-200 bg-white px-2 py-0.5'>
                  Pass {formatPercent(teacher.pass_rate)}
                </span>
                <span className='rounded-full border border-gray-200 bg-white px-2 py-0.5'>
                  Backlog {teacher.grading_backlog || 0}
                </span>
                <span className={`rounded-full border px-2 py-0.5 font-semibold ${riskBadgeClass(teacher.risk_score)}`}>
                  Risk {formatScore(teacher.risk_score)}
                </span>
              </div>

              <div className='space-y-1.5'>
                <div>
                  <div className='mb-0.5 flex items-center justify-between text-[10px] text-gray-500'>
                    <span>Rata-rata nilai</span>
                    <span>{formatScore(teacher.average_score)}</span>
                  </div>
                  <div className='h-1.5 rounded-full bg-gray-200'>
                    <div className='h-1.5 rounded-full bg-sky-500' style={{ width: widthByPercent(teacher.average_score) }} />
                  </div>
                </div>
                <div>
                  <div className='mb-0.5 flex items-center justify-between text-[10px] text-gray-500'>
                    <span>Penyelesaian ujian</span>
                    <span>{formatPercent(teacher.completion_rate)}</span>
                  </div>
                  <div className='h-1.5 rounded-full bg-gray-200'>
                    <div className='h-1.5 rounded-full bg-emerald-500' style={{ width: widthByPercent(teacher.completion_rate) }} />
                  </div>
                </div>
                <div>
                  <div className='mb-0.5 flex items-center justify-between text-[10px] text-gray-500'>
                    <span>Kelulusan (pass rate)</span>
                    <span>{formatPercent(teacher.pass_rate)}</span>
                  </div>
                  <div className='h-1.5 rounded-full bg-gray-200'>
                    <div className='h-1.5 rounded-full bg-violet-500' style={{ width: widthByPercent(teacher.pass_rate) }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentRiskCompact({ items = [] }) {
  const rows = items.slice(0, 6);

  if (!rows.length) {
    return (
      <div className='rounded-lg border border-gray-200 bg-white p-4 h-[360px] flex flex-col'>
        <h4 className='text-sm font-semibold text-gray-800'>Murid Perlu Pendampingan</h4>
        <p className='mt-2 text-sm text-gray-500'>Belum ada murid prioritas pendampingan.</p>
      </div>
    );
  }

  return (
    <div className='rounded-lg border border-gray-200 bg-white p-4 h-[360px] flex flex-col'>
      <div className='mb-3 flex items-center gap-2'>
        <Users className='h-4 w-4 text-violet-700' />
        <h4 className='text-sm font-semibold text-gray-800'>Murid Perlu Pendampingan</h4>
      </div>

      <div className='space-y-2 overflow-y-auto pr-1'>
        {rows.map((student) => (
          <div key={student.student_id} className='rounded-md border border-gray-100 bg-gray-50/70 p-2.5'>
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold text-gray-900'>{student.full_name}</p>
                <p className='text-xs text-gray-500'>
                  {student.classroom} • Avg {formatScore(student.average_score)} • Completion {formatPercent(student.completion_rate)}
                </p>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${riskBadgeClass(student.risk_score)}`}>
                Risk {formatScore(student.risk_score)}
              </span>
            </div>
            <div className='min-w-0'>
              <p className='mt-1.5 text-[11px] leading-relaxed text-gray-600'>
                {describeStudentRisk(student)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionAlertsCompact({ items = [] }) {
  const rows = items.slice(0, 6);

  if (!rows.length) {
    return (
      <div className='rounded-lg border border-gray-200 bg-white p-4 h-[360px] flex flex-col'>
        <h4 className='text-sm font-semibold text-gray-800'>Soal Prioritas Evaluasi</h4>
        <p className='mt-2 text-sm text-gray-500'>Belum ada data soal prioritas evaluasi.</p>
      </div>
    );
  }

  return (
    <div className='rounded-lg border border-gray-200 bg-white p-4 h-[360px] flex flex-col'>
      <div className='mb-3 flex items-center gap-2'>
        <AlertTriangle className='h-4 w-4 text-amber-600' />
        <h4 className='text-sm font-semibold text-gray-800'>Soal Prioritas Evaluasi</h4>
      </div>

      <div className='space-y-2 overflow-y-auto pr-1'>
        {rows.map((question) => {
          // Fallback ke daftar bank soal mapel ketika relasi bank tidak tersedia pada data lama.
          const bankSoalHref = question.question_bank_id
            ? `/teacher/question-bank/${question.question_bank_id}`
            : `/teacher/question-bank?q=${encodeURIComponent(question.subject || '')}`;

          const actionLabel = question.question_bank_id
            ? 'Buka bank soal terkait'
            : 'Cari bank soal mapel ini';

          return (
            <div key={question.question_id} className='rounded-md border border-gray-100 bg-gray-50/70 p-2.5'>
              <div className='mb-1 flex items-start justify-between gap-2'>
                <p className='line-clamp-2 text-sm text-gray-800'>{question.question_text}</p>
                <span className='shrink-0 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700'>
                  {question.question_type === 'ESSAY'
                    ? `Skor ${formatScore(question.avg_manual_score)}`
                    : `Salah ${formatPercent(question.incorrect_rate)}`}
                </span>
              </div>
              <p className='text-xs text-gray-500'>
                {question.subject} • {question.question_type} • Attempt {question.total_attempts}
              </p>
              <Link
                href={bankSoalHref}
                className='mt-1.5 inline-flex rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-100'
              >
                {actionLabel}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CoordinatorAuditPanel({ data, loading }) {
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
  const meta = data.meta || {};

  const cards = [
    {
      title: 'Rata-rata Nilai',
      value: formatScore(summary.average_score),
      helper: `${summary.score_samples || 0} sampel nilai`,
      icon: Gauge,
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
      icon: Users,
      iconColor: 'text-violet-700',
      bg: 'bg-violet-50',
    },
    {
      title: 'Backlog Penilaian',
      value: `${summary.grading_backlog || 0}`,
      helper: 'Status COMPLETED belum GRADED',
      icon: AlertTriangle,
      iconColor: 'text-amber-700',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <section className='rounded-xl border border-gray-200 bg-white p-6'>
      <div className='mb-4'>
        <h3 className='text-xl font-semibold text-gray-900'>Audit Kinerja Guru & Murid</h3>
        <p className='text-sm text-gray-500'>
          Khusus koordinator • rentang {meta.days || 30} hari ({meta.from_date || '-'} s/d {meta.to_date || '-'})
        </p>
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

      <div className='mt-4'>
        <TeacherPerformanceCompact items={data.teacher_performance || []} />
      </div>

      <div className='mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2'>
        <StudentRiskCompact items={data.student_risk || []} />
        <QuestionAlertsCompact items={data.question_alerts || []} />
      </div>
    </section>
  );
}
