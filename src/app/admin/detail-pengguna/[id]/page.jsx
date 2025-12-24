'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '../../adminLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, Save, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';
import Cookies from 'js-cookie';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    username: '',
    password: '',
    role: '',
    jurusan: '',
    tingkat: '',
    kelas: '',
  });

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
        // Initialize form data
        setFormData({
          nama_lengkap: response.data.data.profile?.nama_lengkap || '',
          username: response.data.data.username || '',
          password: '',
          role: response.data.data.role || '',
          jurusan: response.data.data.profile?.jurusan || '',
          tingkat: response.data.data.profile?.tingkat || '',
          kelas: response.data.data.profile?.kelas || '',
        });
      }
    } catch (err) {
      console.error('Error fetching user detail:', err);
      setError('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      const token = Cookies.get('token');

      console.log('Updating user with ID:', userId);
      console.log('Token:', token);

      // Prepare update payload
      const updatePayload = {
        username: formData.username,
        role: formData.role,
        profile: {
          nama_lengkap: formData.nama_lengkap,
        },
      };

      // Add password if provided
      if (formData.password && formData.password !== '') {
        updatePayload.password = formData.password;
      }

      // Add siswa-specific fields if role is siswa
      if (formData.role === 'siswa') {
        updatePayload.profile.jurusan = formData.jurusan;
        updatePayload.profile.tingkat = formData.tingkat;
        updatePayload.profile.kelas = formData.kelas;
      }

      console.log('Update Payload:', updatePayload);
      console.log('API URL:', `${process.env.NEXT_PUBLIC_LARAVEL_API}/users/${userId}`);

      const response = await axios.put(`${process.env.NEXT_PUBLIC_LARAVEL_API}/users/${userId}`, updatePayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Update Response:', response.data);

      if (response.data.success) {
        toast.success('Data pengguna berhasil diperbarui');
        fetchUserDetail(); // Refresh data
      }
    } catch (err) {
      console.error('Error updating user:', err);
      console.error('Error response:', err.response);
      toast.error(err.response?.data?.message || 'Gagal memperbarui data pengguna');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const token = Cookies.get('token');

      console.log('Deleting user with ID:', userId);
      console.log('Token:', token);
      console.log('API URL:', `${process.env.NEXT_PUBLIC_LARAVEL_API}/users/${userId}`);

      const response = await axios.delete(`${process.env.NEXT_PUBLIC_LARAVEL_API}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Delete Response:', response.data);

      if (response.data.success) {
        toast.success('Pengguna berhasil dihapus');
        setShowDeleteDialog(false);
        router.push('/admin/semua-siswa'); // Redirect to user list
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      console.error('Error response:', err.response);
      toast.error(err.response?.data?.message || 'Gagal menghapus pengguna');
    } finally {
      setDeleting(false);
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
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${isSiswa ? 'bg-blue-100 text-blue-700' : isGuru ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
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
                  value={formData.nama_lengkap}
                  onChange={e => handleInputChange('nama_lengkap', e.target.value)}
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
                  value={formData.username}
                  onChange={e => handleInputChange('username', e.target.value)}
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
                  placeholder='Kosongkan jika tidak ingin mengubah'
                  value={formData.password}
                  onChange={e => handleInputChange('password', e.target.value)}
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
                  value={formData.role}
                  onValueChange={value => handleInputChange('role', value)}
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
              {formData.role === 'siswa' && (
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
                      value={formData.jurusan}
                      onChange={e => handleInputChange('jurusan', e.target.value)}
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
                      value={formData.tingkat}
                      onChange={e => handleInputChange('tingkat', e.target.value)}
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
                      value={formData.kelas}
                      onChange={e => handleInputChange('kelas', e.target.value)}
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
                onClick={() => setShowDeleteDialog(true)}
                disabled={deleting || saving}
                className='bg-red-600 hover:bg-red-700 text-white flex items-center gap-2'
              >
                <Trash2 className='w-4 h-4' />
                Hapus Pengguna
              </Button>
              <Button
                type='button'
                onClick={handleUpdate}
                disabled={saving || deleting}
                className='bg-[#003366] hover:bg-[#002244] text-white flex items-center gap-2'
              >
                <Save className='w-4 h-4' />
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </form>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Hapus Pengguna</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus pengguna <span className='font-semibold text-gray-900'>{user.profile?.nama_lengkap || user.username}</span>?
                <br />
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className='bg-red-600 hover:bg-red-700'
              >
                {deleting ? 'Menghapus...' : 'Hapus'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
