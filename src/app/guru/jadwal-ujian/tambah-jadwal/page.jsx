"use client";

import { useState } from 'react';
import Link from 'next/link';
import GuruLayout from '../../guruLayout';
import { useAuth } from '@/hooks/useAuth';

export default function TambahJadwalPage() {
  useAuth(['guru']);

  const [form, setForm] = useState({
    nama: '',
    tanggal: '',
    pukul: '',
    tingkat: '',
    jurusan: '',
    mapel: '',
  });

  function update(field) {
    return (e) => setForm((s) => ({ ...s, [field]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    console.log('Simpan jadwal:', form);
    // TODO: call API to save
    alert('Jadwal disimpan (contoh)');
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
                  <option value="">Semua Tingkat</option>
                  <option value="X">X</option>
                  <option value="XI">XI</option>
                  <option value="XII">XII</option>
                </select>
                <select value={form.jurusan} onChange={update('jurusan')} className="px-4 py-2 border rounded-full">
                  <option value="">Semua Jurusan</option>
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
