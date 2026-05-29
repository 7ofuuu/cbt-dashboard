'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Reorder, useDragControls } from 'framer-motion';
import TeacherLayout from '../../teacherLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus, Trash2, Copy, Image as ImageIcon, X, Home, Save, Loader2,
  GripVertical, CheckCircle2, CircleDot, SquareCheck, FileText,
  ChevronDown, ChevronUp, AlertCircle, ClipboardList, AlertTriangle,
} from 'lucide-react';
import request from '@/utils/request';
import toast from 'react-hot-toast';
import { GRADE_LEVELS, MAJOR_OPTIONS } from '@/lib/constants';
import { SubjectSelect } from '@/components/SubjectSelect';

// Local id generator for React keys + tracking which questions are new vs
// existing. We can't use question_id as the key because new (unsaved) cards
// don't have one yet.
function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function createOption(text = '') {
  return { id: uid('opt'), text, correct: false, option_id: null };
}

function newBlankQuestion(type = 'SINGLE_CHOICE') {
  const opts = type === 'ESSAY'
    ? []
    : [createOption(), createOption(), createOption(), createOption()];
  return {
    _localId: uid('q'),
    question_id: null,        // null = unsaved
    _dirty: true,             // new questions always need to be persisted
    type,
    text: '',
    options: opts,
    imageFile: null,
    imagePreview: null,
    imageUrl: '',
    existingImage: null,
  };
}

const getTypeLabel = (type) => ({
  SINGLE_CHOICE: 'Pilihan Ganda',
  MULTIPLE_CHOICE: 'Pilihan Ganda (Multi)',
  ESSAY: 'Essay',
}[type] || type);

const getTypeIcon = (type) => {
  switch (type) {
    case 'SINGLE_CHOICE': return <CircleDot className="w-4 h-4" />;
    case 'MULTIPLE_CHOICE': return <SquareCheck className="w-4 h-4" />;
    case 'ESSAY': return <FileText className="w-4 h-4" />;
    default: return null;
  }
};

function validateQuestion(q, idx) {
  if (!q.text || q.text.trim() === '') return `Soal ${idx + 1}: Pertanyaan tidak boleh kosong`;
  if (q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE') {
    if (!q.options || q.options.length < 2) return `Soal ${idx + 1}: Minimal 2 opsi jawaban`;
    const emptyOpts = q.options.filter(o => !o.text || !o.text.trim());
    if (emptyOpts.length > 0) return `Soal ${idx + 1}: Semua opsi harus diisi`;
    const correctCount = q.options.filter(o => o.correct).length;
    if (q.type === 'SINGLE_CHOICE' && correctCount !== 1) return `Soal ${idx + 1}: Pilih tepat 1 jawaban benar`;
    if (q.type === 'MULTIPLE_CHOICE' && correctCount < 1) return `Soal ${idx + 1}: Pilih minimal 1 jawaban benar`;
  }
  return null;
}

