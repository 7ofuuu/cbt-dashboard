"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link'; 
import TeacherLayout from '../teacherLayout';
import { useAuth } from '@/hooks/useAuth';
import { useAuthContext } from '@/contexts/AuthContext';
import request from '@/utils/request';

export default function DashboardPage() {
  useAuth(['teacher']);
  const { user: authUser } = useAuthContext();

  const [ujians, setUjians] = useState([]);
  const [bankSoal, setBankSoal] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch ujians
      const ujianRes = await request.get('/exams');
      const ujianData = ujianRes.data?.data || [];
      setUjians(ujianData.slice(0, 3)); // Ambil 3 ujian terbaru

      // Fetch bank soal
      const bankRes = await request.get('/questions/bank');
      const bankData = bankRes.data?.question_bank || [];
      setBankSoal(bankData.slice(0, 5)); // Ambil 5 bank soal
    } catch (error) {
      console.error('Gagal memuat data dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

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

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Ujian</h2>
            <Link href="/teacher/exam-schedule" className="text-sky-700 font-medium">Lihat semua</Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Memuat data...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {ujians.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <p>Belum ada ujian. Silakan buat jadwal ujian terlebih dahulu.</p>
                  <Link href="/teacher/exam-schedule/add" className="text-sky-700 hover:underline mt-2 inline-block">
                    Tambah Jadwal Ujian
                  </Link>
                </div>
              ) : (
                ujians.map((u) => (
                  <div key={u.exam_id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-sky-700 text-white p-4">
                      <h3 className="font-semibold">{u.exam_name}</h3>
                      <div className="text-xs opacity-90">{u.grade_level} {u.major ? `- ${u.major}` : ''}</div>
                    </div>
                    <div className="p-4 text-sm text-gray-700 space-y-1">
                      <div className="flex justify-between"><span>Mata Pelajaran:</span><span className="font-medium">{u.subject}</span></div>
                      <div className="flex justify-between"><span>Durasi:</span><span className="font-medium">{u.duration_minutes} menit</span></div>
                      <div className="flex justify-between"><span>Peserta:</span><span className="font-medium">{u._count?.exam_participants || 0} siswa</span></div>
                      <div className="flex justify-between"><span>Soal:</span><span className="font-medium">{u._count?.exam_questions || 0} soal</span></div>
                    </div>
                    <div className="px-4 pb-4">
                      <Link 
                        href={`/teacher/exam-schedule`}
                        className="block text-center bg-sky-100 text-sky-700 hover:bg-sky-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Lihat Detail
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Bank Soal</h2>
            <Link href="/teacher/question-bank" className="text-sky-700 font-medium">Lihat semua ››</Link>
          </div>

          {loading ? (
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
                bankSoal.map((b, i) => {
                  const colors = ['bg-sky-600', 'bg-orange-500', 'bg-pink-500', 'bg-purple-600', 'bg-teal-600'];
                  const colorClass = colors[i % colors.length];
                  
                  return (
                    <div key={b.question_bank_id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className={`${colorClass} text-white p-4`}>
                        <h3 className="font-semibold">{b.subject}</h3>
                        <div className="text-xs opacity-90">{b.grade_level} {b.major ? `- ${b.major}` : ''}</div>
                      </div>
                      <div className="p-4 text-sm text-gray-700 space-y-1">
                        <div className="flex justify-between"><span>Total Soal:</span><span className="font-bold text-lg text-sky-600">{b.total_questions}</span></div>
                        <div className="flex justify-between"><span>Pilihan Ganda:</span><span className="font-medium">{b.mc_count}</span></div>
                        <div className="flex justify-between"><span>Essay:</span><span className="font-medium">{b.essay_count}</span></div>
                      </div>
                      <div className="px-4 pb-4">
                        <Link 
                          href={`/teacher/question-bank/${b.question_bank_id}`}
                          className="block text-center bg-sky-100 text-sky-700 hover:bg-sky-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          Lihat Detail
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>
      </div>
    </TeacherLayout>
  );
}

