'use client';

import { useState } from 'react';
import { Eye, EyeOff, Home, KeyRound, Loader2 } from 'lucide-react';
import AdminLayout from '../adminLayout';
import { useAuth } from '@/hooks/useAuth';
import request from '@/utils/request';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';

const isStrongPassword = (password) => /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);

export default function AdminChangePasswordPage() {
  useAuth(['admin']);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Semua field wajib diisi');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password baru minimal 8 karakter');
      return;
    }

    if (!isStrongPassword(newPassword)) {
      toast.error('Password harus mengandung huruf besar, huruf kecil, dan angka');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    if (currentPassword === newPassword) {
      toast.error('Password baru tidak boleh sama dengan password saat ini');
      return;
    }

    setIsLoading(true);
    try {
      await request.patch('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      toast.success('Password berhasil diubah');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Gagal mengubah password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Breadcrumb className='mb-6'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/admin/dashboard'>
              <Home className='h-4 w-4' />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Ubah Password</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='space-y-6'>
        <PageHeader title='Ubah Password' description='Perbarui password akun admin Anda dengan aman.' />

        <div className='max-w-xl'>
          <Card>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <div className='rounded-lg bg-blue-100 p-2'>
                  <KeyRound className='h-5 w-5 text-blue-700' />
                </div>
                <div>
                  <CardTitle>Keamanan Akun</CardTitle>
                  <CardDescription>Gunakan password kuat minimal 8 karakter.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className='space-y-5'>
                <div className='space-y-2'>
                  <Label htmlFor='admin_current_password'>Password Saat Ini</Label>
                  <div className='relative'>
                    <Input
                      id='admin_current_password'
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      placeholder='Masukkan password saat ini'
                      autoComplete='current-password'
                    />
                    <button
                      type='button'
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                      onClick={() => setShowCurrent((prev) => !prev)}
                    >
                      {showCurrent ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                    </button>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='admin_new_password'>Password Baru</Label>
                  <div className='relative'>
                    <Input
                      id='admin_new_password'
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder='Minimal 8 karakter + kombinasi huruf/angka'
                      autoComplete='new-password'
                    />
                    <button
                      type='button'
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                      onClick={() => setShowNew((prev) => !prev)}
                    >
                      {showNew ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                    </button>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='admin_confirm_password'>Konfirmasi Password Baru</Label>
                  <div className='relative'>
                    <Input
                      id='admin_confirm_password'
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder='Ulangi password baru'
                      autoComplete='new-password'
                    />
                    <button
                      type='button'
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                      onClick={() => setShowConfirm((prev) => !prev)}
                    >
                      {showConfirm ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                    </button>
                  </div>
                </div>

                <Button type='submit' disabled={isLoading} className='w-full bg-[#003366] hover:bg-[#002244] text-white'>
                  {isLoading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Password Baru'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