export default function EditBankSoalPage() {
  useAuth(['teacher']);
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Bank metadata
  const [bankName, setBankName] = useState('');
  const [description, setDescription] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [major, setMajor] = useState('');
  const [subject, setSubject] = useState('');

  // Track original bank values to know if metadata changed
  const [originalBank, setOriginalBank] = useState(null);

  // Questions list
  const [questions, setQuestions] = useState([]);
  // IDs of existing questions the teacher chose to delete. We only DELETE
  // these on save, so the operation is cancellable up until that point.
  const [pendingDeletes, setPendingDeletes] = useState(() => new Set());

  const [collapsedIds, setCollapsedIds] = useState(() => new Set());
  const [showDeleteBankDialog, setShowDeleteBankDialog] = useState(false);
  const [deletingBank, setDeletingBank] = useState(false);

  useEffect(() => {
    if (params.id) loadBank();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const loadBank = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await request.get(`/questions/bank/${params.id}`);
      const info = res.data?.bankInfo || {};
      const rawQuestions = res.data?.questions || [];

      setBankName(info.bank_name || info.subject || '');
      setDescription(info.description || '');
      setSubject(info.subject || '');
      setGradeLevel(info.grade_level || '');
      setMajor(info.major || '');
      setOriginalBank({
        bank_name: info.bank_name || info.subject || '',
        description: info.description || '',
        subject: info.subject || '',
        grade_level: info.grade_level || '',
        major: info.major || '',
      });

      // Map backend questions to local shape.
      setQuestions(rawQuestions.map((q) => ({
        _localId: uid('q'),
        question_id: q.question_id,
        _dirty: false,                  // unchanged until edited
        type: q.question_type,
        text: q.question_text || '',
        options: (q.answer_options || []).map(o => ({
          id: uid('opt'),
          option_id: o.option_id,
          text: o.option_text || '',
          correct: !!o.is_correct,
        })),
        imageFile: null,
        imagePreview: null,
        imageUrl: '',
        existingImage: q.question_image || null,
      })));
      setPendingDeletes(new Set());
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Gagal memuat bank soal');
      toast.error('Gagal memuat bank soal');
    } finally {
      setLoading(false);
    }
  };

  // --- Bank-level save logic ---

  const bankMetadataChanged = () => {
    if (!originalBank) return false;
    return (
      bankName.trim() !== originalBank.bank_name ||
      description.trim() !== (originalBank.description || '') ||
      subject !== originalBank.subject ||
      gradeLevel !== originalBank.grade_level ||
      (major || '') !== (originalBank.major || '')
    );
  };

  const handleSave = async () => {
    // Front-end validation first — never call the API for partially-filled
    // forms; the user gets a clearer message faster.
    if (!bankName.trim()) return toast.error('Judul bank soal wajib diisi');
    if (!subject) return toast.error('Mata pelajaran wajib dipilih');
    if (!gradeLevel) return toast.error('Tingkat wajib dipilih');

    // Questions excluding pending deletes
    const liveQuestions = questions.filter(q => !pendingDeletes.has(q.question_id));
    if (liveQuestions.length === 0) {
      return toast.error('Bank soal harus memiliki minimal 1 soal');
    }
    for (let i = 0; i < liveQuestions.length; i++) {
      const err = validateQuestion(liveQuestions[i], i);
      if (err) return toast.error(err);
    }

    setSaving(true);
    let updatedBank = 0;
    let updatedQuestions = 0;
    let createdQuestions = 0;
    let deletedQuestions = 0;
    const failures = [];

    try {
      // 1. Update bank metadata if changed
      if (bankMetadataChanged()) {
        try {
          await request.put(`/questions/bank/${params.id}`, {
            bank_name: bankName.trim(),
            description: description.trim() || null,
            subject,
            grade_level: gradeLevel,
            major: major || null,
          });
          updatedBank = 1;
        } catch (err) {
          failures.push(`Bank info: ${err?.response?.data?.error || err.message}`);
        }
      }

      // 2. Delete questions queued for removal
      for (const qid of pendingDeletes) {
        if (qid == null) continue;
        try {
          await request.delete(`/questions/${qid}`);
          deletedQuestions++;
        } catch (err) {
          failures.push(`Hapus soal #${qid}: ${err?.response?.data?.error || err.message}`);
        }
      }

      // 3. Persist each question. New = POST, existing & dirty = PUT.
      for (const q of liveQuestions) {
        if (q.question_id != null && !q._dirty) continue; // untouched

        // Resolve image: file upload > url > existing > null
        let questionImage = q.existingImage;
        if (q.imageFile) {
          try {
            const up = await request.postMultipart('/upload/question-image', { file: q.imageFile });
            questionImage = up.data.url || up.data.path;
          } catch (err) {
            console.warn('Image upload failed', err);
            // Fall back to existing/url if upload fails — don't block save.
          }
        } else if (q.imageUrl && q.imageUrl.trim()) {
          questionImage = q.imageUrl.trim();
        }

        const payload = {
          question_bank_id: parseInt(params.id, 10),
          question_type: q.type,
          question_text: q.text.trim(),
          subject,
          grade_level: gradeLevel,
          major: major || null,
          question_image: questionImage,
        };
        if (q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE') {
          payload.answer_options = q.options.map((o, idx) => ({
            // Preserve option_id on existing options so backend can update
            // them in place instead of recreating (which would orphan answers).
            ...(o.option_id ? { option_id: o.option_id } : {}),
            label: String.fromCharCode(65 + idx),
            option_text: o.text.trim(),
            is_correct: !!o.correct,
          }));
        }

        try {
          if (q.question_id == null) {
            await request.post('/questions', payload);
            createdQuestions++;
          } else {
            // The PUT endpoint expects the question payload without
            // question_bank_id (it's already associated).
            const { question_bank_id, ...putPayload } = payload;
            await request.put(`/questions/${q.question_id}`, putPayload);
            updatedQuestions++;
          }
        } catch (err) {
          failures.push(`Soal "${q.text.slice(0, 30)}…": ${err?.response?.data?.error || err.message}`);
        }
      }

      if (failures.length > 0) {
        // Partial success — keep user on the page and tell them what to retry.
        toast.error(`Sebagian gagal: ${failures[0]}`, { duration: 6000 });
        // Refresh from server so the page reflects the canonical state.
        await loadBank();
        return;
      }

      const parts = [];
      if (updatedBank) parts.push('detail bank');
      if (createdQuestions) parts.push(`${createdQuestions} soal baru`);
      if (updatedQuestions) parts.push(`${updatedQuestions} soal diubah`);
      if (deletedQuestions) parts.push(`${deletedQuestions} soal dihapus`);

      toast.success(
        parts.length ? `Tersimpan: ${parts.join(', ')}.` : 'Tidak ada perubahan untuk disimpan.'
      );

      // Reload to sync with server state (new question_ids, etc.)
      await loadBank();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBank = async () => {
    setDeletingBank(true);
    try {
      await request.delete(`/questions/bank/${params.id}`);
      toast.success('Bank soal berhasil dihapus');
      router.push('/teacher/question-bank');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal menghapus bank soal');
      setShowDeleteBankDialog(false);
    } finally {
      setDeletingBank(false);
    }
  };

  // --- Question management ---

  function addQuestion(type = 'SINGLE_CHOICE') {
    setQuestions(qs => [...qs, newBlankQuestion(type)]);
  }

  function removeQuestion(localId) {
    setQuestions(qs => {
      const q = qs.find(x => x._localId === localId);
      if (!q) return qs;
      // If it was persisted, queue a DELETE for save time.
      if (q.question_id != null) {
        setPendingDeletes(prev => new Set(prev).add(q.question_id));
      }
      return qs.filter(x => x._localId !== localId);
    });
  }

  function duplicateQuestion(localId) {
    setQuestions(qs => {
      const q = qs.find(x => x._localId === localId);
      if (!q) return qs;
      // Duplicate becomes a brand-new question — strip server ids and mark dirty.
      return [...qs, {
        ...q,
        _localId: uid('q'),
        question_id: null,
        _dirty: true,
        options: q.options.map(o => ({ ...o, id: uid('opt'), option_id: null })),
        imageFile: null,
        imagePreview: null,
        imageUrl: q.imageUrl || '',
        existingImage: q.existingImage,
      }];
    });
  }

  function updateQuestion(localId, patch) {
    setQuestions(qs => qs.map(q => (q._localId === localId ? { ...q, ...patch, _dirty: true } : q)));
  }

  function changeQuestionType(localId, newType) {
    setQuestions(qs => qs.map(q => {
      if (q._localId !== localId) return q;
      if (newType === 'ESSAY') return { ...q, type: newType, options: [], _dirty: true };
      if (q.options.length === 0) {
        return { ...q, type: newType, _dirty: true, options: [createOption(), createOption(), createOption(), createOption()] };
      }
      // Switching between single and multi — reset correct flags
      return { ...q, type: newType, _dirty: true, options: q.options.map(o => ({ ...o, correct: false })) };
    }));
  }

  function addOption(localId) {
    setQuestions(qs => qs.map(q => (q._localId === localId ? { ...q, _dirty: true, options: [...q.options, createOption()] } : q)));
  }

  function removeOption(localId, optId) {
    setQuestions(qs => qs.map(q => {
      if (q._localId !== localId) return q;
      if (q.options.length <= 2) { toast.error('Minimal 2 opsi'); return q; }
      return { ...q, _dirty: true, options: q.options.filter(o => o.id !== optId) };
    }));
  }

  function toggleCorrectOption(localId, optId, questionType) {
    setQuestions(qs => qs.map(q => {
      if (q._localId !== localId) return q;
      if (questionType === 'SINGLE_CHOICE') {
        return { ...q, _dirty: true, options: q.options.map(o => ({ ...o, correct: o.id === optId })) };
      }
      return { ...q, _dirty: true, options: q.options.map(o => (o.id === optId ? { ...o, correct: !o.correct } : o)) };
    }));
  }

  function handleImageSelect(localId, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      updateQuestion(localId, { imageFile: file, imagePreview: e.target.result, existingImage: null, imageUrl: '' });
    };
    reader.readAsDataURL(file);
  }

  function removeImage(localId) {
    updateQuestion(localId, { imageFile: null, imagePreview: null, imageUrl: '', existingImage: null });
  }

  function toggleCollapse(localId) {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(localId)) next.delete(localId); else next.add(localId);
      return next;
    });
  }

  // Derived state
  const liveQuestions = questions.filter(q => !pendingDeletes.has(q.question_id));
  const statuses = liveQuestions.map((q, i) => validateQuestion(q, i));
  const invalidCount = statuses.filter(Boolean).length;
  const typeCounts = liveQuestions.reduce((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Memuat bank soal...</span>
        </div>
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout>
        <div className="text-center py-20">
          <div className="text-red-600 bg-red-50 p-6 rounded-lg inline-block">
            <p className="font-semibold mb-2">Error</p>
            <p>{error}</p>
            <Button onClick={() => router.back()} className="mt-4">Kembali</Button>
          </div>
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
            <BreadcrumbLink href='/teacher/question-bank'>Bank Soal</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/teacher/question-bank/${params.id}`}>Detail</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Bank Soal</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Sticky action bar */}
      <div className="sticky top-16 z-20 -mx-6 px-6 py-3 mb-4 bg-gray-50/95 backdrop-blur border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Edit Bank Soal</h2>
          <p className="text-xs text-muted-foreground">
            Ubah detail bank, edit soal, atau tambah soal baru — semua dalam satu halaman.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:border-red-300"
            onClick={() => setShowDeleteBankDialog(true)}
            disabled={saving}
          >
            <Trash2 className="w-4 h-4 mr-1.5" /> Hapus Bank
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/teacher/question-bank/${params.id}`)}>
            <X className="w-4 h-4 mr-1.5" /> Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="bg-[#03356C] hover:bg-[#02509E] text-white"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Menyimpan...</>
            ) : (
              <><Save className="w-4 h-4 mr-1.5" /> Simpan Perubahan</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-10">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Bank Soal Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Bank Soal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs">Judul Bank Soal <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    className="h-9"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="Contoh: Bank Soal UTS Matematika Kelas X"
                  />
                </div>
                <SubjectSelect
                  id="subject"
                  required
                  value={subject}
                  onChange={setSubject}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="desc" className="text-xs">Deskripsi</Label>
                <Textarea
                  id="desc"
                  placeholder="Deskripsi bank soal (opsional)"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tingkat <span className="text-red-500">*</span></Label>
                  <Select value={gradeLevel} onValueChange={setGradeLevel}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Pilih Tingkat" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_LEVELS.map(g => (
                        <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Jurusan</Label>
                  <Select value={major || 'UMUM'} onValueChange={(v) => setMajor(v === 'UMUM' ? '' : v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Pilih Jurusan (opsional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UMUM">Semua Jurusan</SelectItem>
                      {MAJOR_OPTIONS.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Daftar Soal</h3>
              <Badge variant="secondary">{liveQuestions.length} soal</Badge>
              {pendingDeletes.size > 0 && (
                <Badge variant="outline" className="border-red-300 text-red-600 bg-red-50">
                  {pendingDeletes.size} akan dihapus
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => addQuestion('SINGLE_CHOICE')}>
                <CircleDot className="w-4 h-4 mr-1.5" /> Pilihan Ganda
              </Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion('MULTIPLE_CHOICE')}>
                <SquareCheck className="w-4 h-4 mr-1.5" /> Multi
              </Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion('ESSAY')}>
                <FileText className="w-4 h-4 mr-1.5" /> Essay
              </Button>
            </div>
          </div>

          {/* Questions (drag to reorder — visual only, sequence is server-managed) */}
          <Reorder.Group axis="y" values={questions} onReorder={setQuestions} className="space-y-4">
            {questions
              .filter(q => !pendingDeletes.has(q.question_id))
              .map((q) => {
                // Compute display index from filtered list
                const visibleIdx = liveQuestions.indexOf(q);
                return (
                  <QuestionCard
                    key={q._localId}
                    question={q}
                    index={visibleIdx}
                    error={statuses[visibleIdx]}
                    collapsed={collapsedIds.has(q._localId)}
                    onToggleCollapse={() => toggleCollapse(q._localId)}
                    onUpdate={(patch) => updateQuestion(q._localId, patch)}
                    onChangeType={(type) => changeQuestionType(q._localId, type)}
                    onDuplicate={() => duplicateQuestion(q._localId)}
                    onRemove={() => removeQuestion(q._localId)}
                    onAddOption={() => addOption(q._localId)}
                    onRemoveOption={(optId) => removeOption(q._localId, optId)}
                    onToggleCorrect={(optId) => toggleCorrectOption(q._localId, optId, q.type)}
                    onImageSelect={(file) => handleImageSelect(q._localId, file)}
                    onRemoveImage={() => removeImage(q._localId)}
                  />
                );
              })}
          </Reorder.Group>
        </div>

        {/* Right column: summary */}
        <div className="space-y-4">
          <div className="lg:sticky lg:top-32 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[#03356C]" /> Ringkasan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500 text-xs">Judul</span>
                  <span className="font-medium text-xs text-right max-w-[60%] truncate">{bankName || '—'}</span>
                </div>
                <div className="flex justify-between items-center gap-3">
                  <span className="text-gray-500 text-xs">Mapel</span>
                  {subject ? <Badge variant="secondary" className="text-[10px]">{subject}</Badge> : <span className="text-xs text-gray-400">—</span>}
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500 text-xs">Tingkat / Jurusan</span>
                  <span className="font-medium text-xs">{gradeLevel || '—'}{major ? ` — ${major}` : ''}</span>
                </div>

                <div className="border-t pt-3 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs">Total Soal</span>
                    <span className="font-semibold text-xs">{liveQuestions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs">Pilihan Ganda</span>
                    <span className="text-xs">{typeCounts.SINGLE_CHOICE || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs">Pilihan Ganda (Multi)</span>
                    <span className="text-xs">{typeCounts.MULTIPLE_CHOICE || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs">Essay</span>
                    <span className="text-xs">{typeCounts.ESSAY || 0}</span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  {invalidCount === 0 ? (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-md px-2.5 py-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-medium">Semua soal lengkap</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-md px-2.5 py-2">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">{invalidCount} soal belum lengkap</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-[#03356C] hover:bg-[#02509E] text-white"
                  size="sm"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Menyimpan...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-1.5" /> Simpan Perubahan</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete bank confirmation */}
      <AlertDialog open={showDeleteBankDialog} onOpenChange={setShowDeleteBankDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <AlertTriangle className='w-5 h-5 text-red-600' />
              Hapus Bank Soal
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bank soal <strong>{bankName}</strong> beserta seluruh {liveQuestions.length} soalnya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingBank}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBank}
              disabled={deletingBank}
              className='bg-red-600 hover:bg-red-700'
            >
              {deletingBank ? 'Menghapus...' : 'Ya, Hapus Bank'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TeacherLayout>
  );
}

// --- Question Card Component (mirrors add-question's card) ---
function QuestionCard({
  question: q,
  index,
  error,
  collapsed,
  onToggleCollapse,
  onUpdate,
  onChangeType,
  onDuplicate,
  onRemove,
  onAddOption,
  onRemoveOption,
  onToggleCorrect,
  onImageSelect,
  onRemoveImage,
}) {
  const fileInputRef = useRef(null);
  const dragControls = useDragControls();

  const isChoice = q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE';
  const inputType = q.type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox';
  const displayImage = q.imagePreview || q.existingImage;
  const isNew = q.question_id == null;

  return (
    <Reorder.Item
      as="div"
      value={q}
      dragListener={false}
      dragControls={dragControls}
    >
      <Card className="border-l-4 border-l-[#03356C]">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            {/* Number + drag */}
            <div className="flex flex-col items-center gap-1 pt-1 select-none">
              <button
                type="button"
                className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground/50 hover:text-muted-foreground"
                onPointerDown={(e) => dragControls.start(e)}
                title="Geser untuk mengurutkan"
              >
                <GripVertical className="w-4 h-4" />
              </button>
              <div className="w-7 h-7 rounded-full bg-[#03356C] text-white text-xs font-bold flex items-center justify-center">
                {index + 1}
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-3">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="gap-1.5">
                    {getTypeIcon(q.type)}
                    {getTypeLabel(q.type)}
                  </Badge>
                  {isNew && (
                    <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">Baru</Badge>
                  )}
                  {error ? (
                    <Badge variant="outline" className="gap-1 border-red-300 text-red-600 bg-red-50">
                      <AlertCircle className="w-3 h-3" /> Belum lengkap
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 border-green-300 text-green-700 bg-green-50">
                      <CheckCircle2 className="w-3 h-3" /> Lengkap
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!collapsed && (
                    <Select value={q.type} onValueChange={onChangeType}>
                      <SelectTrigger className="w-48 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SINGLE_CHOICE">Pilihan Ganda (1 Jawaban)</SelectItem>
                        <SelectItem value="MULTIPLE_CHOICE">Pilihan Ganda (Multi Jawaban)</SelectItem>
                        <SelectItem value="ESSAY">Essay</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleCollapse} title={collapsed ? 'Buka' : 'Tutup'}>
                    {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {collapsed ? (
                <p className="text-sm text-muted-foreground truncate">
                  {q.text?.trim() ? q.text : <span className="italic">Pertanyaan masih kosong</span>}
                </p>
              ) : (
                <>
                  <Textarea
                    value={q.text}
                    placeholder="Tulis pertanyaan di sini..."
                    onChange={e => onUpdate({ text: e.target.value })}
                    rows={2}
                  />

                  {/* Image */}
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) onImageSelect(e.target.files[0]);
                      }}
                    />
                    {displayImage ? (
                      <div className="relative inline-block">
                        <img
                          src={displayImage}
                          alt="Preview"
                          className="max-h-40 rounded-lg border object-contain bg-gray-50"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={onRemoveImage}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground gap-2"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <ImageIcon className="w-4 h-4" />
                          Upload Gambar
                        </Button>
                        <span className="text-xs text-muted-foreground">atau</span>
                        <Input
                          value={q.imageUrl || ''}
                          placeholder="URL gambar (Google Drive, dsb.)"
                          onChange={e => onUpdate({ imageUrl: e.target.value })}
                          className="flex-1 h-8 text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Options */}
                  {isChoice && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {q.type === 'SINGLE_CHOICE'
                          ? 'Pilih 1 jawaban yang benar:'
                          : 'Centang semua jawaban yang benar:'}
                      </p>
                      {q.options.map((opt, optIdx) => (
                        <div key={opt.id} className="flex items-center gap-3 group">
                          <input
                            type={inputType}
                            name={`answer_${q._localId}`}
                            checked={opt.correct}
                            onChange={() => onToggleCorrect(opt.id)}
                            className="w-4 h-4 accent-[#03356C]"
                          />
                          <span className="text-sm font-medium text-muted-foreground w-5">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <Input
                            value={opt.text}
                            placeholder={`Opsi ${String.fromCharCode(65 + optIdx)}`}
                            onChange={e => onUpdate({
                              options: q.options.map(o => (o.id === opt.id ? { ...o, text: e.target.value } : o))
                            })}
                            className={`flex-1 ${opt.correct ? 'border-green-400 bg-green-50/50' : ''}`}
                          />
                          {opt.correct && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onRemoveOption(opt.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" className="text-[#03356C] gap-1.5" onClick={onAddOption}>
                        <Plus className="w-4 h-4" /> Tambah Opsi
                      </Button>
                    </div>
                  )}

                  {q.type === 'ESSAY' && (
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-muted-foreground italic">
                      Siswa akan menulis jawaban dalam bentuk teks bebas.
                    </div>
                  )}

                  <div className="flex items-center gap-1 pt-2 border-t">
                    <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5" onClick={onDuplicate}>
                      <Copy className="w-4 h-4" /> Duplikat
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5" onClick={onRemove}>
                      <Trash2 className="w-4 h-4" /> Hapus
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Reorder.Item>
  );
}
