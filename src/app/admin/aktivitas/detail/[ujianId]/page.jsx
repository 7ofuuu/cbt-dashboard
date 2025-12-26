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
import { use } from 'react';

export default function DetailAktivitasPage({ params }) {
  useAuth(['admin']);
  
  const router = useRouter();
  const { ujianId } = use(params);
  
  const [filters, setFilters] = useState({
    jurusan: 'all',
    tingkat: 'all',
    status: 'all',
  });

  const [ujianData, setUjianData] = useState(null);
  const [pesertaData, setPesertaData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ujianId) {
      fetchUjianDetail();
    }
  }, [ujianId]);

  const fetchUjianDetail = async () => {
    try {
      setLoading(true);
      // Gunakan endpoint admin activities untuk mendapatkan data ujian dan peserta
      const response = await request.get(`/admin/activities/${ujianId}/participants`);
      
      if (response.data && response.data.success) {
        const { ujian, peserta } = response.data.data;
        setUjianData(ujian);
        
        // Transform peserta dari backend ke format tabel
        const formattedPeserta = peserta.map(p => ({
          peserta_ujian_id: p.peserta_ujian_id,
          nama: p.nama,
          tingkat: p.tingkat,
          jurusan: p.jurusan,
          kelas: p.kelas,
          mata_pelajaran: ujian.mata_pelajaran,
          status: p.status,
          status_raw: p.status_ujian,
          is_blocked: p.is_blocked
        }));
        
        setPesertaData(formattedPeserta);
      }
    } catch (error) {
      console.error('Error fetching ujian detail:', error);
      toast.error('Gagal mengambil data ujian');
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

  // Filter peserta data berdasarkan filters
  const filteredPesertaData = pesertaData.filter(peserta => {
    if (filters.jurusan !== 'all' && peserta.jurusan !== filters.jurusan) {
      return false;
    }
    if (filters.tingkat !== 'all' && peserta.tingkat !== filters.tingkat) {
      return false;
    }
    if (filters.status !== 'all') {
      const statusMap = {
        'ON_PROGRESS': 'On Progress',
        'SUBMITTED': 'Submitted',
        'BLOCKED': 'Blocked',
        'BELUM_MULAI': 'Belum Mulai'
      };
      if (peserta.status !== statusMap[filters.status]) {
        return false;
      }
    }
    return true;
  });

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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {ujianData ? ujianData.nama_ujian : 'Detail Ujian'}
          </h2>
          {ujianData && (
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">{ujianData.mata_pelajaran}</span> • 
              <span className="ml-2">Tingkat {ujianData.tingkat}</span>
              {ujianData.jurusan && <span className="ml-2">• {ujianData.jurusan}</span>}
              <span className="ml-2">• {filteredPesertaData.length} Peserta</span>
            </div>
          )}
        </div>

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
            <Select value={filters.tingkat} onValueChange={(value) => handleFilterChange('tingkat', value)}>
              <SelectTrigger>
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
          <div>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="BELUM_MULAI">Belum Mulai</SelectItem>
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
                      Jurusan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Kelas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPesertaData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                        {loading ? 'Memuat data...' : 'Tidak ada data peserta yang sesuai dengan filter'}
                      </td>
                    </tr>
                  ) : (
                    filteredPesertaData.map((peserta) => (
                      <tr 
                        key={peserta.peserta_ujian_id}
                        onClick={() => handleRowClick(peserta.peserta_ujian_id, peserta.status)}
                        className={`${peserta.is_blocked ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {peserta.nama}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {peserta.tingkat}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {peserta.jurusan || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {peserta.kelas}
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

            {/* Total Info */}
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Menampilkan <span className="font-medium">{filteredPesertaData.length}</span> dari <span className="font-medium">{pesertaData.length}</span> peserta
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
