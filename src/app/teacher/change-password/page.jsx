'use client';

import { useState } from 'react';
import TeacherLayout from '../teacherLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import request from '@/utils/request';
import toast from 'react-hot-toast';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Semua field wajib diisi');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter');
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
      await request.patch('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Password berhasil diubah');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message = err?.response?.data?.error || 'Gagal mengubah password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TeacherLayout>
      <div className='max-w-lg mx-auto'>
        <Card>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-lg bg-sky-100'>
                <KeyRound className='w-6 h-6 text-sky-600' />
              </div>
              <div>
                <CardTitle>Ubah Password</CardTitle>
                <CardDescription>Perbarui password akun Anda</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-5'>
              {/* Current Password */}
              <div className='space-y-2'>
                <Label htmlFor='current-password'>Password Saat Ini</Label>
                <div className='relative'>
                  <Input
                    id='current-password'
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder='Masukkan password saat ini'
                    autoComplete='current-password'
                  />
                  <button
                    type='button'
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                    onClick={() => setShowCurrent(!showCurrent)}
                  >
                    {showCurrent ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className='space-y-2'>
                <Label htmlFor='new-password'>Password Baru</Label>
                <div className='relative'>
                  <Input
                    id='new-password'
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder='Masukkan password baru (min. 6 karakter)'
                    autoComplete='new-password'
                  />
                  <button
                    type='button'
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                    onClick={() => setShowNew(!showNew)}
                  >
                    {showNew ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className='space-y-2'>
                <Label htmlFor='confirm-password'>Konfirmasi Password Baru</Label>
                <div className='relative'>
                  <Input
                    id='confirm-password'
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder='Ulangi password baru'
                    autoComplete='new-password'
                  />
                  <button
                    type='button'
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                  </button>
                </div>
              </div>

              <Button
                type='submit'
                disabled={isLoading}
                className='w-full bg-sky-600 hover:bg-sky-700'
              >
                {isLoading ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
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
    </TeacherLayout>
  );
}
