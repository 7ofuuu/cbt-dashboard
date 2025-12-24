"use client";

import { useState } from 'react';
import Link from 'next/link';
import GuruLayout from '../../guruLayout';
import { useAuth } from '@/hooks/useAuth';
import request from '@/utils/request'; 
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function TambahJadwalPage() {
  useAuth(['guru']);
  const router = useRouter();

  const [form, setForm] = useState({
    nama: '',
    tanggal: '',
    pukul: '',
    tingkat: '', 
    jurusan: '',
    mapel: '',
    autoAssignSiswa: true, // Default: otomatis assign siswa
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field) => (e) => setForm((s) => ({ ...s, [field]: e.target.value }));

  // Removed getTingkatValue - send tingkat as-is (X, XI, XII) to match database

  async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    // 1. Calculate Times
    const startTime = new Date(`${form.tanggal}T${form.pukul}:00.000+07:00`);
    const endTime = new Date(startTime.getTime() + 120 * 60000);
   
    try {
      setIsSubmitting(true);
      
      const examPayload = {
        nama_ujian: form.nama,
        mata_pelajaran: form.mapel,
        tingkat: form.tingkat, // ✅ Send as-is: "X", "XI", "XII"
        jurusan: form.jurusan,
        tanggal_mulai: startTime.toISOString(),
        tanggal_selesai: endTime.toISOString(), 
        durasi_menit: 120,
        is_acak_soal: true,
        auto_assign_siswa: form.autoAssignSiswa // Kirim flag auto-assign
      };


      const createRes = await request.post('/ujian', examPayload);
      const newUjianId = createRes.data.ujian_id;
      const siswaAssigned = createRes.data.jumlah_siswa_assigned || 0;
      const autoAssignEnabled = createRes.data.auto_assign_enabled;
      const warning = createRes.data.warning;

      // Provide appropriate feedback based on auto-assign result
      if (autoAssignEnabled) {
        if (siswaAssigned > 0) {
          toast.success(`✅ Jadwal berhasil dibuat! ${siswaAssigned} siswa telah di-assign secara otomatis.`, {
            duration: 4000
          });
        } else if (warning) {
          toast.success('✅ Jadwal berhasil dibuat!', { duration: 2000 });
          // Use toast() with custom styling instead of toast.warning()
          toast(warning, { 
            icon: '⚠️',
            duration: 5000,
            style: {
              background: '#FEF3C7',
              color: '#92400E',
              border: '1px solid #FCD34D'
            }
          });
        } else {
          toast.success('✅ Jadwal berhasil dibuat!', { duration: 2000 });
          toast('⚠️ Tidak ada siswa yang di-assign. Silahkan assign manual.', { 
            duration: 5000,
            style: {
              background: '#FEF3C7',
              color: '#92400E',
              border: '1px solid #FCD34D'
            }
          });
        }
      } else {
        toast.success('✅ Jadwal berhasil dibuat! Silahkan pilih siswa untuk di-assign.', { duration: 4000 });
      }
      
  
      router.push(`/guru/jadwal-ujian/tambah-jadwal/pilih-bank?ujianId=${newUjianId}`);

    } catch (error) {
      console.error('Error creating ujian:', error);
      
      // More detailed error message
      let errorMessage = 'Gagal membuat jadwal ujian.';
      
      if (error.response) {
        // Server responded with error
        console.error('Response error:', error.response.data);
        errorMessage = error.response.data.error || error.response.data.message || errorMessage;
      } else if (error.request) {
        // Request made but no response
        console.error('No response from server');
        errorMessage = 'Server tidak merespons. Pastikan backend sudah berjalan.';
      } else {
        // Something else happened
        console.error('Error message:', error.message);
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <GuruLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold inline">Jadwal Ujian</h1>
          <span className="mx-2">›</span>
          <span className="text-xl font-semibold">Tambah Jadwal</span>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="text-gray-500 text-lg">Nama:</div>
              <div className="text-gray-500 text-lg">Hari/Tanggal:</div>
              <div className="text-gray-500 text-lg">Pukul:</div>
              <div className="text-gray-500 text-lg">Jurusan/Tingkat:</div>
              <div className="text-gray-500 text-lg">Mapel</div>
            </div>

            <div className="space-y-4">
              <input
                required
                className="w-full border rounded-md px-4 py-3 text-gray-700"
                placeholder="Teks ujian...."
                value={form.nama}
                onChange={update('nama')}
              />

              <input
                required
                type="date"
                className="w-full border rounded-md px-4 py-3 text-gray-700"
                value={form.tanggal}
                onChange={update('tanggal')}
              />

              <input
                required
                type="time"
                className="w-full border rounded-md px-4 py-3 text-gray-700"
                value={form.pukul}
                onChange={update('pukul')}
              />

              <div className="flex gap-3 flex-wrap">
                <select required value={form.tingkat} onChange={update('tingkat')} className="px-4 py-2 border rounded-full">
                  <option value="">Pilih Tingkat</option>
                  <option value="X">X</option>
                  <option value="XI">XI</option>
                  <option value="XII">XII</option>
                </select>
                <select required value={form.jurusan} onChange={update('jurusan')} className="px-4 py-2 border rounded-full">
                  <option value="">Pilih Jurusan</option>
                  <option value="IPA">IPA</option>
                  <option value="IPS">IPS</option>
                </select>
              </div>

              <select required value={form.mapel} onChange={update('mapel')} className="px-4 py-3 border rounded-md w-1/2">
                <option value="">Pilih Mapel</option>
                <option value="Matematika">Matematika</option>
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                <option value="Bahasa Inggris">Bahasa Inggris</option>
              </select>

              {/* Auto-assign siswa checkbox */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="autoAssign"
                    checked={form.autoAssignSiswa}
                    onChange={(e) => setForm(s => ({ ...s, autoAssignSiswa: e.target.checked }))}
                    className="w-4 h-4 mt-1 text-sky-800 border-gray-300 rounded focus:ring-sky-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="autoAssign" className="text-sm font-medium text-gray-900 cursor-pointer">
                      🎯 Otomatis assign siswa berdasarkan tingkat dan jurusan
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      {form.autoAssignSiswa 
                        ? `Semua siswa dengan Tingkat ${form.tingkat || '...'} dan Jurusan ${form.jurusan || '...'} akan otomatis di-assign ke ujian ini.`
                        : 'Siswa tidak akan di-assign otomatis. Anda perlu assign secara manual setelah ujian dibuat.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <Link href="/guru/jadwal-ujian" className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md">
              <span className="font-semibold">Cancel</span>
            </Link>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`inline-flex items-center gap-2 px-4 py-2 text-white rounded-md ${isSubmitting ? 'bg-gray-400' : 'bg-sky-800'}`}
            >
              <span className="font-semibold">{isSubmitting ? 'Saving...' : 'Save & Continue'}</span>
            </button>
          </div>
        </form>
      </div>
    </GuruLayout>
  );
}