'use client';

import AdminLayout from '../adminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export default function SemuaGuruPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('token');

      const response = await axios.get(`${process.env.NEXT_PUBLIC_LARAVEL_API}/users/gurus`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('API Response:', response.data);

      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      console.error('Error details:', err.response?.data);
      setError('Gagal memuat data guru');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const nama = user.profile?.nama_lengkap || '';
    const matchesSearch = nama.toLowerCase().includes(searchQuery.toLowerCase()) || user.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Daftar Guru</h2>
        </div>

        {/* Search */}
        <div className='flex flex-col sm:flex-row gap-4'>
          {/* Search Input */}
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
                    Tidak ada data guru ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map(user => (
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
                    <TableCell className='text-gray-900 capitalize'>{user.role}</TableCell>
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
