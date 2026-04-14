'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../../adminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Home, AlertTriangle, Shield, Key, User, BookOpen, GraduationCap, Clock, CheckCircle2, XCircle, Copy, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import request from '@/utils/request';
import toast from 'react-hot-toast';
import { use } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { StaggerList, StaggerItem } from '@/components/motion/stagger-list';

export default function TerblokirPage({ params }) {
  useAuth(['admin']);

  const router = useRouter();
  const { examParticipantId } = use(params);

  const [pesertaData, setPesertaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [blockReason, setBlockReason] = useState('');
  const [unlockCode, setUnlockCode] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);
  const [codeJustGenerated, setCodeJustGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (examParticipantId) {
      fetchParticipantDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examParticipantId]);

  const fetchParticipantDetail = async () => {
    try {
      setLoading(true);
      const response = await request.get(`/admin/activities/participant/${examParticipantId}`);

      if (response.data.success) {
        const data = response.data.data;
        setPesertaData(data);
        setBlockReason(data.block_reason || '');
        setUnlockCode(data.unlock_code || '');
      }
    } catch (error) {
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
      const response = await request.post(`/admin/activities/${examParticipantId}/block`, {
        block_reason: blockReason
      });

      if (response.data.success) {
        toast.success('Peserta berhasil diblokir');
        fetchParticipantDetail();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memblokir peserta');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      setIsGenerating(true);
      const response = await request.post(`/admin/activities/${examParticipantId}/generate-unlock`);

      if (response.data.success) {
        toast.success('Kode unlock berhasil di-generate');
        setUnlockCode(response.data.data.unlock_code);
        setCodeJustGenerated(true);
        setTimeout(() => setCodeJustGenerated(false), 1800);
        fetchParticipantDetail();
      }
    } catch (error) {
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
      const response = await request.post(`/admin/activities/${examParticipantId}/unblock`, {
        unlock_code: unlockCode
      });

      if (response.data.success) {
        toast.success('Peserta berhasil di-unblock');
        setShowConfetti(true);
        setTimeout(() => {
          router.back();
        }, 1200);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal unblock peserta');
    } finally {
      setIsUnblocking(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Kode berhasil disalin');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Helper function to convert grade_level from Roman to number
  const convertTingkat = (grade_level) => {
    const romanToNumber = {
      'X': '10',
      'XI': '11',
      'XII': '12'
    };
    return romanToNumber[grade_level] || grade_level;
  };

  // Helper function to format classroom display
  const formatKelas = (classroom, major) => {
    if (!classroom) return '-';

    // Handle new format: "IPA 01" -> "IPA 1"
    let match = classroom.match(/^(IPA|IPS)\s+0?(\d+)$/);
    if (match) {
      return `${match[1]} ${match[2]}`;
    }

    // Handle old format: "X-1" -> "IPA 1" (using major from separate column)
    match = classroom.match(/^[XVI]+- ?(\d+)$/);
    if (match && major) {
      return `${major} ${match[1]}`;
    }

    return classroom;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!pesertaData) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-500 mb-4">Data tidak ditemukan</p>
          <Button
            onClick={() => router.back()}
            variant="outline"
          >
            Kembali
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/admin/dashboard'>
              <Home className='w-4 h-4' />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href='/admin/activity'>Aktivitas</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => router.back()} className="cursor-pointer">Detail</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Manajemen Blokir</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <StaggerList className="space-y-6">
        <StaggerItem>
        <PageHeader
          title="Manajemen Peserta Terblokir"
          description="Kelola status blokir dan kode unlock untuk peserta ujian"
        >
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
        </PageHeader>
        </StaggerItem>

        {/* Student Info Card - Enhanced */}
        <StaggerItem>
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-xl flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Informasi Peserta
            </CardTitle>
            <CardDescription>Detail lengkap peserta ujian</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <User className="w-4 h-4 mr-1" />
                  Nama Lengkap
                </div>
                <p className="text-lg font-semibold text-gray-900">{pesertaData.full_name}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <GraduationCap className="w-4 h-4 mr-1" />
                  Kelas
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  Tingkat {convertTingkat(pesertaData.grade_level)} - {formatKelas(pesertaData.classroom, pesertaData.major)}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <BookOpen className="w-4 h-4 mr-1" />
                  Mata Pelajaran
                </div>
                <p className="text-lg font-semibold text-gray-900">{pesertaData.subject}</p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <Clock className="w-4 h-4 mr-1" />
                  Ujian
                </div>
                <p className="font-semibold text-gray-900">{pesertaData.exam_name}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500 mb-1">Status Ujian</p>
                <Badge variant={pesertaData.is_blocked ? "destructive" : "default"} className="text-sm">
                  {pesertaData.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        </StaggerItem>

        {/* Block/Unblock Section */}
        <AnimatePresence mode="wait">
        {!pesertaData.is_blocked ? (
          <motion.div
            key="block-state"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
          <Card className="border-2 border-orange-200">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
              <CardTitle className="text-xl flex items-center text-orange-900">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Blokir Peserta
              </CardTitle>
              <CardDescription>
                Blokir peserta jika terdeteksi melakukan pelanggaran
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Peserta yang diblokir tidak dapat melanjutkan ujian sampai di-unblock oleh admin
                </AlertDescription>
              </Alert>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keterangan Pelanggaran <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Contoh: Keluar dari aplikasi tanpa izin, membuka tab lain, dll."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  rows={4}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Jelaskan alasan pemblokiran secara detail
                </p>
              </div>

              <Button
                onClick={handleBlock}
                disabled={isBlocking || !blockReason.trim()}
                className="w-full bg-red-600 hover:bg-red-700"
                size="lg"
              >
                <Shield className="w-4 h-4 mr-2" />
                {isBlocking ? 'Memblokir...' : 'Blokir Peserta'}
              </Button>
            </CardContent>
          </Card>
          </motion.div>
        ) : (
          <motion.div
            key="unblock-state"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Block Reason Card */}
            <Card className="border-2 border-red-200">
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                <CardTitle className="text-xl flex items-center text-red-900">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Alasan Pemblokiran
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed">
                    {pesertaData.block_reason || 'Tidak ada keterangan'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Unlock Code Card */}
            <Card className="border-2 border-green-200">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-xl flex items-center text-green-900">
                  <Key className="w-5 h-5 mr-2" />
                  Kode Unlock
                </CardTitle>
                <CardDescription>
                  Generate dan kelola kode unlock untuk membuka blokir peserta
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {pesertaData.unlock_code && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      boxShadow: codeJustGenerated
                        ? ['0 0 0 0 rgba(59,130,246,0)', '0 0 0 14px rgba(59,130,246,0.25)', '0 0 0 0 rgba(59,130,246,0)']
                        : '0 0 0 0 rgba(0,0,0,0)',
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 280,
                      damping: 22,
                      boxShadow: { duration: 1.4, repeat: codeJustGenerated ? 1 : 0 },
                    }}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6"
                  >
                    <p className="text-sm text-blue-800 font-medium mb-3 text-center">
                      Kode Unlock Saat Ini
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <motion.p
                        key={pesertaData.unlock_code}
                        initial={{ scale: 0.7, opacity: 0, rotate: -4 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                        className="text-4xl font-bold text-blue-900 tracking-[0.5em] font-mono"
                      >
                        {pesertaData.unlock_code}
                      </motion.p>
                      <Button
                        onClick={() => copyToClipboard(pesertaData.unlock_code)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 relative"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {copied ? (
                            <motion.span
                              key="check"
                              initial={{ scale: 0, rotate: -20 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                              className="flex items-center"
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </motion.span>
                          ) : (
                            <motion.span
                              key="copy"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="flex items-center"
                            >
                              <Copy className="w-4 h-4" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Button>
                    </div>
                    <p className="text-xs text-blue-700 mt-3 text-center">
                      Berikan kode ini kepada siswa untuk membuka blokir
                    </p>
                  </motion.div>
                )}

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-800 mb-2">Langkah Buka Blokir</p>
                  <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                    <li>Klik <span className="font-semibold text-blue-700">Generate</span> untuk membuat kode unlock 6 karakter.</li>
                    <li>Salin kode, lalu serahkan kepada siswa yang bersangkutan.</li>
                    <li>Klik <span className="font-semibold text-green-700">Unblock Peserta</span> untuk menyelesaikan proses.</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kode Unlock
                    <span className="text-xs text-gray-500 font-normal ml-1">(6 karakter alfanumerik)</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="AB12CD"
                      value={unlockCode}
                      onChange={(e) => setUnlockCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="flex-1 text-center text-2xl font-bold tracking-widest font-mono"
                    />
                    <Button
                      onClick={handleGenerateCode}
                      disabled={isGenerating}
                      className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap px-6"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      {isGenerating ? 'Generating...' : 'Generate'}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleUnblock}
                  disabled={isUnblocking || !unlockCode.trim() || unlockCode.length !== 6}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {isUnblocking ? 'Membuka blokir...' : 'Unblock Peserta'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
        </AnimatePresence>
      </StaggerList>

      {/* Success confetti overlay */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14 }}
              className="rounded-full bg-green-500 p-6 shadow-2xl"
            >
              <CheckCircle2 className="h-16 w-16 text-white" strokeWidth={2.5} />
            </motion.div>
            {[...Array(14)].map((_, i) => {
              const angle = (i / 14) * Math.PI * 2;
              const distance = 140;
              const x = Math.cos(angle) * distance;
              const y = Math.sin(angle) * distance;
              const colors = ['bg-green-400', 'bg-emerald-500', 'bg-blue-400', 'bg-yellow-400', 'bg-pink-400'];
              return (
                <motion.span
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                  animate={{ x, y, opacity: 0, scale: 1.4, rotate: 360 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className={`absolute h-3 w-3 rounded-sm ${colors[i % colors.length]}`}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
