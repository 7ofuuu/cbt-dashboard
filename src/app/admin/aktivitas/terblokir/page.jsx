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
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Home, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import request from '@/utils/request';
import toast from 'react-hot-toast';

export default function AktivitasTerblokirPage() {
  useAuth(['admin']);
  
  const router = useRouter();
  const [filters, setFilters] = useState({
    search: '',
    jurusan: 'all',
    tingkat: 'all',
  });

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlockedActivities();
  }, []);

  const fetchBlockedActivities = async () => {
    try {
      setLoading(true);
      // Get activities with BLOCKED status filter
      const params = new URLSearchParams();
      params.append('status', 'BLOCKED');
      
      const response = await request.get(`/admin/activities?${params.toString()}`);
      
      if (response.data && response.data.success) {
        setActivities(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching blocked activities:', error);
      toast.error('Gagal mengambil data aktivitas terblokir');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRefresh = () => {
    fetchBlockedActivities();
  };

  const filteredActivities = () => {
    let result = [...activities];

    // Search filter
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(a => 
        a.nama_ujian?.toLowerCase().includes(q) ||
        a.mata_pelajaran?.toLowerCase().includes(q) ||
        a.tingkat?.toLowerCase().includes(q) ||
        a.jurusan?.toLowerCase().includes(q)
      );
    }

    // Jurusan filter
    if (filters.jurusan !== 'all') {
      result = result.filter(a => a.jurusan === filters.jurusan);
    }

    // Tingkat filter
    if (filters.tingkat !== 'all') {
      result = result.filter(a => a.tingkat === filters.tingkat);
    }

    return result;
  };

  const handleCardClick = (ujianId) => {
    router.push(`/admin/aktivitas/detail/${ujianId}`);
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

  const displayedActivities = filteredActivities();

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
            <BreadcrumbLink href='/admin/aktivitas'>
              Aktivitas
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Terblokir</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Aktivitas Terblokir</h1>
            <p className="text-gray-600 mt-1">Daftar peserta ujian yang sedang terblokir</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Cari ujian, mata pelajaran, tingkat, atau jurusan..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Jurusan Filter */}
          <Select value={filters.jurusan} onValueChange={(value) => handleFilterChange('jurusan', value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Semua Jurusan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jurusan</SelectItem>
              <SelectItem value="IPA">IPA</SelectItem>
              <SelectItem value="IPS">IPS</SelectItem>
            </SelectContent>
          </Select>

          {/* Tingkat Filter */}
          <Select value={filters.tingkat} onValueChange={(value) => handleFilterChange('tingkat', value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Semua Tingkat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tingkat</SelectItem>
              <SelectItem value="X">Kelas X</SelectItem>
              <SelectItem value="XI">Kelas XI</SelectItem>
              <SelectItem value="XII">Kelas XII</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activities Grid */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 mx-auto text-gray-400 animate-spin" />
            <p className="mt-4 text-gray-600">Memuat data...</p>
          </div>
        ) : displayedActivities.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
            <AlertTriangle className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Tidak ada aktivitas terblokir</h3>
            <p className="mt-2 text-gray-600">Tidak ada peserta yang sedang terblokir saat ini</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedActivities.map((activity) => (
              <Card 
                key={activity.ujian_id}
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => handleCardClick(activity.ujian_id)}
              >
                <CardContent className="p-6">
                  {/* Header with Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                        {activity.nama_ujian}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{activity.mata_pelajaran}</p>
                    </div>
                    <Badge variant="destructive" className="ml-2">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {activity.peserta_terblokir || 0}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Tingkat:</span>
                      <span className="font-medium">{activity.tingkat}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Jurusan:</span>
                      <span className="font-medium">{activity.jurusan}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Peserta:</span>
                      <span className="font-medium">{activity.total_peserta}</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                    <div>Mulai: {formatDate(activity.tanggal_mulai)}</div>
                    <div>Selesai: {formatDate(activity.tanggal_selesai)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
