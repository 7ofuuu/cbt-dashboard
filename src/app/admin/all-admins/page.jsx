'use client';

import AdminLayout from '../adminLayout';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Search, Home, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import request from '@/utils/request';

export default function SemuaAdminPage() {
  useAuth(['admin']);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);

        const response = await request.get('/users/admins');


        setUsers(response.data.data);
      } catch (err) {
        setError('Gagal memuat data admin');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const nama = user.full_name || '';
    const matchesSearch = nama.toLowerCase().includes(searchQuery.toLowerCase()) || user.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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
            <BreadcrumbPage>Semua Admin</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className='space-y-6'>
        <PageHeader
          title="Daftar Admin"
          description="Kelola dan lihat semua pengguna dengan role admin"
        />

        {/* Search */}
        <div className='flex flex-col sm:flex-row gap-4'>
          {/* Search Input */}
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
            <Input
              type='text'
              placeholder='Cari admin'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-10 bg-white border-gray-300'
            />
          </div>
        </div>

        {/* Table */}
        <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow className='bg-[#003366] hover:bg-[#003366]'>
                <TableHead className='text-white font-semibold'>Foto</TableHead>
                <TableHead className='text-white font-semibold'>Username</TableHead>
                <TableHead className='text-white font-semibold'>Nama</TableHead>
                <TableHead className='text-white font-semibold'>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='text-center py-12 text-gray-500'
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='text-center py-12 text-red-500'
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='text-center py-12 text-gray-500'
                  >
                    Tidak ada data admin ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map(user => (
                  <TableRow
                    key={user.id}
                    className='hover:bg-gray-50 cursor-pointer'
                    onClick={() => router.push(`/admin/user-detail/${user.id}`)}
                  >
                    <TableCell>
                      <div className='w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center'>
                        <span className='text-sm font-bold text-purple-600'>
                          {(user.full_name || user.username || '?')[0].toUpperCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='text-gray-900'>{user.username}</TableCell>
                    <TableCell className='text-gray-900'>{user.full_name || '-'}</TableCell>
                    <TableCell className='text-gray-900 capitalize'>
                      <div className='flex items-center gap-2'>
                        {user.role}
                        {user.is_super_admin && (
                          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300'>
                            <ShieldCheck className='w-3 h-3' />
                            Super Admin
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
