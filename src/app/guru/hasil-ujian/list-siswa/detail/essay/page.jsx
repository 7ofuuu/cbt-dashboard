'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import GuruLayout from '../../../../guruLayout';

function Question({ number, text, answer, score, tempScore, onTempScoreChange, onSave, saved }) {
  const isValid = tempScore !== '' && !isNaN(tempScore) && tempScore >= 0 && tempScore <= 100;
  const hasChanged = String(tempScore) !== String(score ?? '');
  
  return (
    <div className='border-l-4 border-blue-500 pl-4 py-4 mb-6'>
      <p className='font-semibold text-gray-800 mb-1'>Pertanyaan {number}</p>
      <p className='text-gray-700 mb-3'>{text}</p>

      <p className='text-gray-600 font-medium mb-2'>Jawaban</p>
      <div className='border rounded-lg p-4 text-gray-800 bg-white'>
        {answer}
      </div>

      <div className='mt-3 flex items-center gap-3'>
        <span className='text-gray-700 font-medium'>Masukkan Nilai:</span>
        <input
          type='number'
          min={0}
          max={100}
          value={tempScore}
          onChange={(e) => onTempScoreChange(e.target.value)}
          placeholder='Angka 0-100'
          className='w-32 px-3 py-2 border rounded-lg text-sm'
        />
        <button
          onClick={onSave}
          disabled={!isValid || !hasChanged}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            !isValid || !hasChanged
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          Simpan
        </button>
        {saved && <span className='text-green-600 font-medium'>✓ Tersimpan</span>}
      </div>
    </div>
  );
}

