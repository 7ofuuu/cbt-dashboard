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
  });

  const update = (field) => (e) => setForm((s) => ({ ...s, [field]: e.target.value }));

  const getTingkatValue = (t) => {
    const map = { 'X': '10', 'XI': '11', 'XII': '12' };
    return map[t] || t;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    
    const startTime = new Date(`${form.tanggal}T${form.pukul}:00.000+07:00`);
    const endTime = new Date(startTime.getTime()  + 120 * 60000);
   
    try {
      const examPayload = {
        nama_ujian: form.nama,
        mata_pelajaran: form.mapel,
        tingkat: getTingkatValue(form.tingkat),
        jurusan: form.jurusan,
        tanggal_mulai: startTime.toISOString(),
        tanggal_selesai: endTime.toISOString(), 
        durasi_menit: 120,
        is_acak_soal: true
      };

      const createRes = await request.post('/ujian', examPayload);
      const newUjianId = createRes.data.ujian_id; 

      const soalRes = await request.get('/soal', {
        params: {
          mata_pelajaran: form.mapel,
          tingkat: getTingkatValue(form.tingkat)
        }
      });

      const rawSoals = soalRes.data.soals || soalRes.data || []; 
      const currentTingkat = getTingkatValue(form.tingkat);

      const filteredSoals = rawSoals.filter(soal => 
        String(soal.tingkat) === String(currentTingkat) && 
      soal.mata_pelajaran === form.mapel
      );

      if (filteredSoals.length === 0) {
        toast.error("Tidak ada soal yang cocok ditemukan.");
        return;
      }
      
      const availableSoals = soalRes.data.soals || [

      ];

      if (availableSoals.length === 0) {
        toast.error("Tidak ada soal yang ditemukan untuk kriteria ini.");
        return;
      }

      const assignPromises = filteredSoals.map((soal, index) => {
        return request.post('/ujian/assign-soal', {
          ujian_id: newUjianId,
          soal_id: soal.soal_id, 
          bobot_nilai: 10,
          urutan: index + 1
        });
      });

      await Promise.all(assignPromises);

      toast.success('Jadwal dan Soal berhasil disimpan!');
      router.push('/guru/jadwal-ujian');

    } catch (error) {
      console.error(error);
      toast.error('Gagal membuat jadwal atau assign soal.');
    }
  }

  return (
    <GuruLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold inline">Jadwal Ujian</h1>
          <span className="mx-2"></span>
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
                className="w-full border rounded-md px-4 py-3 text-gray-700"
                placeholder="Teks ujian...."
                value={form.nama}
                onChange={update('nama')}
              />

              <input
                type="date"
                className="w-full border rounded-md px-4 py-3 text-gray-700"
                value={form.tanggal}
                onChange={update('tanggal')}
              />

              <input
                type="time"
                className="w-full border rounded-md px-4 py-3 text-gray-700"
                value={form.pukul}
                onChange={update('pukul')}
              />

              <div className="flex gap-3 flex-wrap">
                <select value={form.tingkat} onChange={update('tingkat')} className="px-4 py-2 border rounded-full">
                  <option value="">Pilih Tingkat</option>
                  <option value="X">X</option>
                  <option value="XI">XI</option>
                  <option value="XII">XII</option>
                </select>
                <select value={form.jurusan} onChange={update('jurusan')} className="px-4 py-2 border rounded-full">
                  <option value="">Pilih Jurusan</option>
                  <option value="IPA">IPA</option>
                  <option value="IPS">IPS</option>
                </select>
              </div>

              <select value={form.mapel} onChange={update('mapel')} className="px-4 py-3 border rounded-md w-1/2">
                <option value="">Pilih Mapel</option>
                <option value="Matematika">Matematika</option>
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                <option value="Bahasa Inggris">Bahasa Inggris</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <Link href="/guru/jadwal-ujian" className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md">
              <span className="font-semibold">Cancel</span>
            </Link>
            <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-sky-800 text-white rounded-md">
              <span className="font-semibold">Save</span>
            </button>
          </div>
        </form>
      </div>
    </GuruLayout>
  );
}
