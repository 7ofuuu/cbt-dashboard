'use client';

import { useState } from 'react';
import AdminLayout from '../adminLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

export default function AktivitasPage() {
  const [filters, setFilters] = useState({
    jenis: '',
    jurusan: '',
    kelas: '',
    mapel: '',
    status: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 1;

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
    }));
  };

  // Dummy data - kosong untuk sekarang
  const activities = [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Aktivitas</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <Select value={filters.jenis} onValueChange={(value) => handleFilterChange('jenis', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Jenis Ujian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Jenis Ujian</SelectItem>
              <SelectItem value="harian">Ujian Harian</SelectItem>
              <SelectItem value="tengah">Ujian Tengah Semester</SelectItem>
              <SelectItem value="akhir">Ujian Akhir Semester</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={filters.jurusan} onValueChange={(value) => handleFilterChange('jurusan', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Jurusan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Jurusan</SelectItem>
              <SelectItem value="ipa">IPA</SelectItem>
              <SelectItem value="ips">IPS</SelectItem>
              <SelectItem value="bahasa">Bahasa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={filters.kelas} onValueChange={(value) => handleFilterChange('kelas', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Kelas</SelectItem>
              <SelectItem value="x">Kelas X</SelectItem>
              <SelectItem value="xi">Kelas XI</SelectItem>
              <SelectItem value="xii">Kelas XII</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={filters.mapel} onValueChange={(value) => handleFilterChange('mapel', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Mapel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Mapel</SelectItem>
              <SelectItem value="matematika">Matematika</SelectItem>
              <SelectItem value="bahasa">Bahasa Indonesia</SelectItem>
              <SelectItem value="inggris">Bahasa Inggris</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Status</SelectItem>
              <SelectItem value="ongoing">Sedang Berlangsung</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
              <SelectItem value="pending">Akan Datang</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p className="text-lg">Belum ada aktivitas. Aktivitas akan muncul di sini.</p>
          </div>
        ) : (
          activities.map(activity => (
            <Card key={activity.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">{activity.title}</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600"><span className="font-medium">Jenis:</span> {activity.jenis}</p>
                  <p className="text-gray-600"><span className="font-medium">Jurusan:</span> {activity.jurusan}</p>
                  <p className="text-gray-600"><span className="font-medium">Kelas:</span> {activity.kelas}</p>
                  <p className="text-gray-600"><span className="font-medium">Mapel:</span> {activity.mapel}</p>
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-gray-600"><span className="font-medium">Peserta:</span> {activity.selesai}/{activity.peserta}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

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
