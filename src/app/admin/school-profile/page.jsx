'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '../adminLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Home, School, Save, RefreshCw, ImageIcon, Globe, Phone, Mail, MapPin, Award, User } from 'lucide-react';
import request from '@/utils/request';
import toast from 'react-hot-toast';

const SCHOOL_LEVELS = ['SD', 'SMP', 'SMA', 'SMK', 'MA', 'MTs', 'MI'];
const ACCREDITATIONS = ['Unggul', 'Baik Sekali', 'Baik', 'A', 'B', 'C'];

export default function SchoolProfilePage() {
  useAuth(['admin']);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    school_name: '',
    npsn: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    phone: '',
    email: '',
    website: '',
    logo_url: '',
    principal_name: '',
    school_level: '',
    accreditation: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await request.get('/school-profile');
      const data = res.data?.data;
      if (data) {
        setProfile({
          school_name: data.school_name || '',
          npsn: data.npsn || '',
          address: data.address || '',
          city: data.city || '',
          province: data.province || '',
          postal_code: data.postal_code || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          logo_url: data.logo_url || '',
          principal_name: data.principal_name || '',
          school_level: data.school_level || '',
          accreditation: data.accreditation || '',
        });
      }
    } catch (err) {
      toast.error('Gagal memuat profil sekolah');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!profile.school_name.trim()) {
      toast.error('Nama sekolah wajib diisi');
      return;
    }

    setSaving(true);
    try {
      await request.put('/school-profile', profile);
      toast.success('Profil sekolah berhasil disimpan');
      // Dispatch event so headers can re-fetch
      window.dispatchEvent(new Event('school-profile-updated'));
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal menyimpan profil sekolah');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className='flex items-center justify-center h-64'>
          <RefreshCw className='w-6 h-6 animate-spin text-gray-400' />
          <span className='ml-2 text-gray-500'>Memuat profil sekolah...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Breadcrumb className='mb-6'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/admin/dashboard'>
              <Home className='w-4 h-4' />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Profil Sekolah</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
            <School className='w-6 h-6 text-blue-600' />
            Profil Sekolah
          </h1>
          <p className='text-sm text-gray-500 mt-1'>
            Kelola informasi sekolah yang tampil di seluruh aplikasi
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className='w-4 h-4 mr-2 animate-spin' /> Menyimpan...
            </>
          ) : (
            <>
              <Save className='w-4 h-4 mr-2' /> Simpan Perubahan
            </>
          )}
        </Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Identitas Sekolah */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg flex items-center gap-2'>
              <School className='w-5 h-5 text-blue-500' /> Identitas Sekolah
            </CardTitle>
            <CardDescription>Informasi dasar tentang sekolah</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='school_name'>Nama Sekolah *</Label>
              <Input
                id='school_name'
                value={profile.school_name}
                onChange={(e) => handleChange('school_name', e.target.value)}
                placeholder='Masukkan nama sekolah'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='npsn'>NPSN</Label>
              <Input
                id='npsn'
                value={profile.npsn}
                onChange={(e) => handleChange('npsn', e.target.value)}
                placeholder='Nomor Pokok Sekolah Nasional'
                maxLength={20}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Jenjang</Label>
                <Select value={profile.school_level} onValueChange={(v) => handleChange('school_level', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder='Pilih jenjang' />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_LEVELS.map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Akreditasi</Label>
                <Select value={profile.accreditation} onValueChange={(v) => handleChange('accreditation', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder='Pilih akreditasi' />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCREDITATIONS.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='principal_name' className='flex items-center gap-1.5'>
                <User className='w-3.5 h-3.5' /> Nama Kepala Sekolah
              </Label>
              <Input
                id='principal_name'
                value={profile.principal_name}
                onChange={(e) => handleChange('principal_name', e.target.value)}
                placeholder='Nama lengkap kepala sekolah'
              />
            </div>
          </CardContent>
        </Card>

        {/* Kontak & Alamat */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg flex items-center gap-2'>
              <MapPin className='w-5 h-5 text-green-500' /> Kontak & Alamat
            </CardTitle>
            <CardDescription>Informasi lokasi dan kontak sekolah</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='address'>Alamat</Label>
              <Textarea
                id='address'
                value={profile.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder='Alamat lengkap sekolah'
                rows={3}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='city'>Kota/Kabupaten</Label>
                <Input
                  id='city'
                  value={profile.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder='Kota/Kabupaten'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='province'>Provinsi</Label>
                <Input
                  id='province'
                  value={profile.province}
                  onChange={(e) => handleChange('province', e.target.value)}
                  placeholder='Provinsi'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='postal_code'>Kode Pos</Label>
              <Input
                id='postal_code'
                value={profile.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
                placeholder='Kode pos'
                maxLength={10}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='phone' className='flex items-center gap-1.5'>
                  <Phone className='w-3.5 h-3.5' /> Telepon
                </Label>
                <Input
                  id='phone'
                  value={profile.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder='Nomor telepon'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='email' className='flex items-center gap-1.5'>
                  <Mail className='w-3.5 h-3.5' /> Email
                </Label>
                <Input
                  id='email'
                  type='email'
                  value={profile.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder='Email sekolah'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo & Website */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle className='text-lg flex items-center gap-2'>
              <Globe className='w-5 h-5 text-purple-500' /> Logo & Website
            </CardTitle>
            <CardDescription>Logo sekolah dan informasi website</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='website' className='flex items-center gap-1.5'>
                    <Globe className='w-3.5 h-3.5' /> Website
                  </Label>
                  <Input
                    id='website'
                    value={profile.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder='https://sekolah.sch.id'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='logo_url' className='flex items-center gap-1.5'>
                    <ImageIcon className='w-3.5 h-3.5' /> URL Logo Sekolah
                  </Label>
                  <Input
                    id='logo_url'
                    value={profile.logo_url}
                    onChange={(e) => handleChange('logo_url', e.target.value)}
                    placeholder='https://... atau /logo-sekolah.png'
                  />
                  <p className='text-xs text-gray-400'>
                    Masukkan URL gambar logo sekolah. Bisa berupa path lokal (misal: /logo-sekolah.png) atau URL eksternal.
                  </p>
                </div>
              </div>
              <div className='flex items-center justify-center'>
                {profile.logo_url ? (
                  <div className='text-center'>
                    <div className='w-32 h-32 mx-auto border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center'>
                      <img
                        src={profile.logo_url}
                        alt='Logo Sekolah'
                        className='max-w-full max-h-full object-contain'
                        onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span class="text-gray-400 text-sm">Gagal memuat logo</span>'; }}
                      />
                    </div>
                    <p className='text-xs text-gray-500 mt-2'>Preview Logo</p>
                  </div>
                ) : (
                  <div className='w-32 h-32 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center'>
                    <div className='text-center text-gray-400'>
                      <ImageIcon className='w-8 h-8 mx-auto mb-1' />
                      <p className='text-xs'>Belum ada logo</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle className='text-lg'>Preview Header</CardTitle>
            <CardDescription>Tampilan header yang akan muncul di seluruh dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-3 p-4 bg-gray-50 rounded-lg border'>
              {profile.logo_url ? (
                <img
                  src={profile.logo_url}
                  alt='Logo'
                  className='w-10 h-10 object-cover rounded'
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className='w-10 h-10 bg-blue-100 rounded flex items-center justify-center'>
                  <School className='w-6 h-6 text-blue-600' />
                </div>
              )}
              <div>
                <h2 className='text-xl font-bold text-gray-900'>{profile.school_name || 'Nama Sekolah'}</h2>
                <div className='flex items-center gap-2 mt-0.5'>
                  {profile.school_level && <Badge variant='outline' className='text-xs'>{profile.school_level}</Badge>}
                  {profile.accreditation && <Badge variant='secondary' className='text-xs'>Akreditasi {profile.accreditation}</Badge>}
                  {profile.city && <span className='text-xs text-gray-500'>{profile.city}</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
