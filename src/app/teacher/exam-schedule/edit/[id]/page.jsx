"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import TeacherLayout from '../../../teacherLayout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Save, X, Clock, BookOpen, Users, FileText, Calendar, Loader2, Trash2, RefreshCw, Search, CheckCircle2, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import request from '@/utils/request';
import toast from 'react-hot-toast';
import { SUBJECT_OPTIONS, getSubjectColor } from '@/lib/constants';

export default function EditJadwalPage() {
  useAuth(['teacher']);
  const router = useRouter();
  const params = useParams();
  const examId = params.id;

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
  const [originalCategory, setOriginalCategory] = useState({ grade_level: '', major: '' });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examStatus, setExamStatus] = useState(null);

  // Question bank state
  const [assignedBanks, setAssignedBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [availableBanks, setAvailableBanks] = useState([]);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [selectedNewBank, setSelectedNewBank] = useState(null);
  const [assigningBank, setAssigningBank] = useState(false);

  // Participant reassign state
  const [reassigning, setReassigning] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  const categoryChanged = form.grade_level !== originalCategory.grade_level || form.major !== originalCategory.major;

  const update = (field) => (e) => setForm((s) => ({ ...s, [field]: e.target.value }));
  const updateSelect = (field) => (value) => setForm((s) => ({ ...s, [field]: value }));

  // Load existing exam data
  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        const response = await request.get(`/exams/${examId}`);
        const exam = response.data.exam;

        const startDate = new Date(exam.start_date);
        const tanggal = startDate.toISOString().split('T')[0];
        const pukul = startDate.toTimeString().slice(0, 5);

        setForm({
          exam_name: exam.exam_name || '',
          tanggal,
          pukul,
          grade_level: exam.grade_level || '',
          major: exam.major || '',
          subject: exam.subject || '',
          duration_minutes: exam.duration_minutes || 120,
          is_shuffle_questions: exam.is_shuffle_questions ?? true,
        });
        setOriginalCategory({ grade_level: exam.grade_level || '', major: exam.major || '' });
        setExamStatus(exam.exam_status);
        setParticipantCount(exam.exam_participants?.length || 0);
      } catch (error) {
        toast.error('Gagal memuat data ujian.');
        router.push('/teacher/exam-schedule');
      } finally {
        setLoading(false);
      }
    };

    if (examId) fetchExam();
  }, [examId, router]);

  // Load assigned question banks
  const fetchAssignedBanks = useCallback(async () => {
    try {
      setLoadingBanks(true);
      const res = await request.get(`/exams/${examId}/questions-by-bank`);
      setAssignedBanks(res.data.banks || []);
    } catch {
      // silent
    } finally {
      setLoadingBanks(false);
    }
  }, [examId]);

  useEffect(() => {
    if (examId) fetchAssignedBanks();
  }, [examId, fetchAssignedBanks]);

  // Load available banks for picker
  const fetchAvailableBanks = async () => {
    try {
      const res = await request.get('/questions/bank');
      setAvailableBanks(res.data.question_bank || []);
    } catch {
      toast.error('Gagal memuat daftar bank soal');
    }
  };

  const handleOpenBankPicker = () => {
    setShowBankPicker(true);
    setSelectedNewBank(null);
    setBankSearchQuery('');
    fetchAvailableBanks();
  };

  const handleAssignBank = async () => {
    if (!selectedNewBank) return;
    setAssigningBank(true);
    try {
      await request.post('/exams/assign-bank', {
        exam_id: Number(examId),
        question_bank_id: selectedNewBank.question_bank_id,
      });
      toast.success('Bank soal berhasil ditambahkan!');
      setShowBankPicker(false);
      setSelectedNewBank(null);
      fetchAssignedBanks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menambahkan bank soal');
    } finally {
      setAssigningBank(false);
    }
  };

  const handleRemoveBank = async (bankId) => {
    if (!confirm('Hapus semua soal dari bank ini?')) return;
    try {
      await request.post('/exams/remove-bank', {
        exam_id: Number(examId),
        question_bank_id: bankId,
      });
      toast.success('Bank soal berhasil dihapus dari ujian');
      fetchAssignedBanks();
    } catch (error) {
      toast.error('Gagal menghapus bank soal');
    }
  };

  const handleReassignStudents = async () => {
    if (!form.grade_level || !form.major) {
      toast.error('Pilih tingkat dan jurusan terlebih dahulu');
      return;
    }
    setReassigning(true);
    try {
      const res = await request.post('/exams/reassign-students', {
        exam_id: Number(examId),
        grade_level: form.grade_level,
        major: form.major,
      });
      toast.success(res.data.message);
      setOriginalCategory({ grade_level: form.grade_level, major: form.major });
      const examRes = await request.get(`/exams/${examId}`);
      setParticipantCount(examRes.data.exam.exam_participants?.length || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal reassign peserta');
    } finally {
      setReassigning(false);
    }
  };

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

      await request.put(`/exams/${examId}`, {
        exam_name: form.exam_name,
        subject: form.subject,
        grade_level: form.grade_level,
        major: form.major,
        start_date: startTime.toISOString(),
        end_date: endTime.toISOString(),
        duration_minutes: duration,
        is_shuffle_questions: form.is_shuffle_questions,
      });

      // Auto-reassign if category changed
      if (categoryChanged) {
        try {
          await request.post('/exams/reassign-students', {
            exam_id: Number(examId),
            grade_level: form.grade_level,
            major: form.major,
          });
          toast.success('Jadwal diperbarui & peserta di-reassign!');
        } catch {
          toast.success('Jadwal diperbarui, tapi gagal reassign peserta.');
        }
      } else {
        toast.success('Jadwal ujian berhasil diperbarui!');
      }

      router.push('/teacher/exam-schedule');
    } catch (error) {
      let errorMessage = 'Gagal memperbarui jadwal ujian.';
      if (error.response) {
        const status = error.response.status;
        if (status === 400) errorMessage = error.response.data?.message || 'Data tidak valid.';
        else if (status === 403) errorMessage = 'Tidak memiliki akses.';
        else if (status === 404) errorMessage = 'Ujian tidak ditemukan.';
        else errorMessage = 'Terjadi kesalahan server.';
      } else if (error.request) {
        errorMessage = 'Server tidak merespons.';
      }
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-sky-700" />
          <span className="ml-3 text-gray-600">Memuat data ujian...</span>
        </div>
      </TeacherLayout>
    );
  }

  const isEditable = examStatus !== 'ONGOING' && examStatus !== 'COMPLETED';
  const totalAssignedQuestions = assignedBanks.reduce((sum, b) => sum + (b.questions?.length || 0), 0);

  // Filter available banks (exclude already assigned)
  const assignedBankIds = new Set(assignedBanks.map(b => b.question_bank_id));
  const filteredAvailableBanks = availableBanks
    .filter(b => !assignedBankIds.has(b.question_bank_id))
    .filter(b => {
      if (!bankSearchQuery.trim()) return true;
      const q = bankSearchQuery.toLowerCase();
      return (b.bank_name || '').toLowerCase().includes(q) ||
        (b.subject || '').toLowerCase().includes(q) ||
        (b.grade_level || '').toLowerCase().includes(q);
    });

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
            <BreadcrumbPage>Edit Ujian</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Edit Ujian"
        description="Ubah informasi ujian, kelola bank soal, dan peserta"
      />

      {!isEditable && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-700" />
          <p className="text-sm font-medium text-yellow-800">
            Ujian <strong>{examStatus}</strong> — hanya bank soal yang bisa diubah.
          </p>
        </div>
      )}

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
                    <Input id="exam_name" required disabled={!isEditable} placeholder="UTS Matematika" value={form.exam_name} onChange={update('exam_name')} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="subject" className="text-xs">Mata Pelajaran <span className="text-red-500">*</span></Label>
                    <Select value={form.subject} onValueChange={updateSelect('subject')} disabled={!isEditable}>
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
                  <Badge variant="secondary" className="ml-auto text-xs">{participantCount} siswa</Badge>
                </div>
                <div className="p-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tingkat <span className="text-red-500">*</span></Label>
                    <Select value={form.grade_level} onValueChange={updateSelect('grade_level')} disabled={!isEditable}>
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
                    <Select value={form.major} onValueChange={updateSelect('major')} disabled={!isEditable}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Pilih" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IPA">IPA</SelectItem>
                        <SelectItem value="IPS">IPS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {categoryChanged && isEditable && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs font-medium text-amber-900 mb-2">
                        Kategori diubah — peserta akan di-reassign saat simpan.
                      </p>
                      <Button type="button" size="sm" variant="outline" className="h-7 text-xs border-amber-300 text-amber-800 hover:bg-amber-100" onClick={handleReassignStudents} disabled={reassigning}>
                        {reassigning ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                        Reassign Sekarang
                      </Button>
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
                    <Input type="date" required disabled={!isEditable} value={form.tanggal} onChange={update('tanggal')} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Waktu Mulai <span className="text-red-500">*</span></Label>
                    <Input type="time" required disabled={!isEditable} value={form.pukul} onChange={update('pukul')} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Durasi (menit) <span className="text-red-500">*</span></Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" required min="1" max="480" className="w-24 h-9" disabled={!isEditable} value={form.duration_minutes} onChange={(e) => setForm(s => ({ ...s, duration_minutes: e.target.value }))} />
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
                    disabled={!isEditable}
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
              {isEditable && (
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-sky-800 hover:bg-sky-900">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4 mr-1" /> Simpan</>}
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Right column: Question Banks */}
        <div className="space-y-4">
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50/50 rounded-t-lg">
              <BookOpen className="w-4 h-4 text-sky-700" />
              <h3 className="font-semibold text-sm text-gray-800">Bank Soal</h3>
              <Badge variant="secondary" className="ml-auto text-xs">{totalAssignedQuestions} soal</Badge>
            </div>
            <div className="p-4">
              {loadingBanks ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : assignedBanks.length === 0 ? (
                <div className="text-center py-6">
                  <BookOpen className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Belum ada bank soal</p>
                  <p className="text-xs text-gray-400 mt-1">Tambahkan bank soal untuk ujian ini</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignedBanks.map((bank) => {
                    const color = getSubjectColor(bank.subject || bank.bank_name);
                    return (
                      <div key={bank.question_bank_id} className="flex items-center gap-2 p-2.5 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{bank.bank_name || bank.subject}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge className={`text-[10px] px-1.5 py-0 ${color}`} variant="secondary">{bank.subject}</Badge>
                            <span className="text-[10px] text-gray-500">{bank.questions?.length || 0} soal</span>
                          </div>
                        </div>
                        {isEditable && (
                          <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveBank(bank.question_bank_id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add bank button */}
              {isEditable && !showBankPicker && (
                <Button type="button" variant="outline" size="sm" className="w-full mt-3 h-8 text-xs" onClick={handleOpenBankPicker}>
                  <ArrowLeftRight className="w-3.5 h-3.5 mr-1.5" />
                  {assignedBanks.length === 0 ? 'Tambah Bank Soal' : 'Tambah / Ganti Bank Soal'}
                </Button>
              )}

              {/* Bank picker inline */}
              {showBankPicker && (
                <div className="mt-3 border rounded-lg p-3 bg-sky-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700">Pilih Bank Soal</p>
                    <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowBankPicker(false)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input placeholder="Cari..." value={bankSearchQuery} onChange={(e) => setBankSearchQuery(e.target.value)} className="pl-8 h-8 text-xs" />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {filteredAvailableBanks.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4">Tidak ada bank soal tersedia</p>
                    ) : filteredAvailableBanks.map((bank) => {
                      const isSelected = selectedNewBank?.question_bank_id === bank.question_bank_id;
                      return (
                        <div
                          key={bank.question_bank_id}
                          onClick={() => setSelectedNewBank(bank)}
                          className={`p-2 rounded-lg cursor-pointer border transition-colors ${isSelected ? 'border-sky-500 bg-sky-50 ring-1 ring-sky-300' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">{bank.bank_name || bank.subject}</p>
                              <p className="text-[10px] text-gray-500">{bank.grade_level} · {bank.major || '-'} · {bank.total_questions ?? 0} soal</p>
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-600 flex-shrink-0" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button type="button" size="sm" className="w-full h-8 text-xs bg-sky-800 hover:bg-sky-900" disabled={!selectedNewBank || assigningBank} onClick={handleAssignBank}>
                    {assigningBank ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                    Tambahkan
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
