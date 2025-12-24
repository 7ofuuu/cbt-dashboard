"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GuruLayout from '../../../guruLayout';
import request from '@/utils/request';
import toast from 'react-hot-toast';

export default function PilihBankSoalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ujianId = searchParams.get('ujianId'); // ID from the previous page

  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBankSoal();
  }, []);

  const fetchBankSoal = async () => {
    try {
      const res = await request.get('/soal/bank');
      // Based on your image, data is in "bankSoal"
      setBanks(res.data.bankSoal || []);
    } catch (error) {
      toast.error("Gagal memuat Bank Soal");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedBank) return toast.error("Pilih salah satu Bank Soal!");
    
    setSubmitting(true);
    try {
      const payload = {
        ujian_id: Number(ujianId),
        mata_pelajaran: selectedBank.mata_pelajaran,
        tingkat: selectedBank.tingkat,
        jurusan: selectedBank.jurusan,
        bobot_nilai_default: 10,
        is_acak: true
      };

      // Using the new batch endpoint
      const res = await request.post('/ujian/assign-bank', payload);
      toast.success(res.data.message || "Soal berhasil ditambahkan!");
      router.push('/guru/jadwal-ujian');
    } catch (error) {
      toast.error("Gagal menambahkan soal ke ujian");
    } finally {
      setSubmitting(false);
    }
  };

  const getColor = (index) => {
    const colors = ['bg-teal-700', 'bg-orange-400', 'bg-pink-400', 'bg-blue-600'];
    return colors[index % colors.length];
  };

  return (
    <GuruLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Pilih Bank Soal untuk Ujian #{ujianId}</h1>
          <button 
            onClick={handleAssign}
            disabled={submitting || !selectedBank}
            className={`px-6 py-2 rounded-md text-white font-semibold transition ${
              submitting || !selectedBank ? 'bg-gray-400' : 'bg-sky-800'
            }`}
          >
            {submitting ? "Memproses..." : "Konfirmasi & Simpan"}
          </button>
        </div>

        {loading ? (
          <p className="text-center py-10">Memuat Bank Soal...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {banks.map((bank, i) => {
              const isSelected = selectedBank === bank;
              return (
                <div 
                  key={i} 
                  onClick={() => setSelectedBank(bank)}
                  className={`cursor-pointer rounded-lg shadow-sm overflow-hidden border-2 transition ${
                    isSelected ? 'border-sky-600 ring-2 ring-sky-200' : 'border-transparent'
                  }`}
                >
                  <div className={`${getColor(i)} text-white p-4`}>
                    <h3 className="font-semibold">{bank.mata_pelajaran}</h3>
                  </div>
                  <div className="p-4 text-sm text-gray-700 bg-white">
                    <div className="flex justify-between border-b py-1">
                      <span className="font-medium">Tingkat:</span>
                      <span>{bank.tingkat}</span>
                    </div>
                    <div className="flex justify-between border-b py-1">
                      <span className="font-medium">Jurusan:</span>
                      <span>{bank.jurusan}</span>
                    </div>
                    <div className="flex justify-between py-1 mt-2 text-sky-700 font-bold">
                      <span>Total Soal:</span>
                      <span>{bank.jumlah_soal}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GuruLayout>
  );
}