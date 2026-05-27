'use client';

import AdminLayout from '../adminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Search, Home, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthContext } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import request from '@/utils/request';

export default function SemuaGuruPage() {
  useAuth(['admin']);
  const router = useRouter();
  const { user: currentUser } = useAuthContext();
  const [togglingId, setTogglingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await request.get('/users/teachers');
      setUsers(response.data.data || []);
    } catch (err) {
      setError('Gagal memuat data guru');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [searchQuery, users]);

  const filteredUsers = users.filter(user => {
    const nama = user.full_name || '';
    const mapel = user.subject || '';
    const matchesSearch =
      nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mapel.toLowerCase().includes(searchQuery.toLowerCase());
    const isActive = user.is_active !== false;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'inactive' && !isActive);
    return matchesSearch && matchesStatus;
  });

  const inactiveCount = users.filter(u => u.is_active === false).length;

  // Convenience action: select every inactive teacher (excluding super-admin
  // and the current user; the batch endpoint skips them anyway). Pair with
  // the existing batch-delete dialog.
  const selectAllInactive = () => {
    const ids = users
      .filter(u => u.is_active === false && !u.is_super_admin && currentUser?.id?.toString() !== u.id?.toString())
      .map(u => u.id);
    setSelectedIds(new Set(ids));
    setStatusFilter('inactive');
    if (ids.length === 0) {
      toast('Tidak ada guru non-aktif untuk dihapus.', { icon: 'ℹ️' });
    } else {
      toast.success(`${ids.length} guru non-aktif terpilih`);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (filteredUsers.length === 0) return;
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(filteredUsers.map((user) => user.id)));
  };

  const handleToggleStatus = async (user) => {
    setTogglingId(user.id);
    try {
      const res = await request.patch(`/users/${user.id}/status`);
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, is_active: res.data.is_active } : u)));
      toast.success(res.data.message || 'Status pengguna berhasil diubah');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Gagal mengubah status pengguna');
    } finally {
      setTogglingId(null);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;

    setDeleting(true);
    setDeleteResult(null);
    try {
      const response = await request.post('/users/batch-delete', {
        user_ids: Array.from(selectedIds),
      });

      setDeleteResult(response.data);
      setSelectedIds(new Set());
      await fetchUsers();
    } catch (err) {
      setDeleteResult({
        error: err.response?.data?.error || 'Gagal menghapus data guru terpilih',
      });
    } finally {
      setDeleting(false);
    }
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
            <BreadcrumbPage>Semua Guru</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className='space-y-6'>
        <PageHeader
          title="Daftar Guru"
          description="Kelola dan lihat semua pengguna dengan role guru"
        />

        {/* Search + Filter */}
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
            <Input
              type='text'
              placeholder='Cari Guru'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-10 bg-white border-gray-300'
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Non-aktif {inactiveCount > 0 && `(${inactiveCount})`}</SelectItem>
            </SelectContent>
          </Select>
          {inactiveCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:border-red-300"
              onClick={selectAllInactive}
            >
              <Trash2 className='w-4 h-4 mr-2' />
              Pilih Semua Non-aktif ({inactiveCount})
            </Button>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className='flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
            <Button
              variant='destructive'
              size='sm'
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className='w-4 h-4 mr-2' />
              Hapus {selectedIds.size} Terpilih
            </Button>
            <span className='text-sm text-gray-600 ml-auto'>{selectedIds.size} guru dipilih</span>
          </div>
        )}

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
                    checked={filteredUsers.length > 0 && selectedIds.size === filteredUsers.length}
                    onCheckedChange={toggleSelectAll}
                    className='border-white data-[state=checked]:bg-white data-[state=checked]:text-[#003366]'
                  />
                </TableHead>
                <TableHead className='text-white font-semibold'>Foto</TableHead>
                <TableHead className='text-white font-semibold'>Username</TableHead>
                <TableHead className='text-white font-semibold'>Nama</TableHead>
                <TableHead className='text-white font-semibold'>NIP</TableHead>
                <TableHead className='text-white font-semibold'>Mata Pelajaran</TableHead>
                <TableHead className='text-white font-semibold'>Koordinator</TableHead>
                <TableHead className='text-white font-semibold'>Role</TableHead>
                <TableHead className='text-white font-semibold'>Status</TableHead>
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
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className='text-center py-12 text-gray-500'
                  >
                    Tidak ada data guru ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user, idx) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.025, 0.3), duration: 0.25 }}
                    className={`border-b transition-colors hover:bg-gray-50 cursor-pointer ${selectedIds.has(user.id) ? 'bg-blue-50' : ''} ${user.is_active === false ? 'opacity-60' : ''}`}
                    onClick={() => router.push(`/admin/user-detail/${user.id}`)}
                  >
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(user.id)}
                        onCheckedChange={() => toggleSelect(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center'>
                        <span className='text-sm font-bold text-green-600'>
                          {(user.full_name || user.username || '?')[0].toUpperCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='text-gray-900'>{user.username}</TableCell>
                    <TableCell className='text-gray-900'>{user.full_name || '-'}</TableCell>
                    <TableCell className='text-gray-900'>{user.nip || '-'}</TableCell>
                    <TableCell className='text-gray-900'>{user.subject || '-'}</TableCell>
                    <TableCell>
                      {user.is_coordinator ? (
                        <span className='inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700'>
                          Ya
                        </span>
                      ) : (
                        <span className='text-gray-500 text-sm'>Tidak</span>
                      )}
                    </TableCell>
                    <TableCell className='text-gray-900 capitalize'>{user.role}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      {(() => {
                        const active = user.is_active !== false;
                        const canToggle = !user.is_super_admin && currentUser?.id?.toString() !== user.id?.toString();
                        return (
                          <div className='flex items-center gap-2'>
                            <Switch
                              checked={active}
                              disabled={!canToggle || togglingId === user.id}
                              onCheckedChange={() => handleToggleStatus(user)}
                            />
                            <Badge className={active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-200 text-gray-600 border-gray-300'}>
                              {active ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </div>
                        );
                      })()}
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-red-600'>Konfirmasi Hapus Data Guru</AlertDialogTitle>
            <AlertDialogDescription className='text-gray-700'>
              Anda akan menghapus {selectedIds.size} guru terpilih beserta data relasi mereka. Tindakan ini tidak dapat dibatalkan.
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
              {deleting ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
