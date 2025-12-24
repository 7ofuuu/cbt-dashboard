'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import GuruLayout from '../../guruLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { ArrowLeft, Save, RefreshCw, Home, Trash2 } from 'lucide-react';
import Link from 'next/link';
import request from '@/utils/request';
import toast from 'react-hot-toast';

export default function EditSoalPage() {
  useAuth(['guru']);
  const params = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soal, setSoal] = useState(null);
  
  // Form state
  const [teksSoal, setTeksSoal] = useState('');
  const [tipeSoal, setTipeSoal] = useState('PILIHAN_GANDA_SINGLE');
  const [mataPelajaran, setMataPelajaran] = useState('');
  const [tingkat, setTingkat] = useState('');
  const [jurusan, setJurusan] = useState('');
  const [opsiJawaban, setOpsiJawaban] = useState([]);

  useEffect(() => {
    if (params.id) {
      fetchSoal();
    }
  }, [params.id]);

  const fetchSoal = async () => {
    setLoading(true);
    try {
      const res = await request.get(`/soal/${params.id}`);
      const data = res.data?.soal;
      
      if (!data) {
        toast.error('Soal tidak ditemukan');
        router.back();
        return;
      }

      setSoal(data);
      setTeksSoal(data.teks_soal || '');
      setTipeSoal(data.tipe_soal || 'PILIHAN_GANDA_SINGLE');
      setMataPelajaran(data.mata_pelajaran || '');
      setTingkat(data.tingkat || '');
      setJurusan(data.jurusan || '');
      
      if (data.opsiJawabans && data.opsiJawabans.length > 0) {
        setOpsiJawaban(data.opsiJawabans.map(o => ({
          opsi_id: o.opsi_id,
          label: o.label,
          teks_opsi: o.teks_opsi,
          is_benar: o.is_benar
        })));
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat soal');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAddOpsi = () => {
    const nextLabel = String.fromCharCode(65 + opsiJawaban.length);
    setOpsiJawaban([...opsiJawaban, {
      label: nextLabel,
      teks_opsi: '',
      is_benar: false
    }]);
  };

  const handleRemoveOpsi = (index) => {
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
    if (field === 'is_benar' && value && tipeSoal === 'PILIHAN_GANDA_SINGLE') {
      newOpsi.forEach((o, i) => {
        if (i !== index) o.is_benar = false;
      });
    }
    
    setOpsiJawaban(newOpsi);
  };

  const handleSave = async () => {
    if (!teksSoal.trim()) {
      toast.error('Teks soal tidak boleh kosong');
      return;
    }

    if (!mataPelajaran || !tingkat) {
      toast.error('Mata pelajaran dan tingkat harus diisi');
      return;
    }

    if (tipeSoal !== 'ESSAY') {
      if (opsiJawaban.length < 2) {
        toast.error('Minimal 2 opsi jawaban untuk pilihan ganda');
        return;
      }
      if (!opsiJawaban.some(o => o.is_benar)) {
        toast.error('Minimal 1 opsi harus ditandai sebagai jawaban benar');
        return;
      }
      if (opsiJawaban.some(o => !o.teks_opsi.trim())) {
        toast.error('Semua opsi harus diisi');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        tipe_soal: tipeSoal,
        teks_soal: teksSoal,
        mata_pelajaran: mataPelajaran,
        tingkat,
        jurusan: jurusan || null,
      };

      if (tipeSoal !== 'ESSAY') {
        payload.opsi_jawaban = opsiJawaban.map(o => ({
          opsi_id: o.opsi_id,
          label: o.label,
          teks_opsi: o.teks_opsi,
          is_benar: o.is_benar
        }));
      }

      await request.put(`/soal/${params.id}`, payload);
      toast.success('Soal berhasil diupdate');
      router.back();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Gagal mengupdate soal');
    } finally {
      setSaving(false);
    }
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
              <BreadcrumbPage>Edit Soal</BreadcrumbPage>
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
              <p className='text-sm text-gray-600'>ID: {params.id}</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className='bg-[#03356C] hover:bg-[#02509E]'
            >
              <Save className='w-4 h-4 mr-2' />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Soal</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Tipe Soal */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Tipe Soal</label>
              <Select value={tipeSoal} onValueChange={setTipeSoal}>
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
                value={teksSoal}
                onChange={(e) => setTeksSoal(e.target.value)}
                placeholder='Masukkan pertanyaan soal...'
                rows={4}
              />
            </div>

            {/* Mata Pelajaran, Tingkat, Jurusan */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Mata Pelajaran *</label>
                <Select value={mataPelajaran} onValueChange={setMataPelajaran}>
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
                <Select value={tingkat} onValueChange={setTingkat}>
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
                <Select value={jurusan || 'UMUM'} onValueChange={(v) => setJurusan(v === 'UMUM' ? '' : v)}>
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

            {/* Opsi Jawaban (untuk PG) */}
            {tipeSoal !== 'ESSAY' && (
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium'>Opsi Jawaban</label>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={handleAddOpsi}
                  >
                    Tambah Opsi
                  </Button>
                </div>

                <div className='space-y-3'>
                  {opsiJawaban.map((opsi, index) => (
                    <div key={index} className='flex items-start gap-3 p-3 border rounded-lg'>
                      <div className='flex items-center gap-2 min-w-[120px]'>
                        <input
                          type={tipeSoal === 'PILIHAN_GANDA_SINGLE' ? 'radio' : 'checkbox'}
                          checked={opsi.is_benar}
                          onChange={(e) => handleOpsiChange(index, 'is_benar', e.target.checked)}
                          className='w-4 h-4'
                        />
                        <span className='font-medium'>{opsi.label}.</span>
                      </div>
                      <Input
                        value={opsi.teks_opsi}
                        onChange={(e) => handleOpsiChange(index, 'teks_opsi', e.target.value)}
                        placeholder='Isi opsi jawaban...'
                        className='flex-1'
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        onClick={() => handleRemoveOpsi(index)}
                        className='text-red-600 hover:bg-red-50'
                        disabled={opsiJawaban.length <= 2}
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  ))}
                </div>

                <p className='text-xs text-gray-500'>
                  {tipeSoal === 'PILIHAN_GANDA_SINGLE' 
                    ? 'Pilih satu opsi sebagai jawaban benar' 
                    : 'Pilih satu atau lebih opsi sebagai jawaban benar'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </GuruLayout>
  );
}
