'use client';

import AdminLayout from '../adminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { Plus, Search, Home } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export default function SemuaPenggunaPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tingkatFilter, setTingkatFilter] = useState('all');
  const [jurusanFilter, setJurusanFilter] = useState('all');
  const [kelasFilter, setKelasFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
  });
  const itemsPerPage = 10;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, debouncedSearch, tingkatFilter, jurusanFilter, kelasFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('token');

      const params = {
        page: currentPage,
        per_page: itemsPerPage,
      };

      // Add search parameter if not empty
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      // Add filter parameters if not 'all'
      if (tingkatFilter !== 'all') {
        params.tingkat = tingkatFilter;
      }
      if (jurusanFilter !== 'all') {
        params.jurusan = jurusanFilter;
      }
      if (kelasFilter !== 'all') {
        params.kelas = kelasFilter;
      }

      const response = await axios.get(`${process.env.NEXT_PUBLIC_LARAVEL_API}/users/siswas`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('API Response:', response.data);

      if (response.data.success) {
        setUsers(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      console.error('Error details:', err.response?.data);
      setError('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearch, tingkatFilter, jurusanFilter, kelasFilter]);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const totalPages = pagination.last_page;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  return (
    <AdminLayout>
      <Breadcrumb className='mb-4'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/admin/dashboard'>
              <Home className='w-4 h-4' />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Semua Siswa</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className='space-y-6'>
        <PageHeader
          title='Daftar Siswa'
          description='Kelola dan lihat semua pengguna dengan role siswa'
        />

        {/* Search and Filters */}
        <div className='flex flex-col sm:flex-row gap-4'>
          {/* Search Input */}
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
            <Input
              type='text'
              placeholder='Cari Pengguna'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-10 bg-white border-gray-300'
            />
          </div>

          {/* Filter Dropdowns */}
          <Select
            value={tingkatFilter}
            onValueChange={setTingkatFilter}
          >
            <SelectTrigger className='w-full sm:w-[180px] bg-white border-gray-300'>
              <SelectValue placeholder='Semua Tingkat' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Semua Tingkat</SelectItem>
              <SelectItem value='X'>Kelas X</SelectItem>
              <SelectItem value='XI'>Kelas XI</SelectItem>
              <SelectItem value='XII'>Kelas XII</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={jurusanFilter}
            onValueChange={setJurusanFilter}
          >
            <SelectTrigger className='w-full sm:w-[180px] bg-white border-gray-300'>
              <SelectValue placeholder='Semua Jurusan' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Semua Jurusan</SelectItem>
              <SelectItem value='ipa'>IPA</SelectItem>
              <SelectItem value='ips'>IPS</SelectItem>
              <SelectItem value='rpl'>RPL</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={kelasFilter}
            onValueChange={setKelasFilter}
          >
            <SelectTrigger className='w-full sm:w-[180px] bg-white border-gray-300'>
              <SelectValue placeholder='Semua Kelas' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Semua Kelas</SelectItem>
              <SelectItem value='1'>Kelas 1</SelectItem>
              <SelectItem value='2'>Kelas 2</SelectItem>
              <SelectItem value='3'>Kelas 3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow className='bg-[#003366] hover:bg-[#003366]'>
                <TableHead className='text-white font-semibold'>Foto</TableHead>
                <TableHead className='text-white font-semibold'>Username</TableHead>
                <TableHead className='text-white font-semibold'>Nama</TableHead>
                <TableHead className='text-white font-semibold'>Kelas</TableHead>
                <TableHead className='text-white font-semibold'>Tingkat</TableHead>
                <TableHead className='text-white font-semibold'>Jurusan</TableHead>
                <TableHead className='text-white font-semibold'>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-center py-12 text-gray-500'
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-center py-12 text-red-500'
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-center py-12 text-gray-500'
                  >
                    Tidak ada data pengguna ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                users.map(user => (
                  <TableRow
                    key={user.id}
                    className='hover:bg-gray-50 cursor-pointer'
                    onClick={() => router.push(`/admin/detail-pengguna/${user.id}`)}
                  >
                    <TableCell>
                      <div className='w-10 h-10 rounded-full bg-gray-200 overflow-hidden'>
                        <Image
                          src='/next.svg'
                          alt={user.profile?.nama_lengkap || user.username}
                          width={40}
                          height={40}
                          className='w-full h-full object-cover'
                        />
                      </div>
                    </TableCell>
                    <TableCell className='text-gray-900'>{user.username}</TableCell>
                    <TableCell className='text-gray-900'>{user.profile?.nama_lengkap || '-'}</TableCell>
                    <TableCell className='text-gray-900'>{user.profile?.kelas || '-'}</TableCell>
                    <TableCell className='text-gray-900'>{user.profile?.tingkat || '-'}</TableCell>
                    <TableCell className='text-gray-900'>{user.profile?.jurusan || '-'}</TableCell>
                    <TableCell className='text-gray-900 capitalize'>{user.role}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className='flex items-center justify-between'>
            <p className='text-sm text-gray-700'>
              Menampilkan <span className='font-medium'>{pagination.from}</span> sampai <span className='font-medium'>{pagination.to}</span> dari <span className='font-medium'>{pagination.total}</span> hasil
            </p>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href='#'
                    onClick={e => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>

                {getPageNumbers().map((page, index) => (
                  <PaginationItem key={index}>
                    {page === '...' ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href='#'
                        onClick={e => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                        isActive={currentPage === page}
                        className='cursor-pointer'
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href='#'
                    onClick={e => {
                      e.preventDefault();
                      if (currentPage < pagination.last_page) setCurrentPage(currentPage + 1);
                    }}
                    className={currentPage === pagination.last_page ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
