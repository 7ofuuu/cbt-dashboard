"use client";

import { useState, useEffect, useMemo } from 'react';
import TeacherLayout from '../teacherLayout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { Home, Plus, Search, Pencil, Trash2, AlertTriangle, BookOpen } from 'lucide-react';
import Link from 'next/link';
import request from '@/utils/request';
import toast from 'react-hot-toast';
import { SUBJECT_OPTIONS, GRADE_LEVELS, MAJOR_OPTIONS } from '@/lib/constants';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function JadwalUjianPage() {
  useAuth(['teacher']);

  const [ujians, setUjians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMajor, setFilterMajor] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('terbaru');

  const fetchJadwal = async () => {
    try {
      setLoading(true);
      const response = await request.get('/exams');
      setUjians(response.data.data);
    } catch (error) {
      console.error('Gagal memuat jadwal ujian:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJadwal();
  }, []);

  const handleDelete = async (examId, examName) => {
    try {
      await request.delete(`/exams/${examId}`);
      toast.success(`Ujian "${examName}" berhasil dihapus.`);
      fetchJadwal();
    } catch (error) {
      let msg = 'Gagal menghapus ujian.';
      if (error.response?.status === 400) {
        msg = error.response.data?.message || msg;
      }
      toast.error(msg);
    }
  };

  const getColor = (index) => {
    const colors = ['bg-teal-700', 'bg-orange-400', 'bg-pink-400', 'bg-blue-600'];
    return colors[index % colors.length];
  };

  const getStatusBadge = (status) => {
    const map = {
      SCHEDULED: { label: 'Terjadwal', cls: 'bg-blue-100 text-blue-800' },
      ONGOING: { label: 'Berlangsung', cls: 'bg-green-100 text-green-800' },
      ENDED: { label: 'Selesai', cls: 'bg-gray-100 text-gray-800' },
    };
    const s = map[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
  };

  const filteredUjians = useMemo(() => {
    let result = ujians.filter(u => {
      const q = searchQuery.toLowerCase();
      const matchQuery = !q || u.exam_name?.toLowerCase().includes(q) || u.subject?.toLowerCase().includes(q);
      const matchMajor = filterMajor === 'all' || u.major === filterMajor;
      const matchGrade = filterGrade === 'all' || u.grade_level === filterGrade;
      const matchSubject = filterSubject === 'all' || u.subject === filterSubject;
      const matchStatus = filterStatus === 'all' || u.exam_status === filterStatus;
      return matchQuery && matchMajor && matchGrade && matchSubject && matchStatus;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'terlama':
          return new Date(a.start_date) - new Date(b.start_date);
        case 'nama-asc':
          return (a.exam_name || '').localeCompare(b.exam_name || '');
        case 'nama-desc':
          return (b.exam_name || '').localeCompare(a.exam_name || '');
        case 'terbaru':
        default:
          return new Date(b.start_date) - new Date(a.start_date);
      }
    });

    return result;
  }, [ujians, searchQuery, filterMajor, filterGrade, filterSubject, filterStatus, sortBy]);

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
            <BreadcrumbPage>Jadwal Ujian</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-6">
        <PageHeader
          title="Jadwal Ujian"
          description="Kelola dan lihat semua jadwal ujian"
        >
          <Link href="/teacher/exam-schedule/add" className="inline-flex items-center gap-2 bg-sky-800 text-white px-4 py-2 rounded-md hover:bg-sky-900">
            <Plus className="h-5 w-5" />
            Tambah Jadwal Ujian
          </Link>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-3">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Input
                    type="search"
                    placeholder="Cari ujian (nama, mapel...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Mata Pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Mapel</SelectItem>
                  {SUBJECT_OPTIONS.map((subject) => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Tingkat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tingkat</SelectItem>
                  {GRADE_LEVELS.map((grade) => (
                    <SelectItem key={grade.value} value={grade.value}>Tingkat {grade.value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterMajor} onValueChange={setFilterMajor}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Jurusan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jurusan</SelectItem>
                  {MAJOR_OPTIONS.map((major) => (
                    <SelectItem key={major.value} value={major.value}>{major.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="SCHEDULED">Terjadwal</SelectItem>
                  <SelectItem value="ONGOING">Berlangsung</SelectItem>
                  <SelectItem value="ENDED">Selesai</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="terbaru">Terbaru</SelectItem>
                  <SelectItem value="terlama">Terlama</SelectItem>
                  <SelectItem value="nama-asc">Nama A-Z</SelectItem>
                  <SelectItem value="nama-desc">Nama Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-10">Memuat data...</div>
            ) : filteredUjians.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  {ujians.length === 0 ? 'Belum ada jadwal ujian' : 'Tidak ada ujian yang cocok dengan filter'}
                </div>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredUjians.map((u, i) => (
                  <div key={u.exam_id} className="bg-white rounded-lg shadow-sm overflow-hidden border flex flex-col">

                    <div className={`${getColor(i)} text-white p-4`}>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm leading-tight">{u.exam_name}</h3>
                        {getStatusBadge(u.exam_status)}
                      </div>
                    </div>
                    <div className="p-4 text-sm text-gray-700 flex-1">
                      <div className="flex justify-between border-b py-1">
                        <span className="font-medium">Mapel:</span>
                        <span>{u.subject}</span>
                      </div>
                      <div className="flex justify-between border-b py-1">
                        <span className="font-medium">Jurusan/Tingkat:</span>
                        <span>{u.major} / {u.grade_level}</span>
                      </div>
                      <div className="flex justify-between border-b py-1">
                        <span className="font-medium">Durasi:</span>
                        <span>{u.duration_minutes} Menit</span>
                      </div>
                      {u.teacher && (
                        <div className="flex justify-between border-b py-1">
                          <span className="font-medium">Pembuat:</span>
                          <span className="text-blue-600">{u.teacher.full_name}</span>
                        </div>
                      )}
                      <div className="flex flex-col mt-2">
                        <span className="font-medium text-xs text-gray-400 uppercase">Mulai:</span>
                        <span>{new Date(u.start_date).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex flex-col mt-1">
                        <span className="font-medium text-xs text-gray-400 uppercase">Selesai:</span>
                        <span>{new Date(u.end_date).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between border-t py-1 mt-2">
                        <span className="font-medium flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Soal:</span>
                        <span className={u._count?.exam_questions === 0 ? 'text-red-600 font-semibold' : ''}>{u._count?.exam_questions || 0} soal</span>
                      </div>
                      {(u._count?.exam_questions === 0) && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          <span className="text-xs text-red-700 font-medium">Belum ada bank soal — ujian tidak bisa dimulai</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="px-4 pb-4 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/teacher/exam-schedule/edit/${u.exam_id}`}>
                          <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            disabled={u.exam_status === 'ONGOING'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Ujian</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus ujian <strong>&quot;{u.exam_name}&quot;</strong>? Semua data terkait (soal, peserta, jawaban) akan ikut dihapus. Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(u.exam_id, u.exam_name)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
              )}
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
