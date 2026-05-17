'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TeacherLayout from '../../teacherLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, FileText, Edit, Trash2, RefreshCw, AlertTriangle, Home, Save, Plus, Settings2, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import request from '@/utils/request';
import toast from 'react-hot-toast';
import { SUBJECT_OPTIONS, GRADE_LEVELS, MAJOR_OPTIONS } from '@/lib/constants';

export default function KelolaBankSoalPage() {
  useAuth(['teacher']);
  const params = useParams();
  const router = useRouter();
  
  const [soals, setSoals] = useState([]);
  const [bankInfo, setBankInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSoals, setSelectedSoals] = useState(new Set());
  
  // Delete confirmation states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [soalToDelete, setSoalToDelete] = useState(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Add soal dialog state
  const [showAddSoalDialog, setShowAddSoalDialog] = useState(false);
  const [addingSoal, setAddingSoal] = useState(false);
  const [newSoal, setNewSoal] = useState({
    question_text: '',
    question_type: 'SINGLE_CHOICE',
    answer_options: [
      { label: 'A', option_text: '', is_correct: false },
      { label: 'B', option_text: '', is_correct: false }
    ]
  });
  
  // Edit bank info dialog state
  const [showEditBankDialog, setShowEditBankDialog] = useState(false);
  const [editingBank, setEditingBank] = useState(false);
  const [editBankData, setEditBankData] = useState({
    subject: '',
    grade_level: '',
    major: ''
  });

  useEffect(() => {
    if (params.id) {
      fetchDetailBankSoal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchDetailBankSoal = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // params.id is now question_bank_id (integer)
      const bankSoalId = params.id;

      const res = await request.get(`/questions/bank/${bankSoalId}`);
      const data = res.data?.questions || [];
      const info = res.data?.bankInfo || {};
      const stats = res.data?.stats || {};
      
      setSoals(data);
      setBankInfo({
        question_bank_id: info.question_bank_id,
        subject: info.subject,
        grade_level: info.grade_level,
        major: info.major,
        jumlah_soal: stats.total_questions || data.length,
        mc_count: (stats.total_pg_single || 0) + (stats.total_pg_multiple || 0),
        essay_count: stats.total_essay || 0
      });
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Gagal mengambil data');
      toast.error('Gagal memuat detail bank soal');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedSoals.size === soals.length) {
      setSelectedSoals(new Set());
    } else {
      setSelectedSoals(new Set(soals.map(s => s.question_id)));
    }
  };

  const handleSelectSoal = (soalId) => {
    const newSelected = new Set(selectedSoals);
    if (newSelected.has(soalId)) {
      newSelected.delete(soalId);
    } else {
      newSelected.add(soalId);
    }
    setSelectedSoals(newSelected);
  };

  const handleDeleteClick = (soal) => {
    setSoalToDelete(soal);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!soalToDelete) return;
    
    setDeleting(true);
    try {
      await request.delete(`/questions/${soalToDelete.question_id}`);
      toast.success('Soal berhasil dihapus');
      setShowDeleteDialog(false);
      setSoalToDelete(null);
      setSelectedSoals(prev => {
        const newSet = new Set(prev);
        newSet.delete(soalToDelete.question_id);
        return newSet;
      });
      fetchDetailBankSoal();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal menghapus soal');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedSoals.size === 0) {
      toast.error('Pilih minimal 1 soal untuk dihapus');
      return;
    }
    setShowBulkDeleteDialog(true);
  };

  const handleConfirmBulkDelete = async () => {
    setDeleting(true);
    try {
      const deletePromises = Array.from(selectedSoals).map(soalId => 
        request.delete(`/questions/${soalId}`)
      );
      
      await Promise.all(deletePromises);
      toast.success(`${selectedSoals.size} soal berhasil dihapus`);
      setShowBulkDeleteDialog(false);
      setSelectedSoals(new Set());
      fetchDetailBankSoal();
    } catch (err) {
      toast.error('Gagal menghapus soal');
    } finally {
      setDeleting(false);
    }
  };

  // Add Soal Functions
  const handleOpenAddSoal = () => {
    setNewSoal({
      question_text: '',
      question_type: 'SINGLE_CHOICE',
      question_image: '',
      answer_options: [
        { label: 'A', option_text: '', is_correct: false },
        { label: 'B', option_text: '', is_correct: false }
      ]
    });
    setShowAddSoalDialog(true);
  };

  const handleAddOpsi = () => {
    const nextLabel = String.fromCharCode(65 + newSoal.answer_options.length);
    setNewSoal({
      ...newSoal,
      answer_options: [...newSoal.answer_options, { label: nextLabel, option_text: '', is_correct: false }]
    });
  };

  const handleRemoveOpsi = (index) => {
    const newOpsi = newSoal.answer_options.filter((_, i) => i !== index);
    setNewSoal({
      ...newSoal,
      answer_options: newOpsi.map((o, i) => ({ ...o, label: String.fromCharCode(65 + i) }))
    });
  };

  const handleOpsiChange = (index, field, value) => {
    const newOpsi = [...newSoal.answer_options];
    newOpsi[index][field] = value;
    
    if (field === 'is_correct' && value && newSoal.question_type === 'SINGLE_CHOICE') {
      newOpsi.forEach((o, i) => {
        if (i !== index) o.is_correct = false;
      });
    }
    
    setNewSoal({ ...newSoal, answer_options: newOpsi });
  };

  const handleSubmitAddSoal = async () => {
    if (!newSoal.question_text.trim()) {
      toast.error('Teks soal tidak boleh kosong');
      return;
    }

    if (newSoal.question_type !== 'ESSAY') {
      if (newSoal.answer_options.length < 2) {
        toast.error('Minimal 2 opsi jawaban');
        return;
      }
      if (!newSoal.answer_options.some(o => o.is_correct)) {
        toast.error('Minimal 1 opsi harus ditandai sebagai benar');
        return;
      }
      if (newSoal.answer_options.some(o => !o.option_text.trim())) {
        toast.error('Semua opsi harus diisi');
        return;
      }
    }

    setAddingSoal(true);
    try {
      const payload = {
        question_bank_id: bankInfo.question_bank_id,
        question_type: newSoal.question_type,
        question_text: newSoal.question_text,
        question_image: newSoal.question_image?.trim() || null,
        subject: bankInfo.subject,
        grade_level: bankInfo.grade_level,
        major: bankInfo.major || null,
      };

      if (newSoal.question_type !== 'ESSAY') {
        payload.answer_options = newSoal.answer_options;
      }

      await request.post('/questions', payload);
      toast.success('Soal berhasil ditambahkan');
      setShowAddSoalDialog(false);
      fetchDetailBankSoal();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal menambahkan soal');
    } finally {
      setAddingSoal(false);
    }
  };

  // Edit Bank Info Functions
  const handleOpenEditBank = () => {
    setEditBankData({
      subject: bankInfo.subject,
      grade_level: bankInfo.grade_level,
      major: bankInfo.major || ''
    });
    setShowEditBankDialog(true);
  };

  const handleSubmitEditBank = async () => {
    if (!editBankData.subject || !editBankData.grade_level) {
      toast.error('Mata pelajaran dan grade_level harus diisi');
      return;
    }

    setEditingBank(true);
    try {
      // Update the QuestionBank record directly via backend endpoint
      await request.put(`/questions/bank/${bankInfo.question_bank_id}`, {
        subject: editBankData.subject,
        grade_level: editBankData.grade_level,
        major: editBankData.major || null,
      });

      toast.success('Detail bank soal berhasil diupdate');
      setShowEditBankDialog(false);
      
      // Refresh current page data
      fetchDetailBankSoal();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal mengupdate detail bank');
    } finally {
      setEditingBank(false);
    }
  };

  const getBankColor = (mataPelajaran) => {
    const subject = (mataPelajaran || '').toLowerCase();
    if (subject.includes('matematika')) return 'bg-teal-700 text-white';
    if (subject.includes('fisika')) return 'bg-sky-700 text-white';
    if (subject.includes('biologi')) return 'bg-emerald-600 text-white';
    if (subject.includes('kimia')) return 'bg-fuchsia-600 text-white';
    if (subject.includes('bahasa')) return 'bg-violet-400 text-white';
    return 'bg-gray-700 text-white';
  };

  const getTipeSoalBadge = (tipe) => {
    if (tipe === 'ESSAY') {
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">Essay</Badge>;
    }
    if (tipe === 'MULTIPLE_CHOICE') {
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">PG Multiple</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">PG Single</Badge>;
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

  if (error) {
    return (
      <TeacherLayout>
        <div className="text-center py-20">
          <div className="text-red-600 bg-red-50 p-6 rounded-lg inline-block">
            <p className="font-semibold mb-2">Error</p>
            <p>{error}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Kembali
            </Button>
          </div>
        </div>
      </TeacherLayout>
    );
  }

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
              <BreadcrumbLink href={`/teacher/question-bank/${params.id}`}>Detail</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Kelola</BreadcrumbPage>
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
              <h2 className='text-2xl font-bold'>Kelola Bank Soal</h2>
              <p className='text-sm text-gray-600'>
                {bankInfo?.subject} • Tingkat {bankInfo?.grade_level}
                {bankInfo?.major && ` • ${bankInfo.major}`}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {selectedSoals.size > 0 && (
              <Button 
                onClick={handleBulkDeleteClick}
                variant="outline"
                size="sm"
                className='text-red-600 hover:bg-red-50 hover:border-red-300'
                disabled={deleting}
              >
                <Trash2 className='w-4 h-4 mr-2' /> 
                Hapus Terpilih ({selectedSoals.size})
              </Button>
            )}
            <Button 
              onClick={handleOpenEditBank}
              variant="outline"
              size="sm"
              className='text-blue-600 hover:bg-blue-50 hover:border-blue-300'
            >
              <Settings2 className='w-4 h-4 mr-2' /> 
              Edit Detail Bank
            </Button>
            <Button 
              onClick={handleOpenAddSoal}
              variant="outline"
              size="sm"
              className='bg-green-50 text-green-700 hover:bg-green-100 border-green-300'
            >
              <Plus className='w-4 h-4 mr-2' /> 
              Tambah Soal
            </Button>
            <Button 
              onClick={fetchDetailBankSoal}
              variant="outline"
              size="sm"
            >
              <RefreshCw className='w-4 h-4 mr-2' /> Segarkan
            </Button>
          </div>
        </div>

        {/* Bank Info Card */}
        {bankInfo && (
          <Card className={`p-6 ${getBankColor(bankInfo.subject)}`}>
            <div className='grid grid-cols-4 gap-6'>
              <div>
                <p className='text-sm opacity-80 mb-1'>Mata Pelajaran</p>
                <p className='text-2xl font-bold'>{bankInfo.subject}</p>
              </div>
              <div>
                <p className='text-sm opacity-80 mb-1'>Total Soal</p>
                <p className='text-2xl font-bold'>{bankInfo.jumlah_soal}</p>
              </div>
              <div>
                <p className='text-sm opacity-80 mb-1'>Pilihan Ganda</p>
                <p className='text-2xl font-bold'>{bankInfo.mc_count}</p>
              </div>
              <div>
                <p className='text-sm opacity-80 mb-1'>Essay</p>
                <p className='text-2xl font-bold'>{bankInfo.essay_count}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Actions Bar */}
        {soals.length > 0 && (
          <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg border'>
            <div className='flex items-center gap-3'>
              <Checkbox
                checked={selectedSoals.size === soals.length}
                onCheckedChange={handleSelectAll}
              />
              <span className='text-sm font-medium'>
                {selectedSoals.size === soals.length ? 'Batalkan Semua' : 'Pilih Semua'}
              </span>
            </div>
            <span className='text-sm text-gray-600'>
              {selectedSoals.size} dari {soals.length} soal dipilih
            </span>
          </div>
        )}

        {/* Soal List */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Daftar Soal ({soals.length})</h3>
          
          {soals.length === 0 ? (
            <Card className='p-12 text-center'>
              <FileText className='w-12 h-12 text-gray-300 mx-auto mb-4' />
              <p className='text-gray-500 mb-4'>Belum ada soal di bank ini</p>
              <Link href='/teacher/add-question'>
                <Button>Tambah Soal Pertama</Button>
              </Link>
            </Card>
          ) : (
            <div className='space-y-3'>
              {soals.map((soal, index) => (
                <Card 
                  key={soal.question_id} 
                  className={`p-5 transition-all ${
                    selectedSoals.has(soal.question_id) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className='flex gap-4'>
                    {/* Checkbox */}
                    <div className='flex-shrink-0 pt-1'>
                      <Checkbox
                        checked={selectedSoals.has(soal.question_id)}
                        onCheckedChange={() => handleSelectSoal(soal.question_id)}
                      />
                    </div>

                    {/* Number Badge */}
                    <div className='flex-shrink-0'>
                      <div className='w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center'>
                        {index + 1}
                      </div>
                    </div>

                    {/* Soal Content */}
                    <div className='flex-1'>
                      <div className='flex items-start justify-between mb-2'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-2'>
                            {getTipeSoalBadge(soal.question_type)}
                            <span className='text-xs text-gray-500'>ID: {soal.question_id}</span>
                          </div>
                          <p className='text-gray-800 leading-relaxed'>
                            {soal.question_text}
                          </p>
                        </div>
                        
                        {/* Actions */}
                        <div className='flex gap-2 ml-4'>
                          <Link href={`/teacher/edit-question/${soal.question_id}`}>
                            <Button
                              size='sm'
                              variant='outline'
                            >
                              <Edit className='w-4 h-4' />
                            </Button>
                          </Link>
                          <Button
                            size='sm'
                            variant='outline'
                            className='text-red-600 hover:bg-red-50 hover:border-red-300'
                            onClick={() => handleDeleteClick(soal)}
                            disabled={deleting}
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        </div>
                      </div>

                      {/* Opsi Jawaban (untuk PG) */}
                      {soal.question_type !== 'ESSAY' && soal.answer_options && soal.answer_options.length > 0 && (
                        <div className='mt-3 space-y-1.5 pl-4 border-l-2 border-gray-200'>
                          {soal.answer_options.map((opsi) => (
                            <div 
                              key={opsi.option_id} 
                              className={`flex items-start gap-2 text-sm ${
                                opsi.is_correct 
                                  ? 'text-green-700 font-medium' 
                                  : 'text-gray-600'
                              }`}
                            >
                              <span className='font-semibold min-w-[24px]'>{opsi.label}.</span>
                              <span className='flex-1'>
                                {opsi.option_text}
                                {opsi.is_correct && (
                                  <Badge className='ml-2 bg-green-100 text-green-700 text-xs'>
                                    Jawaban Benar
                                  </Badge>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Info Tambahan */}
                      <div className='mt-3 flex items-center gap-4 text-xs text-gray-500'>
                        {soal.grade_level && (
                          <span>Tingkat: {soal.grade_level}</span>
                        )}
                        {soal.major && (
                          <span>Jurusan: {soal.major}</span>
                        )}
                        {soal.createdAt && (
                          <span>
                            Dibuat: {new Date(soal.createdAt).toLocaleDateString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Delete Single Soal Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className='flex items-center gap-2'>
                <AlertTriangle className='w-5 h-5 text-red-600' />
                Konfirmasi Penghapusan Soal
              </AlertDialogTitle>
              <AlertDialogDescription className='space-y-3'>
                <p>Apakah Anda yakin ingin menghapus soal ini?</p>
                {soalToDelete && (
                  <div className='bg-gray-50 p-3 rounded-lg border'>
                    <p className='text-xs text-gray-500 mb-1'>
                      {getTipeSoalBadge(soalToDelete.question_type)}
                    </p>
                    <p className='text-sm text-gray-800 line-clamp-2'>
                      {soalToDelete.question_text}
                    </p>
                  </div>
                )}
                <p className='text-red-600 font-medium'>
                  ⚠️ Tindakan ini tidak dapat dibatalkan!
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleting}
                className='bg-red-600 hover:bg-red-700'
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus Soal'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Delete Dialog */}
        <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className='flex items-center gap-2'>
                <AlertTriangle className='w-5 h-5 text-red-600' />
                Konfirmasi Penghapusan Massal
              </AlertDialogTitle>
              <AlertDialogDescription className='space-y-3'>
                <p>Anda akan menghapus {selectedSoals.size} soal sekaligus.</p>
                <div className='bg-red-50 p-4 rounded-lg border border-red-200'>
                  <p className='font-semibold text-gray-800 mb-2'>
                    {selectedSoals.size} soal akan dihapus permanen
                  </p>
                </div>
                <p className='text-red-600 font-bold'>
                  ⚠️ PERINGATAN: Tindakan ini tidak dapat dibatalkan!
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmBulkDelete}
                disabled={deleting}
                className='bg-red-600 hover:bg-red-700'
              >
                {deleting ? 'Menghapus...' : `Ya, Hapus ${selectedSoals.size} Soal`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add Soal Dialog */}
        <Dialog open={showAddSoalDialog} onOpenChange={setShowAddSoalDialog}>
          <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Tambah Soal Baru</DialogTitle>
              <DialogDescription>
                Tambahkan soal baru ke bank: {bankInfo?.subject} - Tingkat {bankInfo?.grade_level}
              </DialogDescription>
            </DialogHeader>
            
            <div className='space-y-4'>
              {/* Tipe Soal */}
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Tipe Soal</label>
                <Select value={newSoal.question_type} onValueChange={(v) => setNewSoal({...newSoal, question_type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE_CHOICE">Pilihan Ganda (Single)</SelectItem>
                    <SelectItem value="MULTIPLE_CHOICE">Pilihan Ganda (Multiple)</SelectItem>
                    <SelectItem value="ESSAY">Essay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Teks Soal */}
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Teks Soal *</label>
                <Textarea
                  value={newSoal.question_text}
                  onChange={(e) => setNewSoal({...newSoal, question_text: e.target.value})}
                  placeholder='Masukkan pertanyaan...'
                  rows={3}
                />
              </div>

              {/* Gambar Soal */}
              <div className='space-y-2'>
                <label className='text-sm font-medium flex items-center gap-1.5'>
                  <ImageIcon className='w-4 h-4' /> Gambar Soal (opsional)
                </label>
                <Input
                  value={newSoal.question_image || ''}
                  onChange={(e) => setNewSoal({...newSoal, question_image: e.target.value})}
                  placeholder='Masukkan URL gambar (Google Drive, Imgur, dll)'
                />
                {newSoal.question_image?.trim() && (
                  <div className='mt-2 border rounded-lg p-2'>
                    <img
                      src={newSoal.question_image}
                      alt='Preview'
                      className='max-h-40 object-contain rounded'
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              {/* Opsi Jawaban (PG only) */}
              {newSoal.question_type !== 'ESSAY' && (
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <label className='text-sm font-medium'>Opsi Jawaban</label>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={handleAddOpsi}
                    >
                      <Plus className='w-4 h-4 mr-1' /> Tambah Opsi
                    </Button>
                  </div>

                  {newSoal.answer_options.map((opsi, index) => (
                    <div key={index} className='flex items-start gap-2 p-2 border rounded'>
                      <div className='flex items-center gap-2 min-w-[100px]'>
                        <input
                          type={newSoal.question_type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                          checked={opsi.is_correct}
                          onChange={(e) => handleOpsiChange(index, 'is_correct', e.target.checked)}
                          className='w-4 h-4'
                        />
                        <span className='font-medium'>{opsi.label}.</span>
                      </div>
                      <Input
                        value={opsi.option_text}
                        onChange={(e) => handleOpsiChange(index, 'option_text', e.target.value)}
                        placeholder='Isi opsi...'
                        className='flex-1'
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        onClick={() => handleRemoveOpsi(index)}
                        disabled={newSoal.answer_options.length <= 2}
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant='outline' onClick={() => setShowAddSoalDialog(false)}>
                Batal
              </Button>
              <Button onClick={handleSubmitAddSoal} disabled={addingSoal}>
                {addingSoal ? 'Menyimpan...' : 'Simpan Soal'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Bank Info Dialog */}
        <Dialog open={showEditBankDialog} onOpenChange={setShowEditBankDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Detail Bank Soal</DialogTitle>
              <DialogDescription>
                Ubah informasi bank soal. Semua soal ({soals.length}) akan diupdate.
              </DialogDescription>
            </DialogHeader>
            
            <div className='space-y-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Mata Pelajaran *</label>
                <Select 
                  value={editBankData.subject} 
                  onValueChange={(v) => setEditBankData({...editBankData, subject: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECT_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Tingkat *</label>
                <Select 
                  value={editBankData.grade_level} 
                  onValueChange={(v) => setEditBankData({...editBankData, grade_level: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Jurusan (Opsional)</label>
                <Select 
                  value={editBankData.major || 'UMUM'} 
                  onValueChange={(v) => setEditBankData({...editBankData, major: v === 'UMUM' ? '' : v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UMUM">Semua Jurusan</SelectItem>
                    {MAJOR_OPTIONS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant='outline' onClick={() => setShowEditBankDialog(false)}>
                Batal
              </Button>
              <Button onClick={handleSubmitEditBank} disabled={editingBank}>
                {editingBank ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TeacherLayout>
  );
}
