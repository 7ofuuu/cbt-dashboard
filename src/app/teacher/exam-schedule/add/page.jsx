"use client";

import { useState } from 'react';
import Link from 'next/link';
import TeacherLayout from '../../teacherLayout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Save, X, Clock, BookOpen, Users, FileText, Calendar, ArrowRight, Info, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import request from '@/utils/request';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { SUBJECT_OPTIONS } from '@/lib/constants';

export default function TambahJadwalPage() {
  useAuth(['teacher']);
  const router = useRouter();

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field) => (e) => setForm((s) => ({ ...s, [field]: e.target.value }));
  const updateSelect = (field) => (value) => setForm((s) => ({ ...s, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    if (!form.exam_name || !form.tanggal || !form.pukul || !form.grade_level || !form.major || !form.subject) {
      toast.error('Harap lengkapi semua field yang wajib diisi.');
      return;
    }

    const startTime = new Date(`${form.tanggal}T${form.pukul}:00.000+07:00`);
    const duration = parseInt(form.duration_minutes) || 120;
    const endTime = new Date(startTime.getTime() + duration * 60000);

    try {
      setIsSubmitting(true);

      const examPayload = {
        exam_name: form.exam_name,
        subject: form.subject,
        grade_level: form.grade_level,
        major: form.major,
        start_date: startTime.toISOString(),
        end_date: endTime.toISOString(),
        duration_minutes: duration,
        is_shuffle_questions: form.is_shuffle_questions,
      };

      const createRes = await request.post('/exams', examPayload);
      const newUjianId = createRes.data.exam.exam_id;
      const siswaAssigned = createRes.data.auto_assigned_students || 0;

      if (siswaAssigned > 0) {
        toast.success(`Jadwal berhasil dibuat! ${siswaAssigned} siswa telah di-assign secara otomatis.`, {
          duration: 4000
        });
      } else {
        toast.success('Jadwal berhasil dibuat!', { duration: 2000 });
        toast('Tidak ada siswa yang cocok untuk di-assign otomatis.', {
          icon: '⚠️',
          duration: 5000,
          style: {
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #FCD34D'
          }
        });
      }

      router.push(`/teacher/exam-schedule/add/select-bank?ujianId=${newUjianId}`);

    } catch (error) {
      let errorMessage = 'Gagal membuat jadwal ujian.';

      if (error.response) {
        const status = error.response.status;
        if (status === 400) errorMessage = 'Data yang dikirim tidak valid. Periksa kembali form Anda.';
        else if (status === 403) errorMessage = 'Anda tidak memiliki akses untuk membuat jadwal ujian.';
        else if (status === 409) errorMessage = 'Jadwal ujian dengan data tersebut sudah ada.';
        else errorMessage = 'Terjadi kesalahan pada server. Silakan coba lagi.';
      } else if (error.request) {
        errorMessage = 'Server tidak merespons. Pastikan koneksi internet Anda.';
      }

      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  }

  const formComplete = form.exam_name && form.tanggal && form.pukul && form.grade_level && form.major && form.subject;

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: Form */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleSubmit}>
            {/* Info + Subject */}
            <div className="bg-white border rounded-lg shadow-sm mb-4">
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50/50 rounded-t-lg">
                <FileText className="w-4 h-4 text-sky-700" />
                <h3 className="font-semibold text-sm text-gray-800">Informasi Ujian</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="exam_name" className="text-xs">Nama Ujian <span className="text-red-500">*</span></Label>
                    <Input id="exam_name" required placeholder="UTS Matematika" value={form.exam_name} onChange={update('exam_name')} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="subject" className="text-xs">Mata Pelajaran <span className="text-red-500">*</span></Label>
                    <Select value={form.subject} onValueChange={updateSelect('subject')}>
                      <SelectTrigger id="subject" className="h-9"><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent>
                        {SUBJECT_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Peserta + Waktu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Target Peserta */}
              <div className="bg-white border rounded-lg shadow-sm">
                <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50/50 rounded-t-lg">
                  <Users className="w-4 h-4 text-sky-700" />
                  <h3 className="font-semibold text-sm text-gray-800">Target Peserta</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tingkat <span className="text-red-500">*</span></Label>
                    <Select value={form.grade_level} onValueChange={updateSelect('grade_level')}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="X">X</SelectItem>
                        <SelectItem value="XI">XI</SelectItem>
                        <SelectItem value="XII">XII</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Jurusan <span className="text-red-500">*</span></Label>
                    <Select value={form.major} onValueChange={updateSelect('major')}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IPA">IPA</SelectItem>
                        <SelectItem value="IPS">IPS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {form.grade_level && form.major && (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-medium text-blue-900">
                        Siswa Tingkat {form.grade_level} Jurusan {form.major} akan otomatis di-assign.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Waktu & Durasi */}
              <div className="bg-white border rounded-lg shadow-sm">
                <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50/50 rounded-t-lg">
                  <Calendar className="w-4 h-4 text-sky-700" />
                  <h3 className="font-semibold text-sm text-gray-800">Waktu & Durasi</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tanggal <span className="text-red-500">*</span></Label>
                    <Input type="date" required value={form.tanggal} onChange={update('tanggal')} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Waktu Mulai <span className="text-red-500">*</span></Label>
                    <Input type="time" required value={form.pukul} onChange={update('pukul')} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Durasi (menit) <span className="text-red-500">*</span></Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" required min="1" max="480" className="w-24 h-9" value={form.duration_minutes} onChange={(e) => setForm(s => ({ ...s, duration_minutes: e.target.value }))} />
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {form.duration_minutes ? `${Math.floor(form.duration_minutes / 60)}j ${form.duration_minutes % 60}m` : '—'}
                      </span>
                    </div>
                  </div>

                  {form.tanggal && form.pukul && form.duration_minutes && (
                    <div className="p-2 bg-gray-50 border rounded text-xs text-gray-600">
                      {new Date(`${form.tanggal}T${form.pukul}`).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })},{' '}
                      {form.pukul} — {(() => {
                        const end = new Date(new Date(`${form.tanggal}T${form.pukul}`).getTime() + (parseInt(form.duration_minutes) || 0) * 60000);
                        return end.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                      })()} WIB
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pengaturan + Actions */}
            <div className="bg-white border rounded-lg shadow-sm mb-4">
              <div className="px-4 py-3 flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_shuffle_questions}
                    onChange={(e) => setForm(s => ({ ...s, is_shuffle_questions: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-800">Acak Urutan Soal</span>
                    <p className="text-xs text-gray-500">Diacak per siswa</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href="/teacher/exam-schedule"><X className="w-4 h-4 mr-1" /> Batal</Link>
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-sky-800 hover:bg-sky-900"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Menyimpan...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" /> Simpan & Pilih Soal
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Right column: Info & Steps */}
        <div className="space-y-4">
          {/* Step Progress */}
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50/50 rounded-t-lg">
              <Info className="w-4 h-4 text-sky-700" />
              <h3 className="font-semibold text-sm text-gray-800">Langkah Pembuatan</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${formComplete ? 'bg-green-100 text-green-700 border-2 border-green-400' : 'bg-sky-100 text-sky-700 border-2 border-sky-400 animate-pulse'}`}>1</div>
                    <div className="w-0.5 h-full bg-gray-200 mt-1" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-semibold text-gray-800">Isi Data Ujian</p>
                    <p className="text-xs text-gray-500 mt-0.5">Lengkapi informasi, target peserta, dan waktu ujian.</p>
                    {formComplete && (
                      <Badge className="mt-1.5 text-[10px] bg-green-50 text-green-700 border-green-200" variant="outline">Lengkap</Badge>
                    )}
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-400 border-2 border-gray-300">2</div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-400">Pilih Bank Soal</p>
                    <p className="text-xs text-gray-400 mt-0.5">Setelah simpan, Anda akan memilih bank soal untuk ujian ini.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Preview */}
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50/50 rounded-t-lg">
              <BookOpen className="w-4 h-4 text-sky-700" />
              <h3 className="font-semibold text-sm text-gray-800">Ringkasan</h3>
            </div>
            <div className="p-4">
              {formComplete ? (
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs">Nama</span>
                    <span className="font-medium text-xs text-right max-w-[60%] truncate">{form.exam_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs">Mapel</span>
                    <Badge variant="secondary" className="text-[10px]">{form.subject}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs">Target</span>
                    <span className="font-medium text-xs">{form.grade_level} — {form.major}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs">Waktu</span>
                    <span className="font-medium text-xs">{form.tanggal} {form.pukul}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs">Durasi</span>
                    <span className="font-medium text-xs">{form.duration_minutes} menit</span>
                  </div>
                  <div className="border-t pt-2.5 mt-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-xs">Acak Soal</span>
                      <Badge variant={form.is_shuffle_questions ? "default" : "secondary"} className="text-[10px]">
                        {form.is_shuffle_questions ? 'Ya' : 'Tidak'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-xs text-gray-400">Lengkapi form untuk melihat ringkasan</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}