'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search } from 'lucide-react';

export default function AktivitasPesertaPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    tingkat: '',
    kelas: '',
    status: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10;

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
    }));
  };

  // Dummy data - kosong untuk sekarang
  const participants = [];

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Selesai':
        return 'bg-green-100 text-green-800';
      case 'Sedang Mengerjakan':
        return 'bg-yellow-100 text-yellow-800';
      case 'Belum Mulai':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">
        <button
          onClick={() => router.push('/admin/aktivitas')}
          className="text-blue-600 hover:text-blue-800 mr-2"
        >
          Aktivitas
        </button>
        › <span>Peserta</span>
      </h2>

      {/* Search Bar */}
      <div className="flex gap-2 bg-white rounded-lg border border-gray-200 p-3">
        <Input
          type="text"
          placeholder="Cari peserta berdasarkan nama, kelas, atau status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 flex-1 focus:outline-none"
        />
        <button className="text-gray-400 hover:text-gray-600 p-2">
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Select value={filters.tingkat} onValueChange={(value) => handleFilterChange('tingkat', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Tingkat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Tingkat</SelectItem>
              <SelectItem value="x">X</SelectItem>
              <SelectItem value="xi">XI</SelectItem>
              <SelectItem value="xii">XII</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={filters.kelas} onValueChange={(value) => handleFilterChange('kelas', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Kelas</SelectItem>
              <SelectItem value="ipa-01">IPA 01</SelectItem>
              <SelectItem value="ips-01">IPS 01</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Status</SelectItem>
              <SelectItem value="selesai">Selesai</SelectItem>
              <SelectItem value="mengerjakan">Sedang Mengerjakan</SelectItem>
              <SelectItem value="belum">Belum Mulai</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Nama</TableHead>
              <TableHead className="font-semibold">Tingkat</TableHead>
              <TableHead className="font-semibold">Kelas</TableHead>
              <TableHead className="font-semibold">Mata Pelajaran</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.length === 0 ? (
              <TableRow>
                <TableCell colSpan="5" className="text-center py-8 text-gray-500">
                  Belum ada peserta. Peserta akan muncul di sini.
                </TableCell>
              </TableRow>
            ) : (
              participants.map(participant => (
                <TableRow
                  key={participant.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/admin/aktivitas/peserta/${participant.id}`)}
                >
                  <TableCell className="font-medium text-gray-900">{participant.nama}</TableCell>
                  <TableCell className="text-gray-600">{participant.tingkat}</TableCell>
                  <TableCell className="text-gray-600">{participant.kelas}</TableCell>
                  <TableCell className="text-gray-600">{participant.mapel}</TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(participant.status)}`}>
                      {participant.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 py-6">
        <button className="text-gray-600 hover:text-gray-900">&lt;</button>
        <span className="text-gray-600">{currentPage} dari {totalPages}</span>
        <button className="text-gray-600 hover:text-gray-900">&gt;</button>
      </div>
    </div>
  );
}
