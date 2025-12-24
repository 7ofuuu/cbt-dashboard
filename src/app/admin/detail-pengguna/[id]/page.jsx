'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '../../adminLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, Save, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';
import Cookies from 'js-cookie';
import Link from 'next/link';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserDetail();
    }
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('token');

      const response = await axios.get(`${process.env.NEXT_PUBLIC_LARAVEL_API}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching user detail:', err);
      setError('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center min-h-[400px]'>
          <p className='text-gray-500'>Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !user) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center min-h-[400px]'>
          <p className='text-red-500'>{error || 'Data tidak ditemukan'}</p>
        </div>
      </AdminLayout>
    );
  }

  const isSiswa = user.role === 'siswa';
  const isGuru = user.role === 'guru';

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Breadcrumb */}
        <div className='flex items-center gap-2 text-sm'>
          <Link
            href='/admin/semua-pengguna'
            className='text-gray-400 hover:text-gray-600'
          >
            Daftar Pengguna
          </Link>
          <span className='text-gray-400'>{'>'}</span>
          <span className='text-gray-900 font-semibold'>Detail Pengguna</span>
        </div>

        {/* User Header Card */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='w-16 h-16 rounded-full bg-gray-200 overflow-hidden'>
                <Image
                  src='/next.svg'
                  alt={user.profile?.nama_lengkap || user.username}
                  width={64}
                  height={64}
                  className='w-full h-full object-cover'
                />
              </div>
              <div>
                <h2 className='text-2xl font-bold text-gray-900'>{user.profile?.nama_lengkap || user.username}</h2>
                <p className='text-sm text-gray-500 lowercase'>{user.role}</p>
              </div>
            </div>
            <div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  isSiswa ? 'bg-blue-100 text-blue-700' : isGuru ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {user.role === 'siswa' ? 'Siswa' : user.role === 'guru' ? 'Guru' : 'Admin'}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <form className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Nama */}
              <div className='space-y-2'>
                <Label
                  htmlFor='nama'
                  className='text-gray-700'
                >
                  Nama
                </Label>
                <Input
                  id='nama'
                  type='text'
                  value={user.profile?.nama_lengkap || ''}
                  readOnly
                  className='bg-white border-gray-300'
                />
              </div>

              {/* Username */}
              <div className='space-y-2'>
                <Label
                  htmlFor='username'
                  className='text-gray-700'
                >
                  Username
                </Label>
                <Input
                  id='username'
                  type='text'
                  value={user.username}
                  readOnly
                  className='bg-white border-gray-300'
                />
              </div>

              {/* Password */}
              <div className='space-y-2'>
                <Label
                  htmlFor='password'
                  className='text-gray-700'
                >
                  Password
                </Label>
                <Input
                  id='password'
                  type='password'
                  value='ireadquranalot'
                  readOnly
                  className='bg-white border-gray-300'
                />
              </div>

              {/* Role */}
              <div className='space-y-2'>
                <Label
                  htmlFor='role'
                  className='text-gray-700'
                >
                  Role
                </Label>
                <Select
                  value={user.role}
                  disabled
                >
                  <SelectTrigger className='bg-white border-gray-300'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='siswa'>Siswa</SelectItem>
                    <SelectItem value='guru'>Guru</SelectItem>
                    <SelectItem value='admin'>Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Siswa specific fields */}
              {isSiswa && (
                <>
                  {/* Jurusan */}
                  <div className='space-y-2'>
                    <Label
                      htmlFor='jurusan'
                      className='text-gray-700'
                    >
                      Jurusan
                    </Label>
                    <Input
                      id='jurusan'
                      type='text'
                      value={user.profile?.jurusan || ''}
                      readOnly
                      className='bg-white border-gray-300'
                    />
                  </div>

                  {/* Tingkat */}
                  <div className='space-y-2'>
                    <Label
                      htmlFor='tingkat'
                      className='text-gray-700'
                    >
                      Tingkat
                    </Label>
                    <Input
                      id='tingkat'
                      type='text'
                      value={user.profile?.tingkat || ''}
                      readOnly
                      className='bg-white border-gray-300'
                    />
                  </div>

                  {/* Kelas */}
                  <div className='space-y-2 md:col-span-2'>
                    <Label
                      htmlFor='kelas'
                      className='text-gray-700'
                    >
                      Kelas
                    </Label>
                    <Input
                      id='kelas'
                      type='text'
                      value={user.profile?.kelas || ''}
                      readOnly
                      className='bg-white border-gray-300'
                    />
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className='flex justify-end gap-4 pt-4'>
              <Button
                type='button'
                variant='destructive'
                className='bg-red-600 hover:bg-red-700 text-white flex items-center gap-2'
              >
                <Trash2 className='w-4 h-4' />
                Hapus Pengguna
              </Button>
              <Button
                type='button'
                className='bg-[#003366] hover:bg-[#002244] text-white flex items-center gap-2'
              >
                <Save className='w-4 h-4' />
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
