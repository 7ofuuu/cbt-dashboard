"use client";

import { useState, useRef } from "react";
import { Reorder, useDragControls } from "framer-motion";
import TeacherLayout from "../teacherLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Plus, Trash2, Copy, Image as ImageIcon, X, Home, Save, Loader2, GripVertical, CheckCircle2, CircleDot, SquareCheck, FileText, ChevronDown, ChevronUp, AlertCircle, ClipboardList } from "lucide-react";
import { useRouter } from 'next/navigation';
import request from '@/utils/request';
import toast from 'react-hot-toast';
import { GRADE_LEVELS, MAJOR_OPTIONS } from '@/lib/constants';
import { SubjectSelect } from '@/components/SubjectSelect';

function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function createOption(text = "") {
  return { id: uid("opt"), text, correct: false };
}

const getTypeLabel = (type) => {
  switch (type) {
    case 'SINGLE_CHOICE': return 'Pilihan Ganda';
    case 'MULTIPLE_CHOICE': return 'Pilihan Ganda (Multi)';
    case 'ESSAY': return 'Essay';
    default: return type;
  }
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'SINGLE_CHOICE': return <CircleDot className="w-4 h-4" />;
    case 'MULTIPLE_CHOICE': return <SquareCheck className="w-4 h-4" />;
    case 'ESSAY': return <FileText className="w-4 h-4" />;
    default: return null;
  }
};

// Returns an error string if the question is incomplete, otherwise null.
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

