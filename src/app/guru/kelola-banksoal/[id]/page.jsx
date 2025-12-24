'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import GuruLayout from '../../guruLayout';
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
import { ArrowLeft, FileText, Edit, Trash2, RefreshCw, AlertTriangle, Home, Save, Plus, Settings2 } from 'lucide-react';
import Link from 'next/link';
import request from '@/utils/request';
import toast from 'react-hot-toast';

export default function KelolaBankSoalPage() {
  useAuth(['guru']);
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
    teks_soal: '',
    tipe_soal: 'PILIHAN_GANDA_SINGLE',
    opsi_jawaban: [
      { label: 'A', teks_opsi: '', is_benar: false },
      { label: 'B', teks_opsi: '', is_benar: false }
    ]
  });
  
  // Edit bank info dialog state
  const [showEditBankDialog, setShowEditBankDialog] = useState(false);
  const [editingBank, setEditingBank] = useState(false);
  const [editBankData, setEditBankData] = useState({
    mata_pelajaran: '',
    tingkat: '',
    jurusan: ''
  });

  useEffect(() => {
    if (params.id) {
      fetchDetailBankSoal();
    }
  }, [params.id]);

  const fetchDetailBankSoal = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const bankId = decodeURIComponent(params.id);
      const [mata_pelajaran, tingkat, jurusan] = bankId.split('-');
      
      const filters = {
        mata_pelajaran,
        tingkat,
      };
      if (jurusan && jurusan !== 'umum') {
        filters.jurusan = jurusan;
      }

      const res = await request.get('/soal', { params: filters });
      const data = res.data?.soals || [];
      
      setSoals(data);
      setBankInfo({
        mata_pelajaran,
        tingkat,
        jurusan: jurusan === 'umum' ? null : jurusan,
        jumlah_soal: data.length,
        jumlah_pg: data.filter(s => s.tipe_soal !== 'ESSAY').length,
        jumlah_essay: data.filter(s => s.tipe_soal === 'ESSAY').length
      });
    } catch (err) {
      console.error(err);
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
      setSelectedSoals(new Set(soals.map(s => s.soal_id)));
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
      await request.delete(`/soal/${soalToDelete.soal_id}`);
      toast.success('Soal berhasil dihapus');
      setShowDeleteDialog(false);
      setSoalToDelete(null);
      setSelectedSoals(prev => {
        const newSet = new Set(prev);
        newSet.delete(soalToDelete.soal_id);
        return newSet;
      });
      fetchDetailBankSoal();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal menghapus soal');
      console.error(err);
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
        request.delete(`/soal/${soalId}`)
      );
      
      await Promise.all(deletePromises);
      toast.success(`${selectedSoals.size} soal berhasil dihapus`);
      setShowBulkDeleteDialog(false);
      setSelectedSoals(new Set());
      fetchDetailBankSoal();
    } catch (err) {
      toast.error('Gagal menghapus soal');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  // Add Soal Functions
  const handleOpenAddSoal = () => {
    setNewSoal({
      teks_soal: '',
      tipe_soal: 'PILIHAN_GANDA_SINGLE',
      opsi_jawaban: [
        { label: 'A', teks_opsi: '', is_benar: false },
        { label: 'B', teks_opsi: '', is_benar: false }
      ]
    });
    setShowAddSoalDialog(true);
  };

  const handleAddOpsi = () => {
    const nextLabel = String.fromCharCode(65 + newSoal.opsi_jawaban.length);
    setNewSoal({
      ...newSoal,
      opsi_jawaban: [...newSoal.opsi_jawaban, { label: nextLabel, teks_opsi: '', is_benar: false }]
    });
  };

  const handleRemoveOpsi = (index) => {
    const newOpsi = newSoal.opsi_jawaban.filter((_, i) => i !== index);
    setNewSoal({
      ...newSoal,
      opsi_jawaban: newOpsi.map((o, i) => ({ ...o, label: String.fromCharCode(65 + i) }))
    });
  };

  const handleOpsiChange = (index, field, value) => {
    const newOpsi = [...newSoal.opsi_jawaban];
    newOpsi[index][field] = value;
    
    if (field === 'is_benar' && value && newSoal.tipe_soal === 'PILIHAN_GANDA_SINGLE') {
      newOpsi.forEach((o, i) => {
        if (i !== index) o.is_benar = false;
      });
    }
    
    setNewSoal({ ...newSoal, opsi_jawaban: newOpsi });
  };

  const handleSubmitAddSoal = async () => {
    if (!newSoal.teks_soal.trim()) {
      toast.error('Teks soal tidak boleh kosong');
      return;
    }

    if (newSoal.tipe_soal !== 'ESSAY') {
      if (newSoal.opsi_jawaban.length < 2) {
        toast.error('Minimal 2 opsi jawaban');
        return;
      }
      if (!newSoal.opsi_jawaban.some(o => o.is_benar)) {
        toast.error('Minimal 1 opsi harus ditandai sebagai benar');
        return;
      }
      if (newSoal.opsi_jawaban.some(o => !o.teks_opsi.trim())) {
        toast.error('Semua opsi harus diisi');
        return;
      }
    }

    setAddingSoal(true);
    try {
      const payload = {
        tipe_soal: newSoal.tipe_soal,
        teks_soal: newSoal.teks_soal,
        mata_pelajaran: bankInfo.mata_pelajaran,
        tingkat: bankInfo.tingkat,
        jurusan: bankInfo.jurusan || null,
      };

      if (newSoal.tipe_soal !== 'ESSAY') {
        payload.opsi_jawaban = newSoal.opsi_jawaban;
      }

      await request.post('/soal', payload);
      toast.success('Soal berhasil ditambahkan');
      setShowAddSoalDialog(false);
      fetchDetailBankSoal();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal menambahkan soal');
      console.error(err);
    } finally {
      setAddingSoal(false);
    }
  };

  // Edit Bank Info Functions
  const handleOpenEditBank = () => {
    setEditBankData({
      mata_pelajaran: bankInfo.mata_pelajaran,
      tingkat: bankInfo.tingkat,
      jurusan: bankInfo.jurusan || ''
    });
    setShowEditBankDialog(true);
  };

  const handleSubmitEditBank = async () => {
    if (!editBankData.mata_pelajaran || !editBankData.tingkat) {
      toast.error('Mata pelajaran dan tingkat harus diisi');
      return;
    }

    setEditingBank(true);
    try {
      // Update all soals in this bank
      const updatePromises = soals.map(soal => 
        request.put(`/soal/${soal.soal_id}`, {
          tipe_soal: soal.tipe_soal,
          teks_soal: soal.teks_soal,
          mata_pelajaran: editBankData.mata_pelajaran,
          tingkat: editBankData.tingkat,
          jurusan: editBankData.jurusan || null,
        })
      );

      await Promise.all(updatePromises);
      toast.success('Detail bank soal berhasil diupdate');
      setShowEditBankDialog(false);
      
      // Redirect to new bank ID
      const newBankId = `${editBankData.mata_pelajaran}-${editBankData.tingkat}-${editBankData.jurusan || 'umum'}`;
      router.replace(`/guru/kelola-banksoal/${encodeURIComponent(newBankId)}`);
      fetchDetailBankSoal();
    } catch (err) {
      toast.error('Gagal mengupdate detail bank');
      console.error(err);
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
    if (tipe === 'PILIHAN_GANDA_MULTIPLE') {
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">PG Multiple</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">PG Single</Badge>;
  };

  if (loading) {
    return (
      <GuruLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-gray-600">Memuat...</p>
          </div>
        </div>
      </GuruLayout>
    );
  }

  if (error) {
    return (
      <GuruLayout>
        <div className="text-center py-20">
          <div className="text-red-600 bg-red-50 p-6 rounded-lg inline-block">
            <p className="font-semibold mb-2">Error</p>
            <p>{error}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Kembali
            </Button>
          </div>
        </div>
      </GuruLayout>
    );
  }

  return (
    <GuruLayout>
      <div className='space-y-6'>
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href='/guru/dashboard'>
                <Home className='w-4 h-4' />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href='/guru/banksoal'>Bank Soal</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/guru/banksoal/${params.id}`}>Detail</BreadcrumbLink>
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
                {bankInfo?.mata_pelajaran} • Tingkat {bankInfo?.tingkat}
                {bankInfo?.jurusan && ` • ${bankInfo.jurusan}`}
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
          <Card className={`p-6 ${getBankColor(bankInfo.mata_pelajaran)}`}>
            <div className='grid grid-cols-4 gap-6'>
              <div>
                <p className='text-sm opacity-80 mb-1'>Mata Pelajaran</p>
                <p className='text-2xl font-bold'>{bankInfo.mata_pelajaran}</p>
              </div>
              <div>
                <p className='text-sm opacity-80 mb-1'>Total Soal</p>
                <p className='text-2xl font-bold'>{bankInfo.jumlah_soal}</p>
              </div>
              <div>
                <p className='text-sm opacity-80 mb-1'>Pilihan Ganda</p>
                <p className='text-2xl font-bold'>{bankInfo.jumlah_pg}</p>
              </div>
              <div>
                <p className='text-sm opacity-80 mb-1'>Essay</p>
                <p className='text-2xl font-bold'>{bankInfo.jumlah_essay}</p>
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
              <Link href='/guru/tambah-soal'>
                <Button>Tambah Soal Pertama</Button>
              </Link>
            </Card>
          ) : (
            <div className='space-y-3'>
              {soals.map((soal, index) => (
                <Card 
                  key={soal.soal_id} 
                  className={`p-5 transition-all ${
                    selectedSoals.has(soal.soal_id) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className='flex gap-4'>
                    {/* Checkbox */}
                    <div className='flex-shrink-0 pt-1'>
                      <Checkbox
                        checked={selectedSoals.has(soal.soal_id)}
                        onCheckedChange={() => handleSelectSoal(soal.soal_id)}
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
                            {getTipeSoalBadge(soal.tipe_soal)}
                            <span className='text-xs text-gray-500'>ID: {soal.soal_id}</span>
                          </div>
                          <p className='text-gray-800 leading-relaxed'>
                            {soal.teks_soal}
                          </p>
                        </div>
                        
                        {/* Actions */}
                        <div className='flex gap-2 ml-4'>
                          <Link href={`/guru/edit-soal/${soal.soal_id}`}>
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
                      {soal.tipe_soal !== 'ESSAY' && soal.opsiJawabans && soal.opsiJawabans.length > 0 && (
                        <div className='mt-3 space-y-1.5 pl-4 border-l-2 border-gray-200'>
                          {soal.opsiJawabans.map((opsi) => (
                            <div 
                              key={opsi.opsi_id} 
                              className={`flex items-start gap-2 text-sm ${
                                opsi.is_benar 
                                  ? 'text-green-700 font-medium' 
                                  : 'text-gray-600'
                              }`}
                            >
                              <span className='font-semibold min-w-[24px]'>{opsi.label}.</span>
                              <span className='flex-1'>
                                {opsi.teks_opsi}
                                {opsi.is_benar && (
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
                        {soal.tingkat && (
                          <span>Tingkat: {soal.tingkat}</span>
                        )}
                        {soal.jurusan && (
                          <span>Jurusan: {soal.jurusan}</span>
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
                      {getTipeSoalBadge(soalToDelete.tipe_soal)}
                    </p>
                    <p className='text-sm text-gray-800 line-clamp-2'>
                      {soalToDelete.teks_soal}
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
                Tambahkan soal baru ke bank: {bankInfo?.mata_pelajaran} - Tingkat {bankInfo?.tingkat}
              </DialogDescription>
            </DialogHeader>
            
            <div className='space-y-4'>
              {/* Tipe Soal */}
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Tipe Soal</label>
                <Select value={newSoal.tipe_soal} onValueChange={(v) => setNewSoal({...newSoal, tipe_soal: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PILIHAN_GANDA_SINGLE">Pilihan Ganda (Single)</SelectItem>
                    <SelectItem value="PILIHAN_GANDA_MULTIPLE">Pilihan Ganda (Multiple)</SelectItem>
                    <SelectItem value="ESSAY">Essay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Teks Soal */}
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Teks Soal *</label>
                <Textarea
                  value={newSoal.teks_soal}
                  onChange={(e) => setNewSoal({...newSoal, teks_soal: e.target.value})}
                  placeholder='Masukkan pertanyaan...'
                  rows={3}
                />
              </div>

              {/* Opsi Jawaban (PG only) */}
              {newSoal.tipe_soal !== 'ESSAY' && (
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

                  {newSoal.opsi_jawaban.map((opsi, index) => (
                    <div key={index} className='flex items-start gap-2 p-2 border rounded'>
                      <div className='flex items-center gap-2 min-w-[100px]'>
                        <input
                          type={newSoal.tipe_soal === 'PILIHAN_GANDA_SINGLE' ? 'radio' : 'checkbox'}
                          checked={opsi.is_benar}
                          onChange={(e) => handleOpsiChange(index, 'is_benar', e.target.checked)}
                          className='w-4 h-4'
                        />
                        <span className='font-medium'>{opsi.label}.</span>
                      </div>
                      <Input
                        value={opsi.teks_opsi}
                        onChange={(e) => handleOpsiChange(index, 'teks_opsi', e.target.value)}
                        placeholder='Isi opsi...'
                        className='flex-1'
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        onClick={() => handleRemoveOpsi(index)}
                        disabled={newSoal.opsi_jawaban.length <= 2}
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
                  value={editBankData.mata_pelajaran} 
                  onValueChange={(v) => setEditBankData({...editBankData, mata_pelajaran: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Matematika">Matematika</SelectItem>
                    <SelectItem value="Fisika">Fisika</SelectItem>
                    <SelectItem value="Kimia">Kimia</SelectItem>
                    <SelectItem value="Biologi">Biologi</SelectItem>
                    <SelectItem value="Bahasa Indonesia">Bahasa Indonesia</SelectItem>
                    <SelectItem value="Bahasa Inggris">Bahasa Inggris</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Tingkat *</label>
                <Select 
                  value={editBankData.tingkat} 
                  onValueChange={(v) => setEditBankData({...editBankData, tingkat: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="X">X</SelectItem>
                    <SelectItem value="XI">XI</SelectItem>
                    <SelectItem value="XII">XII</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Jurusan (Opsional)</label>
                <Select 
                  value={editBankData.jurusan || 'UMUM'} 
                  onValueChange={(v) => setEditBankData({...editBankData, jurusan: v === 'UMUM' ? '' : v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UMUM">Semua Jurusan</SelectItem>
                    <SelectItem value="IPA">IPA</SelectItem>
                    <SelectItem value="IPS">IPS</SelectItem>
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
    </GuruLayout>
  );
}
