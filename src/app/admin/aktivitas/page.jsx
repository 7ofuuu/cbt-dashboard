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
import { useAuth } from '@/hooks/useAuth';
import request from '@/utils/request';
import toast from 'react-hot-toast';

export default function AktivitasPage() {
  useAuth(['admin']);
  
  const router = useRouter();
  const [filters, setFilters] = useState({
    jenis: 'all',
    jurusan: 'all',
    kelas: 'all',
    status: 'all',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const totalPages = 10;

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
      if (filters.kelas && filters.kelas !== 'all') {
        params.append('kelas', filters.kelas);
      }
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }

      const response = await request.get(`/api/admin/activities?${params.toString()}`);
      
      if (response.data.success) {
        setActivities(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Gagal mengambil data aktivitas');
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

  const handleCardClick = (ujianId) => {
    router.push(`/admin/aktivitas/detail/${ujianId}`);
  };

  const getCardColor = (jenisUjian) => {
    const colors = {
      'Ujian Akhir Semester': 'bg-blue-500',
      'Ujian Tengah Semester': 'bg-orange-500',
      'Ujian Harian': 'bg-purple-500',
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
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Aktivitas</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Select value={filters.jurusan} onValueChange={(value) => handleFilterChange('jurusan', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Jurusan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jurusan</SelectItem>
              <SelectItem value="IPA">IPA</SelectItem>
              <SelectItem value="IPS">IPS</SelectItem>
              <SelectItem value="Bahasa">Bahasa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={filters.kelas} onValueChange={(value) => handleFilterChange('kelas', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              <SelectItem value="X">Kelas X</SelectItem>
              <SelectItem value="XI">Kelas XI</SelectItem>
              <SelectItem value="XII">Kelas XII</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="ON_PROGRESS">On Progress</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Activities Grid */}
      {loading ? (
        <div className="col-span-full text-center py-12 text-gray-500">
          <p className="text-lg">Memuat data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <p className="text-lg">Belum ada aktivitas ujian</p>
            </div>
          ) : (
            activities.map(activity => (
              <Card 
                key={activity.ujian_id} 
                className={`${getCardColor(activity.jenis_ujian)} text-white hover:shadow-lg transition-shadow cursor-pointer`}
                onClick={() => handleCardClick(activity.ujian_id)}
              >
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-1">{activity.jenis_ujian}</h3>
                  <div className="space-y-1 text-sm mt-4">
                    <p><span className="font-medium">Mapel :</span> {activity.mata_pelajaran}</p>
                    <p><span className="font-medium">Jurusan/Tingkat :</span> {activity.tingkat} - {activity.jurusan || 'Umum'}</p>
                    <p><span className="font-medium">Peserta :</span> {activity.peserta_count}</p>
                    <p><span className="font-medium">Status :</span> {activity.status}</p>
                    <p><span className="font-medium">Dimulai pada :</span> {formatDate(activity.tanggal_mulai)}</p>
                    <p><span className="font-medium">Berakhir pada :</span> {formatDate(activity.tanggal_selesai)}</p>
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
