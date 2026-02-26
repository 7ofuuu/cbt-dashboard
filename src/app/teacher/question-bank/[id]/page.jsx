'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TeacherLayout from '../../teacherLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ArrowLeft, FileText, Edit, Trash2, RefreshCw, AlertTriangle, Home, Settings } from 'lucide-react';
import Link from 'next/link';
import request from '@/utils/request';
import toast from 'react-hot-toast';

export default function DetailBankSoalPage() {
  useAuth(['teacher']);
  const params = useParams();
  const router = useRouter();
  
  const [soals, setSoals] = useState([]);
  const [bankInfo, setBankInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Delete confirmation states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [soalToDelete, setSoalToDelete] = useState(null);
  const [deletingBank, setDeletingBank] = useState(false);
  const [showDeleteBankDialog, setShowDeleteBankDialog] = useState(false);

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
      
      // GET /questions/bank/:bankSoalId
      const res = await request.get(`/questions/bank/${bankSoalId}`);
      
      const data = res.data?.questions || [];
      const stats = res.data?.stats || {};
      const info = res.data?.bankInfo || {};
      
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

  const handleDeleteClick = (soal) => {
    setSoalToDelete(soal);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!soalToDelete) return;
    
    try {
      await request.delete(`/questions/${soalToDelete.question_id}`);
      toast.success('Soal berhasil dihapus');
      setShowDeleteDialog(false);
      setSoalToDelete(null);
      fetchDetailBankSoal(); // Refresh
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal menghapus soal');
    }
  };

  const handleDeleteBankClick = () => {
    setShowDeleteBankDialog(true);
  };

  const handleConfirmDeleteBank = async () => {
    if (!bankInfo) return;
    
    setDeletingBank(true);
    try {
      // Use backend endpoint that cascade-deletes bank + all questions atomically
      await request.delete(`/questions/bank/${bankInfo.question_bank_id}`);
      toast.success(`Bank soal "${bankInfo.subject}" berhasil dihapus`);
      router.push('/teacher/question-bank');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal menghapus bank soal');
    } finally {
      setDeletingBank(false);
      setShowDeleteBankDialog(false);
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
            <p className="text-gray-600">Memuat detail bank soal...</p>
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
              <BreadcrumbPage>Detail</BreadcrumbPage>
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
              <h2 className='text-2xl font-bold'>Detail Bank Soal</h2>
              <p className='text-sm text-gray-600'>
                {bankInfo?.subject} • Tingkat {bankInfo?.grade_level}
                {bankInfo?.major && ` • ${bankInfo.major}`}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Button 
              onClick={() => router.push(`/teacher/manage-question-bank/${params.id}`)}
              variant="outline"
              size="sm"
              className='text-blue-600 hover:bg-blue-50 hover:border-blue-300'
              disabled={soals.length === 0}
            >
              <Settings className='w-4 h-4 mr-2' /> Kelola Bank
            </Button>
            <Button 
              onClick={handleDeleteBankClick}
              variant="outline"
              size="sm"
              className='text-red-600 hover:bg-red-50 hover:border-red-300'
              disabled={deletingBank || soals.length === 0}
            >
              <Trash2 className='w-4 h-4 mr-2' /> Hapus Bank
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
                <Card key={soal.question_id} className='p-5 hover:shadow-md transition-shadow'>
                  <div className='flex gap-4'>
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

        {/* Delete Soal Confirmation Dialog */}
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
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className='bg-red-600 hover:bg-red-700'
              >
                Ya, Hapus Soal
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Bank Confirmation Dialog */}
        <AlertDialog open={showDeleteBankDialog} onOpenChange={setShowDeleteBankDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className='flex items-center gap-2'>
                <AlertTriangle className='w-5 h-5 text-red-600' />
                Konfirmasi Penghapusan Bank Soal
              </AlertDialogTitle>
              <AlertDialogDescription className='space-y-3'>
                <p>Anda akan menghapus seluruh bank soal ini:</p>
                {bankInfo && (
                  <div className='bg-red-50 p-4 rounded-lg border border-red-200'>
                    <p className='font-semibold text-gray-800 mb-2'>
                      {bankInfo.subject} - Tingkat {bankInfo.grade_level}
                      {bankInfo.major && ` (${bankInfo.major})`}
                    </p>
                    <div className='text-sm text-gray-700'>
                      <p>• Total {bankInfo.jumlah_soal} soal akan dihapus</p>
                      <p>• {bankInfo.mc_count} Pilihan Ganda</p>
                      <p>• {bankInfo.essay_count} Essay</p>
                    </div>
                  </div>
                )}
                <p className='text-red-600 font-bold'>
                  ⚠️ PERINGATAN: Semua soal dalam bank ini akan dihapus permanen!
                </p>
                <p className='text-sm text-gray-600'>
                  Tindakan ini tidak dapat dibatalkan. Pastikan Anda benar-benar yakin.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteBank}
                disabled={deletingBank}
                className='bg-red-600 hover:bg-red-700'
              >
                {deletingBank ? 'Menghapus...' : 'Ya, Hapus Semua'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TeacherLayout>
  );
}
