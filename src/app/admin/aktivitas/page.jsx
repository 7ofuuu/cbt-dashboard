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
    jurusan: 'all',
    tingkat: 'all',
    status: 'all',
    tanggal: 'all',
    sortBy: 'terbaru',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const totalPages = 10;
  const [uniqueMapel, setUniqueMapel] = useState([]);

  useEffect(() => {
    fetchActivities();
  }, [filters]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.jurusan && filters.jurusan !== 'all') {
        params.append('jurusan', filters.jurusan);
      }
      if (filters.tingkat && filters.tingkat !== 'all') {
        params.append('tingkat', filters.tingkat);
      }
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }

      const response = await request.get(`/admin/activities?${params.toString()}`);
      
      if (response.data.success) {
        const data = response.data.data;
        setActivities(data);
        
        // Extract unique mata pelajaran
        const mapelSet = new Set(data.map(a => a.mata_pelajaran));
        setUniqueMapel(Array.from(mapelSet).sort());
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
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
      jurusan: 'all',
      tingkat: 'all',
      status: 'all',
      tanggal: 'all',
      sortBy: 'terbaru',
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.jenisUjian !== 'all') count++;
    if (filters.mataPelajaran !== 'all') count++;
    if (filters.jurusan !== 'all') count++;
    if (filters.tingkat !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.tanggal !== 'all') count++;
    return count;
  };

  const filteredAndSortedActivities = () => {
    let result = [...activities];

    // Search filter
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(a => 
        a.jenis_ujian?.toLowerCase().includes(q) ||
        a.mata_pelajaran?.toLowerCase().includes(q) ||
        a.tingkat?.toLowerCase().includes(q) ||
        a.jurusan?.toLowerCase().includes(q)
      );
    }

    // Jenis Ujian filter
    if (filters.jenisUjian !== 'all') {
      result = result.filter(a => a.jenis_ujian === filters.jenisUjian);
    }

    // Mata Pelajaran filter
    if (filters.mataPelajaran !== 'all') {
      result = result.filter(a => a.mata_pelajaran === filters.mataPelajaran);
    }

    // Tanggal filter
    if (filters.tanggal !== 'all') {
      const now = new Date();
      result = result.filter(a => {
        const mulai = new Date(a.tanggal_mulai);
        const selesai = new Date(a.tanggal_selesai);
        
        switch (filters.tanggal) {
          case 'berlangsung':
            return now >= mulai && now <= selesai;
          case 'akan-datang':
            return now < mulai;
          case 'selesai':
            return now > selesai;
          default:
            return true;
        }
      });
    }

    // Sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'terbaru':
          return new Date(b.tanggal_mulai) - new Date(a.tanggal_mulai);
        case 'terlama':
          return new Date(a.tanggal_mulai) - new Date(b.tanggal_mulai);
        case 'peserta-terbanyak':
          return (b.peserta_count || 0) - (a.peserta_count || 0);
        case 'peserta-tersedikit':
          return (a.peserta_count || 0) - (b.peserta_count || 0);
        default:
          return 0;
      }
    });

    return result;
  };

  const handleCardClick = (ujianId) => {
    router.push(`/admin/aktivitas/detail/${ujianId}`);
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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Aktivitas</h2>
          <Button
            onClick={fetchActivities}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className='w-4 h-4' /> Segarkan
          </Button>
        </div>

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
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="Ujian Akhir Semester">Ujian Akhir Semester</SelectItem>
                <SelectItem value="Ujian Tengah Semester">Ujian Tengah Semester</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.mataPelajaran} onValueChange={(value) => handleFilterChange('mataPelajaran', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Mata Pelajaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mapel</SelectItem>
                {uniqueMapel.map(mapel => (
                  <SelectItem key={mapel} value={mapel}>{mapel}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.tingkat} onValueChange={(value) => handleFilterChange('tingkat', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tingkat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tingkat</SelectItem>
                <SelectItem value="X">Kelas X</SelectItem>
                <SelectItem value="XI">Kelas XI</SelectItem>
                <SelectItem value="XII">Kelas XII</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.jurusan} onValueChange={(value) => handleFilterChange('jurusan', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Jurusan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jurusan</SelectItem>
                <SelectItem value="IPA">IPA</SelectItem>
                <SelectItem value="IPS">IPS</SelectItem>
                <SelectItem value="Bahasa">Bahasa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="ON_PROGRESS">On Progress</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.tanggal} onValueChange={(value) => handleFilterChange('tanggal', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Waktu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Waktu</SelectItem>
                <SelectItem value="berlangsung">Sedang Berlangsung</SelectItem>
                <SelectItem value="akan-datang">Akan Datang</SelectItem>
                <SelectItem value="selesai">Sudah Selesai</SelectItem>
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

            <div className="lg:col-span-1"></div>
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
                key={activity.ujian_id} 
                className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden border"
                onClick={() => handleCardClick(activity.ujian_id)}
              >
                <div className={`${getCardColor(activity.jenis_ujian)} text-white p-4`}>
                  <h3 className="text-xl font-semibold">{activity.jenis_ujian}</h3>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between border-b py-1">
                      <span className="font-medium">Mapel:</span>
                      <span>{activity.mata_pelajaran}</span>
                    </div>
                    <div className="flex justify-between border-b py-1">
                      <span className="font-medium">Tingkat/Jurusan:</span>
                      <span>{activity.tingkat} - {activity.jurusan || 'Umum'}</span>
                    </div>
                    <div className="flex justify-between border-b py-1">
                      <span className="font-medium">Peserta:</span>
                      <span>{activity.peserta_count}</span>
                    </div>
                    <div className="flex justify-between border-b py-1">
                      <span className="font-medium">Status:</span>
                      <span>{activity.status}</span>
                    </div>
                    <div className="flex flex-col mt-2">
                      <span className="font-medium text-xs text-gray-400 uppercase">Mulai:</span>
                      <span>{formatDate(activity.tanggal_mulai)}</span>
                    </div>
                    <div className="flex flex-col mt-1">
                      <span className="font-medium text-xs text-gray-400 uppercase">Selesai:</span>
                      <span>{formatDate(activity.tanggal_selesai)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-center items-center gap-4 py-6">
          <button className="text-gray-600 hover:text-gray-900">&lt;</button>
          <span className="text-gray-600">{currentPage} dari {totalPages}</span>
          <button className="text-gray-600 hover:text-gray-900">&gt;</button>
        </div>
      </div>
    </AdminLayout>
  );
}
