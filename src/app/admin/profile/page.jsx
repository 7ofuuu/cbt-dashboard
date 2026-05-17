'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { Home, Save, UserCog } from 'lucide-react';
import AdminLayout from '../adminLayout';
import { useAuth } from '@/hooks/useAuth';
import { useAuthContext } from '@/contexts/AuthContext';
import request from '@/utils/request';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';

export default function AdminProfilePage() {
  useAuth(['admin']);
  const { login: syncAuthUser } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
  });

  useEffect(() => {
    const fetchMyProfile = async () => {
      try {
        setLoading(true);
        const response = await request.get('/auth/me');
        const myUser = response?.data?.user;
        if (myUser) {
          setFormData({
            full_name: myUser.profile?.full_name || '',
            username: myUser.username || '',
          });
        }
      } catch (error) {
        toast.error('Gagal memuat profil admin');
      } finally {
        setLoading(false);
      }
    };

    fetchMyProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!formData.full_name.trim() || !formData.username.trim()) {
      toast.error('Nama dan username wajib diisi');
      return;
    }

    setSaving(true);
    try {
      await request.patch('/auth/profile', {
        full_name: formData.full_name.trim(),
        username: formData.username.trim(),
      });

      const freshMe = await request.get('/auth/me');
      const token = Cookies.get('token');
      if (token && freshMe?.data?.user) {
        syncAuthUser(token, freshMe.data.user);
      }

      toast.success('Profil berhasil diperbarui');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
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
            <BreadcrumbPage>Profil Saya</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='space-y-6'>
        <PageHeader title='Profil Saya' description='Kelola informasi akun admin Anda sendiri.' />

        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='mb-6 flex items-center gap-3'>
            <div className='rounded-lg bg-blue-100 p-2'>
              <UserCog className='h-5 w-5 text-blue-700' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900'>Informasi Akun</h3>
          </div>

          {loading ? (
            <div className='py-8 text-center text-gray-500'>Memuat profil...</div>
          ) : (
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='admin_full_name'>Nama Lengkap</Label>
                <Input
                  id='admin_full_name'
                  value={formData.full_name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, full_name: event.target.value }))}
                  placeholder='Nama lengkap admin'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='admin_username'>Username</Label>
                <Input
                  id='admin_username'
                  value={formData.username}
                  onChange={(event) => setFormData((prev) => ({ ...prev, username: event.target.value }))}
                  placeholder='Username akun'
                />
              </div>
            </div>
          )}

          <div className='mt-6 flex justify-end'>
            <Button
              type='button'
              onClick={handleSaveProfile}
              disabled={saving || loading}
              className='bg-[#003366] hover:bg-[#002244] text-white flex items-center gap-2'
            >
              <Save className='h-4 w-4' />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
