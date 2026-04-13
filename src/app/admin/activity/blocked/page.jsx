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
import { PageHeader } from '@/components/ui/page-header';
import { Home, Search, RefreshCw, AlertTriangle, ShieldAlert, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import request from '@/utils/request';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { StaggerList, StaggerItem } from '@/components/motion/stagger-list';
import { AnimatedCard } from '@/components/motion/animated-card';
import { CountUp } from '@/components/motion/count-up';

export default function AktivitasTerblokirPage() {
  useAuth(['admin']);
  
  const router = useRouter();
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
      // Get activities with BLOCKED status filter
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
        a.exam_name?.toLowerCase().includes(q) ||
        a.subject?.toLowerCase().includes(q) ||
        a.grade_level?.toLowerCase().includes(q) ||
        a.major?.toLowerCase().includes(q)
      );
    }

    // Jurusan filter
    if (filters.major !== 'all') {
      result = result.filter(a => a.major === filters.major);
    }

    // Tingkat filter
    if (filters.grade_level !== 'all') {
      result = result.filter(a => a.grade_level === filters.grade_level);
    }

    return result;
  };

  const handleCardClick = (ujianId) => {
    router.push(`/admin/activity/detail/${ujianId}`);
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
  const totalBlocked = displayedActivities.reduce((acc, a) => acc + (a.participant_count || 0), 0);

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
            <BreadcrumbLink href='/admin/activity'>
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
        <PageHeader
          title="Aktivitas Terblokir"
          description="Daftar ujian yang memiliki peserta terblokir — klik kartu untuk mengelola unlock code"
        >
          <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Segarkan
          </Button>
        </PageHeader>

        {/* Summary Stats */}
        {!loading && (
          <StaggerList className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StaggerItem>
              <AnimatedCard className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1"><CountUp value={displayedActivities.length} /></h3>
                    <p className="text-sm text-gray-500">Ujian dengan Peserta Terblokir</p>
                  </div>
                  <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
                    {displayedActivities.length > 0 ? (
                      <motion.div
                        animate={{ scale: [1, 1.12, 1] }}
                        transition={{ duration: 1.6, repeat: Infinity }}
                      >
                        <ShieldAlert className="w-7 h-7 text-red-500" />
                      </motion.div>
                    ) : (
                      <ShieldAlert className="w-7 h-7 text-red-500" />
                    )}
                  </div>
                </div>
              </AnimatedCard>
            </StaggerItem>
            <StaggerItem>
              <AnimatedCard className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1"><CountUp value={totalBlocked} /></h3>
                    <p className="text-sm text-gray-500">Total Peserta Terdampak</p>
                  </div>
                  <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center">
                    <Users className="w-7 h-7 text-orange-500" />
                  </div>
                </div>
              </AnimatedCard>
            </StaggerItem>
          </StaggerList>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
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

          <Select value={filters.major} onValueChange={(value) => handleFilterChange('major', value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Semua Jurusan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jurusan</SelectItem>
              <SelectItem value="IPA">IPA</SelectItem>
              <SelectItem value="IPS">IPS</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.grade_level} onValueChange={(value) => handleFilterChange('grade_level', value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Tidak ada aktivitas terblokir</h3>
            <p className="mt-2 text-gray-600">Semua peserta ujian dalam kondisi normal saat ini</p>
          </div>
        ) : (
          <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedActivities.map((activity) => (
              <StaggerItem key={activity.exam_id}>
              <AnimatedCard
                className="cursor-pointer overflow-hidden border py-0 gap-0 bg-card text-card-foreground rounded-xl shadow-sm"
                onClick={() => handleCardClick(activity.exam_id)}
              >
                <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg line-clamp-2">{activity.exam_name}</h3>
                      <p className="text-sm text-white/90 mt-0.5 truncate">{activity.subject}</p>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/25 flex-shrink-0">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Terblokir
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b py-1">
                      <span className="font-medium text-gray-600">Tingkat:</span>
                      <span>{activity.grade_level}</span>
                    </div>
                    <div className="flex justify-between border-b py-1">
                      <span className="font-medium text-gray-600">Jurusan:</span>
                      <span>{activity.major || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b py-1">
                      <span className="font-medium text-gray-600">Peserta Terblokir:</span>
                      <span className="font-semibold text-red-600">{activity.participant_count}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t text-xs text-gray-500 space-y-1">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-400 uppercase">Mulai</span>
                      <span>{formatDate(activity.start_date)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-400 uppercase">Selesai</span>
                      <span>{formatDate(activity.end_date)}</span>
                    </div>
                  </div>
                </CardContent>
              </AnimatedCard>
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </div>
    </AdminLayout>
  );
}
