'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

export default function DetailAktivitasPesertaPage() {
  const router = useRouter();
  const params = useParams();
  const pesertaId = params.id;

  const [recoveryCode, setRecoveryCode] = useState('u8Bp9');
  const [unblockCode, setUnblockCode] = useState('');
  const [unblockMessage, setUnblockMessage] = useState('');

  // Sample data - replace with actual data
  const peserta = {
    id: pesertaId,
    nama: 'Dewi Lestari',
    kelas: 'XII IPS 01',
    status: 'Blocked',
    foto: '/next.svg',
    violation: 'Keluar dari aplikasi sebelum ujian selesai.',
  };

  const handleGenerateCode = () => {
    const newCode = Math.random().toString(36).substr(2, 5);
    setRecoveryCode(newCode.toUpperCase());
  };

  const handleUnblockSubmit = (e) => {
    e.preventDefault();
    // Verify recovery code
    if (unblockCode === recoveryCode) {
      setUnblockMessage('Status peserta berhasil dipulihkan!');
      setUnblockCode('');
    } else {
      setUnblockMessage('Kode pemulihan tidak sesuai. Silakan coba lagi.');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">
        <button
          onClick={() => router.push('/admin/aktivitas/peserta')}
          className="text-blue-600 hover:text-blue-800 mr-2">
          Aktivitas Peserta
        </button>
        <span>Detail</span>
      </h2>

      <div className="space-y-6">
        {/* User Detail Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start gap-6">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-200 shrink-0">
              <Image
                src={peserta.foto}
                alt={peserta.nama}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{peserta.nama}</h3>
              <p className="text-gray-600 mb-3">{peserta.kelas}</p>
              <div className="inline-block">
                <span className="text-gray-600 mr-2">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${peserta.status === 'Blocked' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {peserta.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Violation Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Keterangan Pelanggaran</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-gray-700">{peserta.violation}</p>
          </div>
        </div>

        {/* Recovery Code Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kode Pemulihan</h3>
          <div className="flex gap-3">
            <Input
              type="text"
              id="recoveryCode"
              value={recoveryCode}
              readOnly
              className="flex-1 font-mono text-lg"
            />
            <Button
              onClick={handleGenerateCode}
              variant="outline"
            >
              Generate Code
            </Button>
          </div>
        </div>

        {/* Unblock Status Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pulihkan Status</h3>
          <form onSubmit={handleUnblockSubmit} className="space-y-3" autoComplete="off" noValidate>
            <Input
              id="unblockCodeInput"
              type="text"
              placeholder="Masukkan kode pemulihan *"
              value={unblockCode}
              onChange={(e) => setUnblockCode(e.target.value)}
              required
            />
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Konfirmasi
            </Button>
          </form>
          {unblockMessage && (
            <p className={`text-sm mt-3 ${unblockMessage.includes('berhasil') ? 'text-green-600' : 'text-red-600'}`}>
              {unblockMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
