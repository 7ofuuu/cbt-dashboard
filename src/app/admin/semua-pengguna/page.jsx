'use client';

import AdminLayout from '../adminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

export default function SemuaPenggunaPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tingkatFilter, setTingkatFilter] = useState('all');
  const [jurusanFilter, setJurusanFilter] = useState('all');
  const [kelasFilter, setKelasFilter] = useState('all');

  const users = [
    {
      id: 1,
      username: 'Kanabawi',
      nama: 'Ahmad Kanabawi',
      role: 'Siswa',
      avatar: '/next.svg',
    },
    {
      id: 2,
      username: 'Jalil',
      nama: 'Usman Abdul Jalil',
      role: 'Siswa',
      avatar: '/next.svg',
    },
    {
      id: 3,
      username: 'Kashmiri',
      nama: 'Khalid Kashmiri',
      role: 'Guru',
      avatar: '/next.svg',
    },
    {
      id: 4,
      username: 'Sumbul',
      nama: 'Muhammad Sumbul',
      role: 'Guru',
      avatar: '/next.svg',
    },
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nama.toLowerCase().includes(searchQuery.toLowerCase()) || user.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold text-gray-900'>Daftar Pengguna</h2>
          <Button className='bg-[#003366] hover:bg-[#002244] text-white flex items-center gap-2'>
            <Plus className='w-4 h-4' />
            Tambah Pengguna
          </Button>
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
              <SelectItem value='10'>Tingkat 10</SelectItem>
              <SelectItem value='11'>Tingkat 11</SelectItem>
              <SelectItem value='12'>Tingkat 12</SelectItem>
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
                <TableHead className='text-white font-semibold'>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='text-center py-12 text-gray-500'
                  >
                    Tidak ada data pengguna ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map(user => (
                  <TableRow
                    key={user.id}
                    className='hover:bg-gray-50'
                  >
                    <TableCell>
                      <div className='w-10 h-10 rounded-full bg-gray-200 overflow-hidden'>
                        <Image
                          src={user.avatar}
                          alt={user.nama}
                          width={40}
                          height={40}
                          className='w-full h-full object-cover'
                        />
                      </div>
                    </TableCell>
                    <TableCell className='text-gray-900'>{user.username}</TableCell>
                    <TableCell className='text-gray-900'>{user.nama}</TableCell>
                    <TableCell className='text-gray-900'>{user.role}</TableCell>
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
