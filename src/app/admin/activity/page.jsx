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
import { Home, Search, X, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import request from '@/utils/request';
import toast from 'react-hot-toast';

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

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Cari ujian, mata pelajaran, tingkat, atau jurusan..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10 pr-4"
          />
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={filters.jenisUjian} onValueChange={(value) => handleFilterChange('jenisUjian', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Jenis Ujian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis Ujian</SelectItem>
                {uniqueJenisUjian.map(jenis => (
                  <SelectItem key={jenis} value={jenis}>{jenis}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.mataPelajaran} onValueChange={(value) => handleFilterChange('mataPelajaran', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Mata Pelajaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mata Pelajaran</SelectItem>
                {uniqueMapel.map(mapel => (
                  <SelectItem key={mapel} value={mapel}>{mapel}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.grade_level} onValueChange={(value) => handleFilterChange('grade_level', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tingkat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tingkat</SelectItem>
                {uniqueTingkat.map(grade_level => (
                  <SelectItem key={grade_level} value={grade_level}>Kelas {grade_level}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.major} onValueChange={(value) => handleFilterChange('major', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Jurusan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jurusan</SelectItem>
                {uniqueJurusan.map(major => (
                  <SelectItem key={major} value={major}>{major}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="NOT_STARTED">Belum Mulai</SelectItem>
                <SelectItem value="SEDANG_BERLANGSUNG">Sedang Berlangsung</SelectItem>
                <SelectItem value="COMPLETED">Selesai</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
              <SelectTrigger className="w-full">
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

          {/* Active Filters Badge and Reset Button */}
          {getActiveFilterCount() > 0 && (
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="flex items-center gap-1">
                {getActiveFilterCount()} Filter Aktif
              </Badge>
              <Button
                onClick={handleResetFilters}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <X className="w-4 h-4" /> Reset Filter
              </Button>
            </div>
          )}
        </div>

        {/* Activities Grid */}
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p className="text-lg">Memuat data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedActivities().length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <p className="text-lg">
                  {activities.length === 0 ? 'Belum ada aktivitas ujian' : 'Tidak ada hasil yang sesuai dengan filter'}
                </p>
              </div>
            ) : (
              filteredAndSortedActivities().map(activity => (
                <Card
                  key={activity.exam_id}
                  className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden border"
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
              ))
            )}
          </div>
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
