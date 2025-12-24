'use client';

import AdminLayout from '../adminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Plus, Search, Home } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export default function SemuaPenggunaPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [tingkatFilter, setTingkatFilter] = useState('all');
  const [jurusanFilter, setJurusanFilter] = useState('all');
  const [kelasFilter, setKelasFilter] = useState('all');
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

      console.log('Token:', token);
      console.log('API URL:', process.env.NEXT_PUBLIC_LARAVEL_API);

      const response = await axios.get(`${process.env.NEXT_PUBLIC_LARAVEL_API}/users/siswas`, {
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
      setError('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const nama = user.profile?.nama_lengkap || '';
    const matchesSearch = nama.toLowerCase().includes(searchQuery.toLowerCase()) || user.username.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by tingkat (only for siswa)
    const matchesTingkat = tingkatFilter === 'all' || (user.profile?.tingkat && user.profile.tingkat === tingkatFilter);

    // Filter by jurusan (only for siswa)
    const matchesJurusan = jurusanFilter === 'all' || (user.profile?.jurusan && user.profile.jurusan.toLowerCase() === jurusanFilter.toLowerCase());

    // Filter by kelas (only for siswa)
    const matchesKelas = kelasFilter === 'all' || (user.profile?.kelas && user.profile.kelas.includes(kelasFilter));

    return matchesSearch && matchesTingkat && matchesJurusan && matchesKelas;
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
            <BreadcrumbPage>Semua Siswa</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold text-gray-900'>Daftar Pengguna</h2>
        </div>

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
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-center py-12 text-gray-500'
                  >
                    Tidak ada data pengguna ditemukan
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
      </div>
    </AdminLayout>
  );
}
