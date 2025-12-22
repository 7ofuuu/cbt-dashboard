'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AdminLayout from '../../../adminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import request from '@/utils/request';
import toast from 'react-hot-toast';

export default function TerblokirPage({ params }) {
  useAuth(['admin']);
  
  const router = useRouter();
  const { pesertaUjianId } = params;
  
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
      const response = await request.get(`/api/admin/activities/participant/${pesertaUjianId}`);
      
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
      const response = await request.post(`/api/admin/activities/${pesertaUjianId}/block`, {
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
      const response = await request.post(`/api/admin/activities/${pesertaUjianId}/generate-unlock`);

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
      const response = await request.post(`/api/admin/activities/${pesertaUjianId}/unblock`, {
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
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button 
            onClick={() => router.push('/admin/aktivitas')}
            className="hover:text-gray-900"
          >
            Aktivitas
          </button>
          <span>&gt;</span>
          <button 
            onClick={() => router.back()}
            className="hover:text-gray-900"
          >
            Detail
          </button>
          <span>&gt;</span>
          <span className="text-gray-900 font-semibold">Terblokir</span>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900">
          Aktivitas &gt; Detail &gt; Terblokir
        </h2>

        {/* Student Info Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                <svg 
                  className="w-8 h-8 text-gray-400" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{pesertaData.nama}</h3>
                <p className="text-gray-600">{pesertaData.tingkat} {pesertaData.kelas}</p>
              </div>
            </div>
            <div>
              <span className={`px-4 py-2 inline-flex text-sm font-semibold rounded-full ${
                pesertaData.is_blocked 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                Status: {pesertaData.status}
              </span>
            </div>
          </div>
        </div>

        {/* Block Form */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keterangan Pelanggaran
            </label>
            <Textarea
              placeholder="Keluar dari aplikasi"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              rows={4}
              disabled={pesertaData.is_blocked}
              className="w-full"
            />
          </div>

          {!pesertaData.is_blocked && (
            <Button
              onClick={handleBlock}
              disabled={isBlocking || !blockReason.trim()}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isBlocking ? 'Memblokir...' : 'Blokir Peserta'}
            </Button>
          )}

          {pesertaData.is_blocked && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generative Code
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="ex: u8Bp9"
                    value={unlockCode}
                    onChange={(e) => setUnlockCode(e.target.value.toUpperCase())}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleGenerateCode}
                    disabled={isGenerating}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Code'}
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleUnblock}
                disabled={isUnblocking || !unlockCode.trim()}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isUnblocking ? 'Membuka blokir...' : 'Unblock Peserta'}
              </Button>
            </>
          )}
        </div>

        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="w-full"
        >
          Kembali
        </Button>
      </div>
    </AdminLayout>
  );
}
