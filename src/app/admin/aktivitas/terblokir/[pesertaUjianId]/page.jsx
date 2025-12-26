'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AdminLayout from '../../../adminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Home, AlertTriangle, Shield, Key } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import request from '@/utils/request';
import toast from 'react-hot-toast';
import { use } from 'react';

export default function TerblokirPage({ params }) {
  useAuth(['admin']);
  
  const router = useRouter();
  const { pesertaUjianId } = use(params);
  
  const [pesertaData, setPesertaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [blockReason, setBlockReason] = useState('');
  const [unlockCode, setUnlockCode] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);

  useEffect(() => {
    if (pesertaUjianId) {
      fetchParticipantDetail();
    }
  }, [pesertaUjianId]);

  const fetchParticipantDetail = async () => {
    try {
      setLoading(true);
      const response = await request.get(`/admin/activities/participant/${pesertaUjianId}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setPesertaData(data);
        setBlockReason(data.block_reason || '');
        setUnlockCode(data.unlock_code || '');
      }
    } catch (error) {
      console.error('Error fetching participant detail:', error);
      toast.error('Gagal mengambil data peserta');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!blockReason.trim()) {
      toast.error('Keterangan pelanggaran harus diisi');
      return;
    }

    try {
      setIsBlocking(true);
      const response = await request.post(`/admin/activities/${pesertaUjianId}/block`, {
        block_reason: blockReason
      });

      if (response.data.success) {
        toast.success('Peserta berhasil diblokir');
        fetchParticipantDetail();
      }
    } catch (error) {
      console.error('Error blocking participant:', error);
      toast.error(error.response?.data?.message || 'Gagal memblokir peserta');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      setIsGenerating(true);
      const response = await request.post(`/admin/activities/${pesertaUjianId}/generate-unlock`);

      if (response.data.success) {
        toast.success('Kode unlock berhasil di-generate');
        setUnlockCode(response.data.data.unlock_code);
        fetchParticipantDetail();
      }
    } catch (error) {
      console.error('Error generating unlock code:', error);
      toast.error(error.response?.data?.message || 'Gagal generate kode unlock');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUnblock = async () => {
    if (!unlockCode.trim()) {
      toast.error('Kode unlock harus diisi');
      return;
    }

    try {
      setIsUnblocking(true);
      const response = await request.post(`/admin/activities/${pesertaUjianId}/unblock`, {
        unlock_code: unlockCode
      });

      if (response.data.success) {
        toast.success('Peserta berhasil di-unblock');
        router.back();
      }
    } catch (error) {
      console.error('Error unblocking participant:', error);
      toast.error(error.response?.data?.message || 'Gagal unblock peserta');
    } finally {
      setIsUnblocking(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">Memuat data...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!pesertaData) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-lg text-gray-500">Data tidak ditemukan</p>
          <Button 
            onClick={() => router.back()} 
            className="mt-4"
          >
            Kembali
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/admin/dashboard'>
              <Home className='w-4 h-4' />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href='/admin/aktivitas'>Aktivitas</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => router.back()}>Detail</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Terblokir</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Manajemen Peserta Terblokir
          </h2>
          <Badge variant={pesertaData.is_blocked ? "destructive" : "default"} className="text-sm">
            {pesertaData.is_blocked ? (
              <>
                <Shield className="w-4 h-4 mr-1" />
                Terblokir
              </>
            ) : (
              'Aktif'
            )}
          </Badge>
        </div>

        {/* Student Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Peserta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nama</p>
                <p className="font-semibold text-gray-900">{pesertaData.nama}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kelas</p>
                <p className="font-semibold text-gray-900">{pesertaData.tingkat} {pesertaData.kelas}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Jurusan</p>
                <p className="font-semibold text-gray-900">{pesertaData.jurusan}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ujian</p>
                <p className="font-semibold text-gray-900">{pesertaData.nama_ujian}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mata Pelajaran</p>
                <p className="font-semibold text-gray-900">{pesertaData.mata_pelajaran}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge variant={pesertaData.is_blocked ? "destructive" : "default"}>
                  {pesertaData.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Block Form */}
        {!pesertaData.is_blocked ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                Blokir Peserta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keterangan Pelanggaran *
                </label>
                <Textarea
                  placeholder="Masukkan alasan pemblokiran (contoh: Keluar dari aplikasi tanpa izin)"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  rows={4}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleBlock}
                disabled={isBlocking || !blockReason.trim()}
                className="w-full bg-red-600 hover:bg-red-700"
                size="lg"
              >
                {isBlocking ? 'Memblokir...' : 'Blokir Peserta'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Block Reason Card */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-red-800">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Alasan Pemblokiran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{pesertaData.block_reason || 'Tidak ada keterangan'}</p>
              </CardContent>
            </Card>

            {/* Unlock Code Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Key className="w-5 h-5 mr-2 text-blue-600" />
                  Kode Unlock
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">{pesertaData.unlock_code && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800 mb-2">Kode saat ini:</p>
                    <p className="text-3xl font-bold text-blue-900 tracking-widest text-center">
                      {pesertaData.unlock_code}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kode Unlock (5 Karakter)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Contoh: AB12C"
                      value={unlockCode}
                      onChange={(e) => setUnlockCode(e.target.value.toUpperCase())}
                      maxLength={5}
                      className="flex-1 text-center text-2xl font-bold tracking-widest"
                    />
                    <Button
                      onClick={handleGenerateCode}
                      disabled={isGenerating}
                      className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                    >
                      {isGenerating ? 'Generating...' : 'Generate Code'}
                    </Button>
                  </div>
                  {unlockCode && (
                    <p className="text-xs text-gray-500 mt-2">
                      Kode ini akan digunakan siswa untuk membuka blokir
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleUnblock}
                  disabled={isUnblocking || !unlockCode.trim()}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {isUnblocking ? 'Membuka blokir...' : 'Unblock Peserta'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="w-full"
          size="lg"
        >
          Kembali
        </Button>
      </div>
    </AdminLayout>
  );
}
