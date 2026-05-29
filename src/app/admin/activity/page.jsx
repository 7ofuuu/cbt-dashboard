'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../adminLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Home, Search, X, RefreshCw, Filter } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import request from '@/utils/request';
import toast from 'react-hot-toast';
import { StaggerList, StaggerItem } from '@/components/motion/stagger-list';
import { AnimatePresence, motion } from 'framer-motion';

export default function AktivitasPage() {
  useAuth(['admin']);

  const router = useRouter();
  const [filters, setFilters] = useState({
    search: '',
    jenisUjian: 'all',
    mataPelajaran: 'all',
    major: 'all',
    grade_level: 'all',
    status: 'all',
    sortBy: 'terbaru',
  });

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uniqueMapel, setUniqueMapel] = useState([]);
  const [uniqueJenisUjian, setUniqueJenisUjian] = useState([]);
  const [uniqueTingkat, setUniqueTingkat] = useState([]);
  const [uniqueJurusan, setUniqueJurusan] = useState([]);

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch once on mount

  const fetchActivities = async () => {
    try {
      setLoading(true);
      // Fetch all data without backend filters - all filtering done on frontend
      const response = await request.get(`/admin/activities`);

      if (response.data.success) {
        const data = response.data.data;
        setActivities(data);

        // Extract unique values for all dynamic filters
        // Use Set to accumulate values (keep existing + add new ones)
        const mapelSet = new Set([...uniqueMapel, ...data.map(a => a.subject)]);
        setUniqueMapel(Array.from(mapelSet).sort());

        const jenisUjianSet = new Set([...uniqueJenisUjian, ...data.map(a => a.exam_type)]);
        setUniqueJenisUjian(Array.from(jenisUjianSet).sort());

        const tingkatSet = new Set([...uniqueTingkat, ...data.map(a => a.grade_level)]);
        setUniqueTingkat(Array.from(tingkatSet).sort());

        const jurusanSet = new Set([...uniqueJurusan, ...data.map(a => a.major).filter(Boolean)]);
        setUniqueJurusan(Array.from(jurusanSet).sort());
      }
    } catch (error) {
      // Only show toast if it's not a 404 or network error on initial load
      if (error.response && error.response.status !== 404) {
        const errorMsg = error.response?.data?.message || 'Gagal mengambil data aktivitas';
        toast.error(errorMsg);
      }
      setActivities([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      jenisUjian: 'all',
      mataPelajaran: 'all',
      major: 'all',
      grade_level: 'all',
      status: 'all',
      sortBy: 'terbaru',
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.jenisUjian !== 'all') count++;
    if (filters.mataPelajaran !== 'all') count++;
    if (filters.major !== 'all') count++;
    if (filters.grade_level !== 'all') count++;
    if (filters.status !== 'all') count++;
    return count;
  };

  const filteredAndSortedActivities = () => {
    let result = [...activities];

    // Search filter
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(a =>
        a.exam_type?.toLowerCase().includes(q) ||
        a.subject?.toLowerCase().includes(q) ||
        a.grade_level?.toLowerCase().includes(q) ||
        a.major?.toLowerCase().includes(q)
      );
    }

    // Jenis Ujian filter
    if (filters.jenisUjian !== 'all') {
      result = result.filter(a => a.exam_type === filters.jenisUjian);
    }

    // Mata Pelajaran filter
    if (filters.mataPelajaran !== 'all') {
      result = result.filter(a => a.subject === filters.mataPelajaran);
    }

    // Jurusan filter
    if (filters.major !== 'all') {
      result = result.filter(a => a.major === filters.major);
    }

    // Tingkat filter
    if (filters.grade_level !== 'all') {
      result = result.filter(a => a.grade_level === filters.grade_level);
    }

    // Status filter - based on exam status
    if (filters.status !== 'all') {
      result = result.filter(a => {
        const now = new Date();
        const mulai = new Date(a.start_date);
        const selesai = new Date(a.end_date);
        
        if (filters.status === 'NOT_STARTED') {
          return now < mulai;
        } else if (filters.status === 'SEDANG_BERLANGSUNG') {
          return now >= mulai && now <= selesai;
        } else if (filters.status === 'COMPLETED') {
          return now > selesai;
        }
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'terbaru':
          return new Date(b.start_date) - new Date(a.start_date);
        case 'terlama':
          return new Date(a.start_date) - new Date(b.start_date);
        case 'peserta-terbanyak':
          return (b.participant_count || 0) - (a.participant_count || 0);
        case 'peserta-tersedikit':
          return (a.participant_count || 0) - (b.participant_count || 0);
        default:
          return 0;
      }
    });

    return result;
  };

  const handleCardClick = (ujianId) => {
    router.push(`/admin/activity/detail/${ujianId}`);
  };

  const getCardColor = (jenisUjian) => {
    const colors = {
      'Ujian Akhir Semester': 'bg-blue-500',
      'Ujian Tengah Semester': 'bg-orange-500',
    };
    return colors[jenisUjian] || 'bg-blue-500';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <AdminLayout>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/admin/dashboard'>
              <Home className='w-4 h-4' />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Aktivitas</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-6">
        <PageHeader
          title="Aktivitas Ujian"
          description="Monitor dan kelola semua aktivitas ujian yang sedang berlangsung"
        >
          <Button
            onClick={fetchActivities}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className='w-4 h-4' /> Segarkan
          </Button>
        </PageHeader>

        {/* Filter & Search card */}
        <div className="bg-white border rounded-lg shadow-sm p-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>Filter & Pencarian</span>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] h-5">
                {getActiveFilterCount()} aktif
              </Badge>
            )}
            <div className="flex-1" />
            {getActiveFilterCount() > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={handleResetFilters}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari ujian, mapel, tingkat, jurusan..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 h-10 w-full"
              />
            </div>

            <Select value={filters.jenisUjian} onValueChange={(v) => handleFilterChange('jenisUjian', v)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Jenis Ujian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis Ujian</SelectItem>
                {uniqueJenisUjian.map((jenis) => (
                  <SelectItem key={jenis} value={jenis}>{jenis}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.mataPelajaran} onValueChange={(v) => handleFilterChange('mataPelajaran', v)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Mata Pelajaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mapel</SelectItem>
                {uniqueMapel.map((mapel) => (
                  <SelectItem key={mapel} value={mapel}>{mapel}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.grade_level} onValueChange={(v) => handleFilterChange('grade_level', v)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Tingkat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tingkat</SelectItem>
                {uniqueTingkat.map((g) => (
                  <SelectItem key={g} value={g}>Kelas {g}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.major} onValueChange={(v) => handleFilterChange('major', v)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Jurusan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jurusan</SelectItem>
                {uniqueJurusan.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="NOT_STARTED">Belum Mulai</SelectItem>
                <SelectItem value="SEDANG_BERLANGSUNG">Sedang Berlangsung</SelectItem>
                <SelectItem value="COMPLETED">Selesai</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.sortBy} onValueChange={(v) => handleFilterChange('sortBy', v)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="terbaru">Terbaru</SelectItem>
                <SelectItem value="terlama">Terlama</SelectItem>
                <SelectItem value="peserta-terbanyak">Peserta Terbanyak</SelectItem>
                <SelectItem value="peserta-tersedikit">Peserta Tersedikit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Activities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="rounded-lg bg-white shadow-sm border overflow-hidden"
              >
                <div className="h-16 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="flex justify-between"><div className="h-3 w-16 bg-gray-200 rounded animate-pulse" /><div className="h-3 w-20 bg-gray-200 rounded animate-pulse" /></div>
                  <div className="flex justify-between"><div className="h-3 w-24 bg-gray-200 rounded animate-pulse" /><div className="h-3 w-16 bg-gray-200 rounded animate-pulse" /></div>
                  <div className="flex justify-between"><div className="h-3 w-16 bg-gray-200 rounded animate-pulse" /><div className="h-3 w-8 bg-gray-200 rounded animate-pulse" /></div>
                  <div className="h-3 w-32 bg-gray-100 rounded animate-pulse mt-2" />
                  <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : filteredAndSortedActivities().length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-gray-500"
          >
            <p className="text-lg">
              {activities.length === 0 ? 'Belum ada aktivitas ujian' : 'Tidak ada hasil yang sesuai dengan filter'}
            </p>
          </motion.div>
        ) : (
          <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedActivities().map(activity => (
                <StaggerItem key={activity.exam_id}>
                  <Card
                    className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden border h-full"
                    onClick={() => handleCardClick(activity.exam_id)}
                  >
                    <div className={`${getCardColor(activity.exam_type)} text-white p-4`}>
                      <h3 className="text-xl font-semibold">{activity.exam_name}</h3>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex justify-between border-b py-1">
                          <span className="font-medium">Mapel:</span>
                          <span>{activity.subject}</span>
                        </div>
                        <div className="flex justify-between border-b py-1">
                          <span className="font-medium">Tingkat/Jurusan:</span>
                          <span>{activity.grade_level} - {activity.major || 'Umum'}</span>
                        </div>
                        <div className="flex justify-between border-b py-1">
                          <span className="font-medium">Peserta:</span>
                          <span>{activity.participant_count}</span>
                        </div>
                        <div className="flex justify-between border-b py-1">
                          <span className="font-medium">Status:</span>
                          <span>{activity.status}</span>
                        </div>
                        <div className="flex flex-col mt-2">
                          <span className="font-medium text-xs text-gray-400 uppercase">Mulai:</span>
                          <span>{formatDate(activity.start_date)}</span>
                        </div>
                        <div className="flex flex-col mt-1">
                          <span className="font-medium text-xs text-gray-400 uppercase">Selesai:</span>
                          <span>{formatDate(activity.end_date)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </AnimatePresence>
          </StaggerList>
        )}

        {/* Results Counter */}
        {!loading && filteredAndSortedActivities().length > 0 && (
          <div className="text-center py-4 text-gray-600">
            Menampilkan {filteredAndSortedActivities().length} dari {activities.length} ujian
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
