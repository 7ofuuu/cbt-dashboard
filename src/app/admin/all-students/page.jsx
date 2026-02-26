'use client';

import AdminLayout from '../adminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, Home, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import request from '@/utils/request';

export default function SemuaPenggunaPage() {
  useAuth(['admin']);
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
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteMode, setDeleteMode] = useState(null); // 'selected' or 'filter'
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    limit: 10,
    total: 0,
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
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const params = {
          page: currentPage,
          limit: itemsPerPage,
        };

        // Add search parameter if not empty
        if (debouncedSearch) {
          params.search = debouncedSearch;
        }

        // Add filter parameters if not 'all'
        if (tingkatFilter !== 'all') {
          params.grade_level = tingkatFilter;
        }
        if (jurusanFilter !== 'all') {
          params.major = jurusanFilter;
        }
        if (kelasFilter !== 'all') {
          params.classroom = kelasFilter;
        }

        const response = await request.get('/users/students', params);


        setUsers(response.data.data);
        setPagination(response.data.pagination);
      } catch (err) {
        setError('Gagal memuat data pengguna');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, debouncedSearch, tingkatFilter, jurusanFilter, kelasFilter]);

  // Clear selection when data changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [users]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, tingkatFilter, jurusanFilter, kelasFilter]);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const totalPages = pagination.totalPages;

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

  // Selection helpers
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map(u => u.id)));
    }
  };

  const handleBatchDelete = async () => {
    setDeleting(true);
    setDeleteResult(null);
    try {
      const body = deleteMode === 'selected'
        ? { user_ids: Array.from(selectedIds) }
        : {
            grade_level: tingkatFilter !== 'all' ? tingkatFilter : undefined,
            major: jurusanFilter !== 'all' ? jurusanFilter : undefined,
            classroom: kelasFilter !== 'all' ? kelasFilter : undefined,
          };

      const res = await request.post('/users/batch-delete', body);

      setDeleteResult(res.data);
      setSelectedIds(new Set());
      // Refresh list
      setCurrentPage(1);
      const fetchRes = await request.get('/users/students', { page: 1, limit: itemsPerPage });
      setUsers(fetchRes.data.data);
      setPagination(fetchRes.data.pagination);
    } catch (err) {
      setDeleteResult({ error: err.response?.data?.error || 'Gagal menghapus user' });
    } finally {
      setDeleting(false);
    }
  };

  const getDeleteDescription = () => {
    if (deleteMode === 'selected') {
      return `Anda akan menghapus ${selectedIds.size} siswa yang dipilih beserta semua data ujian mereka. Tindakan ini tidak dapat dibatalkan.`;
    }
    const parts = [];
    if (tingkatFilter !== 'all') parts.push(`Tingkat ${tingkatFilter}`);
    if (jurusanFilter !== 'all') parts.push(`Jurusan ${jurusanFilter}`);
    if (kelasFilter !== 'all') parts.push(`Kelas ${kelasFilter}`);
    return `Anda akan menghapus SEMUA siswa dengan filter: ${parts.join(', ')}. Semua data ujian mereka juga akan terhapus. Tindakan ini tidak dapat dibatalkan.`;
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
              <SelectItem value='X'>Kelas 10</SelectItem>
              <SelectItem value='XI'>Kelas 11</SelectItem>
              <SelectItem value='XII'>Kelas 12</SelectItem>
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
              <SelectItem value='IPA'>IPA</SelectItem>
              <SelectItem value='IPS'>IPS</SelectItem>
              <SelectItem value='Bahasa'>Bahasa</SelectItem>
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

        {/* Batch Actions Bar */}
        {(selectedIds.size > 0 || (tingkatFilter !== 'all' && users.length > 0)) && (
          <div className='flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
            {selectedIds.size > 0 && (
              <Button
                variant='destructive'
                size='sm'
                onClick={() => { setDeleteMode('selected'); setShowDeleteDialog(true); }}
              >
                <Trash2 className='w-4 h-4 mr-2' />
                Hapus {selectedIds.size} Terpilih
              </Button>
            )}
            {tingkatFilter !== 'all' && (
              <Button
                variant='outline'
                size='sm'
                className='border-red-300 text-red-600 hover:bg-red-50'
                onClick={() => { setDeleteMode('filter'); setShowDeleteDialog(true); }}
              >
                <Trash2 className='w-4 h-4 mr-2' />
                Hapus Semua Tingkat {tingkatFilter}
                {jurusanFilter !== 'all' ? ` - ${jurusanFilter}` : ''}
              </Button>
            )}
            <span className='text-sm text-gray-600 ml-auto'>
              {selectedIds.size > 0 ? `${selectedIds.size} dipilih` : 'Gunakan filter untuk hapus per angkatan'}
            </span>
          </div>
        )}

        {/* Delete Result Toast */}
        {deleteResult && (
          <div className={`p-3 rounded-lg border text-sm ${deleteResult.error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
            {deleteResult.error
              ? deleteResult.error
              : `${deleteResult.deleted_count} user berhasil dihapus.${deleteResult.skipped_count > 0 ? ` ${deleteResult.skipped_count} dilewati (super admin/akun sendiri).` : ''}`}
            <button className='ml-4 underline' onClick={() => setDeleteResult(null)}>Tutup</button>
          </div>
        )}

        {/* Table */}
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow className='bg-[#003366] hover:bg-[#003366]'>
                <TableHead className='w-10'>
                  <Checkbox
                    checked={users.length > 0 && selectedIds.size === users.length}
                    onCheckedChange={toggleSelectAll}
                    className='border-white data-[state=checked]:bg-white data-[state=checked]:text-[#003366]'
                  />
                </TableHead>
                <TableHead className='text-white font-semibold'>Foto</TableHead>
                <TableHead className='text-white font-semibold'>Username</TableHead>
                <TableHead className='text-white font-semibold'>Nama</TableHead>
                <TableHead className='text-white font-semibold'>NISN</TableHead>
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
                    colSpan={9}
                    className='text-center py-12 text-gray-500'
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className='text-center py-12 text-red-500'
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className='text-center py-12 text-gray-500'
                  >
                    Tidak ada data pengguna ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                users.map(user => (
                  <TableRow
                    key={user.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedIds.has(user.id) ? 'bg-blue-50' : ''}`}
                  >
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(user.id)}
                        onCheckedChange={() => toggleSelect(user.id)}
                      />
                    </TableCell>
                    <TableCell onClick={() => router.push(`/admin/user-detail/${user.id}`)}>
                      <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
                        <span className='text-sm font-bold text-blue-600'>
                          {(user.full_name || user.username || '?')[0].toUpperCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='text-gray-900' onClick={() => router.push(`/admin/user-detail/${user.id}`)}>{user.username}</TableCell>
                    <TableCell className='text-gray-900' onClick={() => router.push(`/admin/user-detail/${user.id}`)}>{user.full_name || '-'}</TableCell>
                    <TableCell className='text-gray-900' onClick={() => router.push(`/admin/user-detail/${user.id}`)}>{user.nisn || '-'}</TableCell>
                    <TableCell className='text-gray-900' onClick={() => router.push(`/admin/user-detail/${user.id}`)}>{user.classroom || '-'}</TableCell>
                    <TableCell className='text-gray-900' onClick={() => router.push(`/admin/user-detail/${user.id}`)}>{user.grade_level || '-'}</TableCell>
                    <TableCell className='text-gray-900' onClick={() => router.push(`/admin/user-detail/${user.id}`)}>{user.major || '-'}</TableCell>
                    <TableCell className='text-gray-900 capitalize' onClick={() => router.push(`/admin/user-detail/${user.id}`)}>{user.role}</TableCell>
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
              Menampilkan <span className='font-medium'>{((pagination.page - 1) * pagination.limit) + 1}</span> sampai <span className='font-medium'>{Math.min(pagination.page * pagination.limit, pagination.total)}</span> dari <span className='font-medium'>{pagination.total}</span> hasil
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
                      if (currentPage < pagination.totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={currentPage === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Batch Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-red-600'>Konfirmasi Hapus Massal</AlertDialogTitle>
            <AlertDialogDescription className='text-gray-700'>
              {getDeleteDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className='bg-red-600 hover:bg-red-700'
              disabled={deleting}
              onClick={async (e) => {
                e.preventDefault();
                await handleBatchDelete();
                setShowDeleteDialog(false);
              }}
            >
              {deleting ? 'Menghapus...' : 'Ya, Hapus Semua'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