export default function BeriNilaiEssayPage() {
  const params = useSearchParams();
  const mataPelajaran = params.get('mata') || 'Matematika';
  const kelas = params.get('kelas') || 'XII - IPA 1';
  const siswaId = params.get('siswaId') || '2';
  const page = Number(params.get('page') || '1');

  const pages = {
    1: [
      {
        number: 1,
        text: 'Diketahui fungsi f(x)=3x+2. Hitung nilai f(4). Tuliskan langkah penyelesaiannya!',
        answer:
          'Masukkan nilai x=4 ke dalam fungsi: f(4)=3(4)+2=12+2=14. Jadi, nilai f(4) adalah 14.',
      },
      {
        number: 2,
        text: 'Diketahui fungsi f(x)=3x+2. Hitung nilai f(4). Tuliskan langkah penyelesaiannya!',
        answer:
          'Aljabar adalah cabang matematika yang menggunakan huruf/simbol (xxx, yyy, aaa) untuk mewakili bilangan yang belum diketahui. Contoh: x+3=7 ⇒ x=7-3. Dengan aljabar, kita bisa mencari nilainya.',
      },
    ],
    2: [
      {
        number: 3,
        text: 'Diketahui fungsi f(x)=3x+2. Hitung nilai f(4). Tuliskan langkah penyelesaiannya!',
        answer:
          'Masukkan nilai x=4 ke dalam fungsi: f(4)=3(4)+2=12+2=14. Jadi, nilai f(4) adalah 14.',
      },
      {
        number: 4,
        text: 'Diketahui fungsi f(x)=3x+2. Hitung nilai f(4). Tuliskan langkah penyelesaiannya!',
        answer:
          'Masukkan nilai x=4 ke dalam fungsi: f(4)=3(4)+2=12+2=14. Jadi, nilai f(4) adalah 14.',
      },
    ],
  };

  const storageKey = useMemo(() => `essayScores:${mataPelajaran}:${kelas}:${siswaId}`, [mataPelajaran, kelas, siswaId]);
  const [scores, setScores] = useState({});
  const [tempScores, setTempScores] = useState({});
  const [savedFlags, setSavedFlags] = useState({});

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setScores(parsed);
          setTempScores(parsed);
        }
      }
    } catch {}
  }, [storageKey]);

  // Save to sessionStorage when scores change
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(scores));
    } catch {}
  }, [scores, storageKey]);

  const handleTempScoreChange = (n, v) => {
    setTempScores((s) => ({ ...s, [n]: v }));
    setSavedFlags((f) => ({ ...f, [n]: false }));
  };

  const handleSaveScore = (n) => {
    const val = tempScores[n];
    const num = Number(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setScores((s) => ({ ...s, [n]: num }));
      setSavedFlags((f) => ({ ...f, [n]: true }));
      toast.success(`Nilai soal ${n} tersimpan`);
      setTimeout(() => setSavedFlags((f) => ({ ...f, [n]: false })), 2000);
    }
  };

  const data = pages[page] || pages[1];
  const allNumbers = useMemo(() => [...pages[1], ...pages[2]].map(q => q.number), []);

  const handleSubmit = () => {
    // Validasi semua soal sudah diisi
    const missing = allNumbers.filter(n => !(n in scores) || scores[n] === '' || scores[n] === null || scores[n] === undefined);
    if (missing.length) {
      toast.error(`Nilai belum lengkap untuk soal: ${missing.join(', ')}`);
      return;
    }
    
    // Validasi nilai valid (0-100)
    const invalid = allNumbers.filter(n => {
      const val = Number(scores[n]);
      return !Number.isFinite(val) || val < 0 || val > 100;
    });
    if (invalid.length) {
      toast.error(`Nilai tidak valid untuk soal: ${invalid.join(', ')}`);
      return;
    }

    // Siap submit - nanti tinggal ganti dengan API endpoint backend kamu
    const payload = {
      mataPelajaran,
      kelas,
      siswaId,
      scores
    };
    
    console.log('Data yang akan dikirim ke backend:', payload);
    toast.success('Nilai essay berhasil disubmit!');
    
    // Clear sessionStorage setelah submit
    try { sessionStorage.removeItem(storageKey); } catch {}
    
    // Nanti bisa ditambahkan:
    // fetch('URL_BACKEND_KAMU/api/submit-nilai', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // });
  };

  return (
    <GuruLayout>
      <div>
        {/* Breadcrumb */}
        <div className='mb-6 text-sm'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            <Link href='/guru/hasil-ujian' className='text-gray-600 hover:text-gray-900'>Hasil Ujian</Link>
            {' › '}
            <Link href={`/guru/hasil-ujian/list-kelas?mata=${encodeURIComponent(mataPelajaran)}`} className='text-gray-600 hover:text-gray-900'>
              {mataPelajaran}
            </Link>
            {' › '}
            <Link href={`/guru/hasil-ujian/list-siswa?mata=${encodeURIComponent(mataPelajaran)}&kelas=${encodeURIComponent(kelas)}`} className='text-gray-600 hover:text-gray-900'>
              {kelas}
            </Link>
            {' › '}
            <Link href={`/guru/hasil-ujian/list-siswa/detail?mata=${encodeURIComponent(mataPelajaran)}&kelas=${encodeURIComponent(kelas)}&siswaId=${encodeURIComponent(siswaId)}`} className='text-gray-600 hover:text-gray-900'>
              Beri Nilai
            </Link>
            {' › '}
            <span>Beri Nilai Essay</span>
          </h1>
        </div>

        {/* Questions */}
        <div className='bg-white rounded-lg border border-gray-200 p-6'>
          {data.map((q) => (
            <Question
              key={q.number}
              number={q.number}
              text={q.text}
              answer={q.answer}
              score={scores[q.number]}
              tempScore={tempScores[q.number] ?? scores[q.number] ?? ''}
              onTempScoreChange={(v) => handleTempScoreChange(q.number, v)}
              onSave={() => handleSaveScore(q.number)}
              saved={savedFlags[q.number]}
            />
          ))}

          {/* Bottom actions */}
          <div className='grid grid-cols-3 items-center pt-2'>
            <div>
              {page === 2 ? (
                <button onClick={handleSubmit} className='bg-blue-900 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold'>
                  Submit nilai
                </button>
              ) : null}
            </div>

            {/* Pagination centered */}
            <div className='flex items-center justify-center gap-2'>
              <Link
                href={`/guru/hasil-ujian/list-siswa/detail/essay?mata=${encodeURIComponent(mataPelajaran)}&kelas=${encodeURIComponent(kelas)}&siswaId=${encodeURIComponent(siswaId)}&page=1`}
                className={`px-2 py-1 rounded ${page === 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                1
              </Link>
              <Link
                href={`/guru/hasil-ujian/list-siswa/detail/essay?mata=${encodeURIComponent(mataPelajaran)}&kelas=${encodeURIComponent(kelas)}&siswaId=${encodeURIComponent(siswaId)}&page=2`}
                className={`px-2 py-1 rounded ${page === 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                2
              </Link>
            </div>

            <div />
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </GuruLayout>
  );
}