export default function TambahSoalPage() {
  useAuth(["teacher"]);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [major, setMajor] = useState("");
  const [subject, setSubject] = useState("");
  const [saving, setSaving] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());

  const [questions, setQuestions] = useState([
    {
      id: "q_initial",
      type: "SINGLE_CHOICE",
      text: "",
      options: [
        { id: "opt_initial_0", text: "", correct: false },
        { id: "opt_initial_1", text: "", correct: false },
        { id: "opt_initial_2", text: "", correct: false },
        { id: "opt_initial_3", text: "", correct: false },
      ],
      imageFile: null,
      imagePreview: null,
      imageUrl: "",
    },
  ]);

  // --- Save handler ---
  const handleSave = async () => {
    if (!title.trim()) return toast.error('Judul bank soal wajib diisi');
    if (!subject) return toast.error('Mata pelajaran wajib dipilih');
    if (!gradeLevel) return toast.error('Tingkat wajib dipilih');
    if (questions.length === 0) return toast.error('Tambahkan minimal 1 pertanyaan');

    for (let i = 0; i < questions.length; i++) {
      const err = validateQuestion(questions[i], i);
      if (err) return toast.error(err);
    }

    setSaving(true);
    try {
      // 1. Create question bank
      const bankRes = await request.post('/questions/bank', {
        bank_name: title.trim(),
        description: description.trim() || null,
        subject,
        grade_level: gradeLevel,
        major: major || null,
      });
      const questionBankId = bankRes.data.question_bank.question_bank_id;

      // 2. Create each question
      let created = 0;
      for (const q of questions) {
        const payload = {
          question_bank_id: questionBankId,
          question_type: q.type,
          question_text: q.text.trim(),
          subject,
          grade_level: gradeLevel,
          major: major || null,
          question_image: null,
          question_explanation: null,
        };

        if (q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE') {
          payload.answer_options = q.options.map((o, idx) => ({
            label: String.fromCharCode(65 + idx),
            option_text: o.text.trim(),
            is_correct: !!o.correct,
          }));
        }

        // Handle image upload if present
        if (q.imageFile) {
          try {
            const uploadRes = await request.postMultipart('/upload/question-image', { file: q.imageFile });
            payload.question_image = uploadRes.data.url || uploadRes.data.path;
          } catch (err) {
            // Surface the failure so the teacher knows the image was dropped
            console.warn('Image upload failed', err);
            toast.error(`Gagal mengunggah gambar untuk salah satu soal: ${err?.response?.data?.error || err?.message || ''}`);
          }
        } else if (q.imageUrl && q.imageUrl.trim()) {
          // Use URL directly (e.g., Google Drive link)
          payload.question_image = q.imageUrl.trim();
        }

        await request.post('/questions', payload);
        created++;
      }

      toast.success(`Bank soal berhasil dibuat dengan ${created} soal`);
      router.push('/teacher/question-bank');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal menyimpan bank soal');
    } finally {
      setSaving(false);
    }
  };

  // --- Question management ---
  function addQuestion(type = "SINGLE_CHOICE") {
    const opts = type === "ESSAY" ? [] : [createOption(), createOption(), createOption(), createOption()];
    setQuestions(qs => [...qs, { id: uid("q"), type, text: "", options: opts, imageFile: null, imagePreview: null, imageUrl: "" }]);
  }

  function removeQuestion(id) {
    if (questions.length <= 1) return toast.error('Minimal 1 soal diperlukan');
    setQuestions(qs => qs.filter(q => q.id !== id));
  }

  function duplicateQuestion(id) {
    setQuestions(qs => {
      const q = qs.find(x => x.id === id);
      if (!q) return qs;
      return [...qs, {
        ...q,
        id: uid("q"),
        options: q.options.map(o => ({ ...o, id: uid("opt") })),
        imageFile: null,
        imagePreview: null,
        imageUrl: q.imageUrl || "",
      }];
    });
  }

  function updateQuestion(id, patch) {
    setQuestions(qs => qs.map(q => (q.id === id ? { ...q, ...patch } : q)));
  }

  function changeQuestionType(id, newType) {
    setQuestions(qs => qs.map(q => {
      if (q.id !== id) return q;
      if (newType === 'ESSAY') return { ...q, type: newType, options: [] };
      if (q.options.length === 0) return { ...q, type: newType, options: [createOption(), createOption(), createOption(), createOption()] };
      // When switching between SINGLE and MULTIPLE, reset correct answers
      return { ...q, type: newType, options: q.options.map(o => ({ ...o, correct: false })) };
    }));
  }

  function addOption(qid) {
    setQuestions(qs => qs.map(q => (q.id === qid ? { ...q, options: [...q.options, createOption()] } : q)));
  }

  function removeOption(qid, optId) {
    setQuestions(qs => qs.map(q => {
      if (q.id !== qid) return q;
      if (q.options.length <= 2) { toast.error('Minimal 2 opsi'); return q; }
      return { ...q, options: q.options.filter(o => o.id !== optId) };
    }));
  }

  function toggleCorrectOption(qid, optId, questionType) {
    setQuestions(qs => qs.map(q => {
      if (q.id !== qid) return q;
      if (questionType === 'SINGLE_CHOICE') {
        // Radio: only one correct
        return { ...q, options: q.options.map(o => ({ ...o, correct: o.id === optId })) };
      }
      // Checkbox: toggle
      return { ...q, options: q.options.map(o => (o.id === optId ? { ...o, correct: !o.correct } : o)) };
    }));
  }

  function handleImageSelect(qid, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      updateQuestion(qid, { imageFile: file, imagePreview: e.target.result });
    };
    reader.readAsDataURL(file);
  }

  function removeImage(qid) {
    updateQuestion(qid, { imageFile: null, imagePreview: null, imageUrl: "" });
  }

  function toggleCollapse(id) {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Derived summary data
  const statuses = questions.map((q, i) => validateQuestion(q, i));
  const invalidCount = statuses.filter(Boolean).length;
  const typeCounts = questions.reduce((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {});

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
            <BreadcrumbPage>Tambah Bank Soal</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Sticky action bar */}
      <div className="sticky top-16 z-20 -mx-6 px-6 py-3 mb-4 bg-gray-50/95 backdrop-blur border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Tambah Bank Soal</h2>
          <p className="text-xs text-muted-foreground">Buat bank soal baru dan tambahkan pertanyaan</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/teacher/question-bank')}>
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
              <><Save className="w-4 h-4 mr-1.5" /> Simpan Bank Soal</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-10">
        {/* Left column: form + questions */}
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
                    value={title}
                    onChange={e => setTitle(e.target.value)}
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
                  <Select value={major} onValueChange={setMajor}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Pilih Jurusan (opsional)" />
                    </SelectTrigger>
                    <SelectContent>
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
              <Badge variant="secondary">{questions.length} soal</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => addQuestion("SINGLE_CHOICE")}>
                <CircleDot className="w-4 h-4 mr-1.5" /> Pilihan Ganda
              </Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion("MULTIPLE_CHOICE")}>
                <SquareCheck className="w-4 h-4 mr-1.5" /> Multi
              </Button>
              <Button variant="outline" size="sm" onClick={() => addQuestion("ESSAY")}>
                <FileText className="w-4 h-4 mr-1.5" /> Essay
              </Button>
            </div>
          </div>

          {/* Questions (drag to reorder) */}
          <Reorder.Group axis="y" values={questions} onReorder={setQuestions} className="space-y-4">
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx}
                error={statuses[idx]}
                collapsed={collapsedIds.has(q.id)}
                onToggleCollapse={() => toggleCollapse(q.id)}
                onUpdate={(patch) => updateQuestion(q.id, patch)}
                onChangeType={(type) => changeQuestionType(q.id, type)}
                onDuplicate={() => duplicateQuestion(q.id)}
                onRemove={() => removeQuestion(q.id)}
                onAddOption={() => addOption(q.id)}
                onRemoveOption={(optId) => removeOption(q.id, optId)}
                onToggleCorrect={(optId) => toggleCorrectOption(q.id, optId, q.type)}
                onImageSelect={(file) => handleImageSelect(q.id, file)}
                onRemoveImage={() => removeImage(q.id)}
              />
            ))}
          </Reorder.Group>
        </div>

        {/* Right column: sticky summary */}
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
                  <span className="font-medium text-xs text-right max-w-[60%] truncate">{title || '—'}</span>
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
                    <span className="font-semibold text-xs">{questions.length}</span>
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
                    <><Save className="w-4 h-4 mr-1.5" /> Simpan Bank Soal</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}

// --- Question Card Component ---
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
            {/* Number indicator + drag handle */}
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

            {/* Question body */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Header: type badge, status, collapse */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="gap-1.5">
                    {getTypeIcon(q.type)}
                    {getTypeLabel(q.type)}
                  </Badge>
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
                  {/* Question text */}
                  <Textarea
                    value={q.text}
                    placeholder="Tulis pertanyaan di sini..."
                    onChange={e => onUpdate({ text: e.target.value })}
                    rows={2}
                  />

                  {/* Image upload or URL */}
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
                    {q.imagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={q.imagePreview}
                          alt="Preview"
                          className="max-h-40 rounded-lg border object-contain"
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
                        {q.imageUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onUpdate({ imageUrl: '', imagePreview: q.imageUrl })}
                            title="Preview URL"
                          >
                            <ImageIcon className="w-4 h-4 text-blue-600" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Options for choice questions */}
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
                            name={`answer_${q.id}`}
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

                  {/* Bottom actions */}
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
