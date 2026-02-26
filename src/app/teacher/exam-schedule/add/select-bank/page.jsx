"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TeacherLayout from '../../../teacherLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { Home, Search, CheckCircle2, BookOpen, Loader2 } from 'lucide-react';
import { getSubjectColor } from '@/lib/constants';
import request from '@/utils/request';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function PilihBankSoalPage() {
  useAuth(['teacher']);
  const router = useRouter();
  const searchParams = useSearchParams();
  const ujianId = searchParams.get('ujianId');

  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBankSoal();
  }, []);

  const fetchBankSoal = async () => {
    try {
      const res = await request.get('/questions/bank');
      setBanks(res.data.question_bank || []);
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
        exam_id: Number(ujianId),
        question_bank_id: selectedBank.question_bank_id,
      };

      const res = await request.post('/exams/assign-bank', payload);
      toast.success(res.data.message || "Soal berhasil ditambahkan!");
      router.push('/teacher/exam-schedule');
    } catch (error) {
      toast.error("Gagal menambahkan soal ke ujian");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBanks = banks.filter((bank) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      (bank.subject || '').toLowerCase().includes(q) ||
      (bank.bank_name || '').toLowerCase().includes(q) ||
      (bank.grade_level || '').toLowerCase().includes(q) ||
      (bank.major || '').toLowerCase().includes(q)
    );
  });

  return (
    <TeacherLayout>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/teacher/dashboard'>
              <Home className='w-4 h-4' />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href='/teacher/exam-schedule'>Kelola Ujian</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Pilih Bank Soal</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Pilih Bank Soal</h2>
            <p className="text-sm text-muted-foreground">
              Pilih bank soal untuk ujian #{ujianId}
            </p>
          </div>
          <Button
            onClick={handleAssign}
            disabled={submitting || !selectedBank}
            className="bg-[#03356C] hover:bg-[#02509E] text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Konfirmasi &amp; Simpan
              </>
            )}
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari bank soal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected bank info */}
        {selectedBank && (
          <Card className="border-[#03356C] bg-blue-50/50">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#03356C]" />
              <span className="text-sm font-medium">
                Dipilih: <strong>{selectedBank.bank_name || selectedBank.subject}</strong> — {selectedBank.total_questions} soal
              </span>
            </CardContent>
          </Card>
        )}

        {/* Bank list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
            <span className="text-muted-foreground">Memuat Bank Soal...</span>
          </div>
        ) : filteredBanks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-lg font-medium">Tidak ada bank soal ditemukan</p>
            <p className="text-sm">
              {searchQuery ? 'Coba ubah kata kunci pencarian.' : 'Buat bank soal terlebih dahulu.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBanks.map((bank) => {
              const isSelected = selectedBank?.question_bank_id === bank.question_bank_id;
              const subjectColor = getSubjectColor(bank.subject);

              return (
                <Card
                  key={bank.question_bank_id}
                  onClick={() => setSelectedBank(bank)}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? 'ring-2 ring-[#03356C] border-[#03356C] shadow-md'
                      : 'hover:border-gray-300'
                  }`}
                >
                  <CardContent className="p-0">
                    {/* Subject header */}
                    <div className="px-4 pt-4 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">
                            {bank.bank_name || bank.subject}
                          </h3>
                          <Badge className={`mt-1.5 text-xs ${subjectColor}`} variant="secondary">
                            {bank.subject}
                          </Badge>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-[#03356C] flex-shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="px-4 pb-4 space-y-2 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tingkat</span>
                        <span className="font-medium text-foreground">{bank.grade_level || '-'}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Jurusan</span>
                        <span className="font-medium text-foreground">{bank.major || '-'}</span>
                      </div>
                      <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-[#03356C]">
                        <span>Total Soal</span>
                        <span>{bank.total_questions ?? 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}