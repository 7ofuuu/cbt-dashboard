'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TeacherLayout from '../../teacherLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { ArrowLeft, Save, RefreshCw, Home, Trash2, Plus, Image as ImageIcon, X, CircleDot, SquareCheck, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import request from '@/utils/request';
import toast from 'react-hot-toast';
import { SUBJECT_OPTIONS, GRADE_LEVELS, MAJOR_OPTIONS } from '@/lib/constants';

export default function EditSoalPage() {
  useAuth(['teacher']);
  const params = useParams();
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soal, setSoal] = useState(null);
  
  // Form state
  const [teksSoal, setTeksSoal] = useState('');
  const [tipeSoal, setTipeSoal] = useState('SINGLE_CHOICE');
  const [mataPelajaran, setMataPelajaran] = useState('');
  const [grade_level, setTingkat] = useState('');
  const [major, setJurusan] = useState('');
  const [opsiJawaban, setOpsiJawaban] = useState([]);
  
  // Image state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [existingImage, setExistingImage] = useState(null); // From DB

  useEffect(() => {
    const fetchSoal = async () => {
      setLoading(true);
      try {
        const res = await request.get(`/questions/${params.id}`);
        const data = res.data?.question;
        
        if (!data) {
          toast.error('Soal tidak ditemukan');
          router.back();
          return;
        }

        setSoal(data);
        setTeksSoal(data.question_text || '');
        setTipeSoal(data.question_type || 'SINGLE_CHOICE');
        setMataPelajaran(data.subject || '');
        setTingkat(data.grade_level || '');
        setJurusan(data.major || '');
        
        // Load existing image
        if (data.question_image) {
          setExistingImage(data.question_image);
          setImageUrl(data.question_image);
        }
        
        if (data.answer_options && data.answer_options.length > 0) {
          setOpsiJawaban(data.answer_options.map(o => ({
            option_id: o.option_id,
            label: o.label,
            option_text: o.option_text,
            is_correct: o.is_correct
          })));
        }
      } catch (err) {
        toast.error('Gagal memuat soal');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSoal();
    }
  }, [params.id, router]);

  const handleAddOpsi = () => {
    const nextLabel = String.fromCharCode(65 + opsiJawaban.length);
    setOpsiJawaban([...opsiJawaban, {
      label: nextLabel,
      option_text: '',
      is_correct: false
    }]);
  };

  const handleRemoveOpsi = (index) => {
    if (opsiJawaban.length <= 2) {
      toast.error('Minimal 2 opsi jawaban');
      return;
    }
    const newOpsi = opsiJawaban.filter((_, i) => i !== index);
    setOpsiJawaban(newOpsi.map((o, i) => ({
      ...o,
      label: String.fromCharCode(65 + i)
    })));
  };

  const handleOpsiChange = (index, field, value) => {
    const newOpsi = [...opsiJawaban];
    newOpsi[index][field] = value;
    
    // If marking as correct, unmark others for single choice
    if (field === 'is_correct' && value && tipeSoal === 'SINGLE_CHOICE') {
      newOpsi.forEach((o, i) => {
        if (i !== index) o.is_correct = false;
      });
    }
    
    setOpsiJawaban(newOpsi);
  };

  const handleChangeType = (newType) => {
    setTipeSoal(newType);
    if (newType === 'ESSAY') {
      setOpsiJawaban([]);
    } else if (opsiJawaban.length === 0) {
      // Switching from essay to MC: create default options
      setOpsiJawaban([
        { label: 'A', option_text: '', is_correct: false },
        { label: 'B', option_text: '', is_correct: false },
        { label: 'C', option_text: '', is_correct: false },
        { label: 'D', option_text: '', is_correct: false },
      ]);
    } else {
      // Switching between single/multi: reset correct flags
      setOpsiJawaban(opsiJawaban.map(o => ({ ...o, is_correct: false })));
    }
  };

  // Image handling
  const handleImageSelect = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageFile(file);
      setImagePreview(e.target.result);
      setExistingImage(null);
      setImageUrl('');
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl('');
    setExistingImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!teksSoal.trim()) {
      toast.error('Teks soal tidak boleh kosong');
      return;
    }

    if (!mataPelajaran || !grade_level) {
      toast.error('Mata pelajaran dan tingkat harus diisi');
      return;
    }

    if (tipeSoal !== 'ESSAY') {
      if (opsiJawaban.length < 2) {
        toast.error('Minimal 2 opsi jawaban untuk pilihan ganda');
        return;
      }
      if (!opsiJawaban.some(o => o.is_correct)) {
        toast.error('Minimal 1 opsi harus ditandai sebagai jawaban benar');
        return;
      }
      if (tipeSoal === 'SINGLE_CHOICE' && opsiJawaban.filter(o => o.is_correct).length > 1) {
        toast.error('Pilihan tunggal hanya boleh punya 1 jawaban benar');
        return;
      }
      if (opsiJawaban.some(o => !o.option_text.trim())) {
        toast.error('Semua opsi harus diisi');
        return;
      }
    }

    setSaving(true);
    try {
      // Handle image upload
      let questionImage = existingImage; // Keep existing by default
      
      if (imageFile) {
        // Upload new file
        const formData = new FormData();
        formData.append('image', imageFile);
        try {
          const uploadRes = await request.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          questionImage = uploadRes.data.url || uploadRes.data.path;
        } catch {
          console.warn('Image upload failed, continuing without image change');
        }
      } else if (imageUrl && imageUrl.trim() && imageUrl !== existingImage) {
        // New URL provided
        questionImage = imageUrl.trim();
      } else if (!imageUrl && !imageFile && !existingImage) {
        // Image was removed
        questionImage = null;
      }

      const payload = {
        question_type: tipeSoal,
        question_text: teksSoal,
        subject: mataPelajaran,
        grade_level,
        major: major || null,
        question_image: questionImage,
      };

      if (tipeSoal !== 'ESSAY') {
        payload.answer_options = opsiJawaban.map(o => ({
          option_id: o.option_id,
          label: o.label,
          option_text: o.option_text,
          is_correct: o.is_correct
        }));
      }

      await request.put(`/questions/${params.id}`, payload);
      toast.success('Soal berhasil diupdate');
      router.back();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal mengupdate soal');
    } finally {
      setSaving(false);
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

  const getTypeLabel = (type) => {
    switch (type) {
      case 'SINGLE_CHOICE': return 'Pilihan Ganda';
      case 'MULTIPLE_CHOICE': return 'Pilihan Ganda (Multi)';
      case 'ESSAY': return 'Essay';
      default: return type;
    }
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-gray-600">Memuat...</p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  // Current image to display
  const displayImage = imagePreview || existingImage;
  const isChoice = tipeSoal === 'SINGLE_CHOICE' || tipeSoal === 'MULTIPLE_CHOICE';
  const inputType = tipeSoal === 'SINGLE_CHOICE' ? 'radio' : 'checkbox';

  return (
    <TeacherLayout>
      <div className='space-y-6'>
        {/* Breadcrumb */}
        <Breadcrumb>
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
              <BreadcrumbPage>Edit Soal #{params.id}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Button 
              variant='outline' 
              size='icon'
              onClick={() => router.back()}
            >
              <ArrowLeft className='w-4 h-4' />
            </Button>
            <div>
              <h2 className='text-2xl font-bold'>Edit Soal</h2>
              <p className='text-sm text-gray-600'>
                {mataPelajaran && `${mataPelajaran} • `}ID: {params.id}
              </p>
            </div>
          </div>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className='bg-[#03356C] hover:bg-[#02509E]'
          >
            {saving ? (
              <><Loader2 className='w-4 h-4 mr-2 animate-spin' /> Menyimpan...</>
            ) : (
              <><Save className='w-4 h-4 mr-2' /> Simpan Perubahan</>
            )}
          </Button>
        </div>

        {/* Form Card */}
        <Card className="border-l-4 border-l-[#03356C]">
          <CardContent className='pt-6 space-y-6'>
            {/* Type selector */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
              <div className='flex items-center gap-2'>
                <Badge variant="outline" className="gap-1.5 text-sm py-1">
                  {getTypeIcon(tipeSoal)}
                  {getTypeLabel(tipeSoal)}
                </Badge>
              </div>
              <Select value={tipeSoal} onValueChange={handleChangeType}>
                <SelectTrigger className="w-64 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE_CHOICE">Pilihan Ganda (1 Jawaban)</SelectItem>
                  <SelectItem value="MULTIPLE_CHOICE">Pilihan Ganda (Multi Jawaban)</SelectItem>
                  <SelectItem value="ESSAY">Essay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Teks Soal */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Teks Soal <span className="text-red-500">*</span></label>
              <Textarea
                value={teksSoal}
                onChange={(e) => setTeksSoal(e.target.value)}
                placeholder='Tulis pertanyaan di sini...'
                rows={4}
              />
            </div>

            {/* Image Upload / URL */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Gambar Soal</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleImageSelect(e.target.files[0]);
                }}
              />
              {displayImage ? (
                <div className="relative inline-block">
                  <img
                    src={displayImage}
                    alt="Preview gambar soal"
                    className="max-h-48 rounded-lg border object-contain bg-gray-50"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
                    onClick={removeImage}
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
                    value={imageUrl}
                    placeholder="URL gambar (Google Drive, dsb.)"
                    onChange={e => setImageUrl(e.target.value)}
                    className="flex-1 h-8 text-sm"
                  />
                  {imageUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setImagePreview(null);
                        setExistingImage(imageUrl);
                      }}
                      title="Preview URL"
                    >
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Metadata: Subject, Grade, Major */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Mata Pelajaran <span className="text-red-500">*</span></label>
                <Select value={mataPelajaran} onValueChange={setMataPelajaran}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECT_OPTIONS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Tingkat <span className="text-red-500">*</span></label>
                <Select value={grade_level} onValueChange={setTingkat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.map(g => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Jurusan</label>
                <Select value={major || 'UMUM'} onValueChange={(v) => setJurusan(v === 'UMUM' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih..." />
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

            {/* Opsi Jawaban (untuk PG) */}
            {isChoice && (
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium'>
                    Opsi Jawaban
                    <span className='text-xs text-muted-foreground ml-2'>
                      {tipeSoal === 'SINGLE_CHOICE'
                        ? '— Pilih 1 jawaban yang benar'
                        : '— Centang semua jawaban yang benar'}
                    </span>
                  </label>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleAddOpsi}
                  >
                    <Plus className='w-4 h-4 mr-1' /> Tambah Opsi
                  </Button>
                </div>

                <div className='space-y-2'>
                  {opsiJawaban.map((opsi, index) => (
                    <div key={index} className='flex items-center gap-3 group'>
                      <input
                        type={inputType}
                        name={`answer_edit_${params.id}`}
                        checked={opsi.is_correct}
                        onChange={(e) => handleOpsiChange(index, 'is_correct', e.target.checked)}
                        className='w-4 h-4 accent-[#03356C]'
                      />
                      <span className='text-sm font-medium text-muted-foreground w-5'>
                        {opsi.label}.
                      </span>
                      <Input
                        value={opsi.option_text}
                        onChange={(e) => handleOpsiChange(index, 'option_text', e.target.value)}
                        placeholder={`Opsi ${opsi.label}`}
                        className={`flex-1 ${opsi.is_correct ? 'border-green-400 bg-green-50/50' : ''}`}
                      />
                      {opsi.is_correct && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />}
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity'
                        onClick={() => handleRemoveOpsi(index)}
                        disabled={opsiJawaban.length <= 2}
                      >
                        <X className='w-4 h-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tipeSoal === 'ESSAY' && (
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-muted-foreground italic">
                Siswa akan menulis jawaban dalam bentuk teks bebas.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  );
}
