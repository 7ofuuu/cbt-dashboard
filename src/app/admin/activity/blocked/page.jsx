'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../adminLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import {
  Home, Search, RefreshCw, AlertTriangle, ShieldAlert, Users, X,
  Calendar, Clock, ChevronRight, BookOpen, GraduationCap, Layers,
} from 'lucide-react';
import FilterPanel from '@/components/filter-panel';
import { useAuth } from '@/hooks/useAuth';
import request from '@/utils/request';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { StaggerList, StaggerItem } from '@/components/motion/stagger-list';
import { AnimatedCard } from '@/components/motion/animated-card';
import { CountUp } from '@/components/motion/count-up';
import { useTaxonomy } from '@/contexts/TaxonomyContext';

export default function AktivitasTerblokirPage() {
  useAuth(['admin']);

  const router = useRouter();
  const { gradeLevels, majors } = useTaxonomy();
  const [filters, setFilters] = useState({
    search: '',
    major: 'all',
    grade_level: 'all',
  });

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlockedActivities();
  }, []);

  const fetchBlockedActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('status', 'BLOCKED');

      const response = await request.get(`/admin/activities?${params.toString()}`);

      if (response.data && response.data.success) {
        setActivities(response.data.data);
      }
    } catch (error) {
      toast.error('Gagal mengambil data aktivitas terblokir');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters({ search: '', major: 'all', grade_level: 'all' });
  };

  const handleRefresh = () => {
    fetchBlockedActivities();
  };

  const filteredActivities = () => {
    let result = [...activities];

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.exam_name?.toLowerCase().includes(q) ||
          a.subject?.toLowerCase().includes(q) ||
          a.grade_level?.toLowerCase().includes(q) ||
          a.major?.toLowerCase().includes(q)
      );
    }
    if (filters.major !== 'all') result = result.filter((a) => a.major === filters.major);
    if (filters.grade_level !== 'all') result = result.filter((a) => a.grade_level === filters.grade_level);

    return result;
  };

  const handleCardClick = (ujianId) => {
    router.push(`/admin/activity/detail/${ujianId}`);
  };

  const formatDateShort = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Severity tier by blocked participant count
  const getSeverity = (count) => {
    if (count >= 10) return { label: 'Tinggi', color: 'red', headerClass: 'from-red-600 via-red-500 to-rose-500' };
    if (count >= 3) return { label: 'Sedang', color: 'orange', headerClass: 'from-orange-600 via-orange-500 to-amber-500' };
    return { label: 'Rendah', color: 'amber', headerClass: 'from-amber-500 via-yellow-500 to-orange-400' };
  };

  const displayedActivities = filteredActivities();
  const totalBlocked = displayedActivities.reduce((acc, a) => acc + (a.participant_count || 0), 0);
  const highSeverity = displayedActivities.filter((a) => (a.participant_count || 0) >= 10).length;
  const activeFilterCount = [filters.search, filters.major !== 'all', filters.grade_level !== 'all'].filter(Boolean).length;

  return (
    <AdminLayout>
      <Breadcrumb className='mb-4'>
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
            <BreadcrumbPage>Terblokir</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='space-y-5'>
        <PageHeader
          title='Aktivitas Terblokir'
          description='Daftar ujian yang memiliki peserta terblokir - klik kartu untuk mengelola unlock code'
        >
          <Button onClick={handleRefresh} variant='outline' className='flex items-center gap-2'>
            <RefreshCw className='w-4 h-4' /> Segarkan
          </Button>
        </PageHeader>

        {/* ═══════ STATS - Bento grid ═══════ */}
        {!loading && (
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
            <StatCard
              value={displayedActivities.length}
              label='Ujian Terdampak'
              icon={<ShieldAlert className='w-5 h-5' />}
              gradient='from-red-500 to-rose-600'
              pulse={displayedActivities.length > 0}
              delay={0}
            />
            <StatCard
              value={totalBlocked}
              label='Total Peserta Diblokir'
              icon={<Users className='w-5 h-5' />}
              gradient='from-orange-500 to-amber-500'
              delay={0.1}
            />
            <StatCard
              value={highSeverity}
              label='Severity Tinggi (≥10)'
              icon={<AlertTriangle className='w-5 h-5' />}
              gradient='from-rose-500 to-pink-600'
              delay={0.2}
            />
            <StatCard
              value={displayedActivities.length > 0 ? Math.round(totalBlocked / displayedActivities.length) : 0}
              label='Rata-rata per Ujian'
              icon={<BookOpen className='w-5 h-5' />}
              gradient='from-amber-500 to-yellow-500'
              delay={0.3}
            />
          </div>
        )}

        {/* ═══════ FILTER CARD ═══════ */}
        <FilterPanel activeCount={activeFilterCount} onReset={handleResetFilters}>
            <div className='relative sm:col-span-2'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
              <Input
                type='text'
                placeholder='Cari ujian, mapel, tingkat, jurusan...'
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className='pl-10 h-10 w-full'
              />
            </div>

            <Select value={filters.grade_level} onValueChange={(v) => handleFilterChange('grade_level', v)}>
              <SelectTrigger className='h-10 w-full'>
                <SelectValue placeholder='Semua Tingkat' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Semua Tingkat</SelectItem>
                {gradeLevels.map((g) => (
                  <SelectItem key={g.grade_level_id} value={g.value}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.major} onValueChange={(v) => handleFilterChange('major', v)}>
              <SelectTrigger className='h-10 w-full'>
                <SelectValue placeholder='Semua Jurusan' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Semua Jurusan</SelectItem>
                {majors.map((m) => (
                  <SelectItem key={m.major_id} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </FilterPanel>

        {/* ═══════ ACTIVITIES GRID ═══════ */}
        {loading ? (
          <SkeletonGrid />
        ) : displayedActivities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className='text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200'
          >
            <div className='w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-4 shadow-sm'>
              <ShieldAlert className='w-10 h-10 text-emerald-600' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900'>Semua peserta aman</h3>
            <p className='mt-2 text-sm text-gray-600 max-w-md mx-auto'>
              {activeFilterCount > 0
                ? 'Tidak ada aktivitas terblokir yang cocok dengan filter Anda.'
                : 'Saat ini tidak ada peserta ujian yang terblokir oleh sistem anti-cheat.'}
            </p>
            {activeFilterCount > 0 && (
              <Button onClick={handleResetFilters} variant='outline' size='sm' className='mt-4'>
                <X className='w-3.5 h-3.5 mr-1' /> Reset Filter
              </Button>
            )}
          </motion.div>
        ) : (
          <StaggerList className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
            {displayedActivities.map((activity) => {
              const severity = getSeverity(activity.participant_count || 0);
              return (
                <StaggerItem key={activity.exam_id}>
                  <AnimatedCard
                    className='cursor-pointer overflow-hidden border-0 py-0 gap-0 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow group'
                    onClick={() => handleCardClick(activity.exam_id)}
                  >
                    {/* Gradient header */}
                    <div className={`bg-gradient-to-br ${severity.headerClass} text-white p-4 relative overflow-hidden`}>
                      <div className='absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl' />
                      <div className='absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-black/10 blur-2xl' />

                      <div className='relative flex items-start justify-between gap-2'>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/80 mb-1'>
                            <AlertTriangle className='w-3 h-3' />
                            Severity {severity.label}
                          </div>
                          <h3 className='font-bold text-base leading-tight line-clamp-2'>{activity.exam_name}</h3>
                          <p className='text-xs text-white/85 mt-1 flex items-center gap-1'>
                            <BookOpen className='w-3 h-3' />
                            {activity.subject}
                          </p>
                        </div>
                        <ChevronRight className='w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform' />
                      </div>

                      {/* Big peserta count */}
                      <div className='relative mt-3 flex items-end gap-2'>
                        <span className='text-4xl font-bold leading-none'>
                          <CountUp value={activity.participant_count} />
                        </span>
                        <span className='text-xs text-white/85 mb-1'>peserta diblokir</span>
                      </div>
                    </div>

                    {/* Meta strip */}
                    <CardContent className='p-4 space-y-3'>
                      <div className='flex gap-2 flex-wrap'>
                        <Badge variant='outline' className='text-[11px] gap-1'>
                          <GraduationCap className='w-3 h-3' />
                          {activity.grade_level || '-'}
                        </Badge>
                        <Badge variant='outline' className='text-[11px] gap-1'>
                          <Layers className='w-3 h-3' />
                          {activity.major || '-'}
                        </Badge>
                      </div>

                      <div className='space-y-1.5 text-[11px] text-gray-600 pt-2 border-t'>
                        <div className='flex items-center gap-2'>
                          <Calendar className='w-3 h-3 text-gray-400' />
                          <span className='text-gray-500'>Mulai:</span>
                          <span className='font-medium text-gray-800'>{formatDateShort(activity.start_date)}</span>
                          <Clock className='w-3 h-3 text-gray-400 ml-1' />
                          <span className='font-mono text-gray-700'>{formatTime(activity.start_date)}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Calendar className='w-3 h-3 text-gray-400' />
                          <span className='text-gray-500'>Selesai:</span>
                          <span className='font-medium text-gray-800'>{formatDateShort(activity.end_date)}</span>
                          <Clock className='w-3 h-3 text-gray-400 ml-1' />
                          <span className='font-mono text-gray-700'>{formatTime(activity.end_date)}</span>
                        </div>
                      </div>

                      <Button
                        variant='ghost'
                        size='sm'
                        className='w-full justify-between text-xs font-medium text-gray-700 hover:bg-gray-50 -mb-1'
                      >
                        Kelola Unlock Code
                        <ChevronRight className='w-3.5 h-3.5' />
                      </Button>
                    </CardContent>
                  </AnimatedCard>
                </StaggerItem>
              );
            })}
          </StaggerList>
        )}
      </div>
    </AdminLayout>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────
function StatCard({ value, label, icon, gradient, pulse = false, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm p-4`}
    >
      <div className='absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/15 blur-2xl' />
      <div className='relative flex items-start justify-between gap-2'>
        <div className='flex-1 min-w-0'>
          <h3 className='text-3xl font-bold leading-none'>
            <CountUp value={value} />
          </h3>
          <p className='text-[11px] text-white/85 mt-1.5 leading-tight'>{label}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0 ${pulse ? 'animate-pulse' : ''}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className='bg-white rounded-2xl shadow-sm overflow-hidden border'
        >
          <div className='h-28 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse' />
          <div className='p-4 space-y-3'>
            <div className='flex gap-2'>
              <div className='h-5 w-16 rounded-full bg-gray-200 animate-pulse' />
              <div className='h-5 w-16 rounded-full bg-gray-200 animate-pulse' />
            </div>
            <div className='space-y-1.5 pt-2 border-t'>
              <div className='h-3 bg-gray-200 rounded animate-pulse w-3/4' />
              <div className='h-3 bg-gray-200 rounded animate-pulse w-2/3' />
            </div>
            <div className='h-8 bg-gray-100 rounded animate-pulse' />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
