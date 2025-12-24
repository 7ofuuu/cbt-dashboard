'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../../adminLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import request from '@/utils/request';
import toast from 'react-hot-toast';

export default function DetailAktivitasPage({ params }) {
  useAuth(['admin']);
  
  const router = useRouter();
  const { ujianId } = params;
  
  const [filters, setFilters] = useState({
    jurusan: 'all',
    kelas: 'all',
    status: 'all',
  });

  const [ujianData, setUjianData] = useState(null);
  const [pesertaData, setPesertaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10;

  useEffect(() => {
    if (ujianId) {
      fetchParticipants();
    }
  }, [ujianId, filters]);

  const fetchParticipants = async () => {
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

      const response = await request.get(`/api/admin/activities/${ujianId}/participants?${params.toString()}`);
      
      if (response.data.success) {
        setUjianData(response.data.data.ujian);
        setPesertaData(response.data.data.peserta);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast.error('Gagal mengambil data peserta');
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

  const handleRowClick = (pesertaUjianId, status) => {
    if (status === 'Blocked') {
      router.push(`/admin/aktivitas/terblokir/${pesertaUjianId}`);
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      'On Progress': 'bg-yellow-100 text-yellow-800',
      'Submitted': 'bg-green-100 text-green-800',
      'Blocked': 'bg-red-100 text-red-800',
      'Belum Mulai': 'bg-gray-100 text-gray-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
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
            <BreadcrumbLink href='/admin/aktivitas'>Aktivitas</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Detail</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Aktivitas &gt; Detail
        </h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <SelectItem value="01">01</SelectItem>
                <SelectItem value="02">02</SelectItem>
                <SelectItem value="03">03</SelectItem>
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

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Memuat data...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#1e3a5f] text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Tingkat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Kelas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Mata Pelajaran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pesertaData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                        Tidak ada data peserta
                      </td>
                    </tr>
                  ) : (
                    pesertaData.map((peserta) => (
                      <tr 
                        key={peserta.peserta_ujian_id}
                        onClick={() => handleRowClick(peserta.peserta_ujian_id, peserta.status)}
                        className={`${peserta.status === 'Blocked' ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {peserta.nama}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {peserta.tingkat}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {peserta.kelas}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {peserta.mata_pelajaran}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(peserta.status)}`}>
                            {peserta.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-center border-t border-gray-200">
              <div className="flex items-center gap-4">
                <button 
                  className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  &lt;
                </button>
                <span className="text-gray-600">
                  {currentPage} dari {totalPages}
                </span>
                <button 
                  className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
