'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '../adminLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import {
  Home, School, Save, RefreshCw, ImageIcon, Globe, Phone, Mail, MapPin, User,
  Hash, GraduationCap, Award, Sparkles, Building2,
} from 'lucide-react';
import request from '@/utils/request';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import ImageUploader, { resolvePreviewUrl } from '@/components/ImageUploader';

const SCHOOL_LEVELS = ['SD', 'SMP', 'SMA', 'SMK', 'MA', 'MTs', 'MI'];
const ACCREDITATIONS = ['Unggul', 'Baik Sekali', 'Baik', 'A', 'B', 'C'];

export default function SchoolProfilePage() {
  useAuth(['admin']);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoError, setLogoError] = useState(false);
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

  // Reset logo error state when logo_url changes
  useEffect(() => {
    setLogoError(false);
  }, [profile.logo_url]);

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
    setProfile((prev) => ({ ...prev, [field]: value }));
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

  const showLogo = profile.logo_url && !logoError;

  return (
    <AdminLayout>
      <Breadcrumb className='mb-4'>
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

      {/* ═══════ HERO PREVIEW ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800 text-white shadow-lg mb-6'
      >
        {/* Decorative blobs */}
        <div className='absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl' />
        <div className='absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-cyan-400/20 blur-3xl' />

        <div className='relative flex flex-col md:flex-row items-start md:items-center gap-5 p-6'>
          {/* Logo */}
          <div className='flex-shrink-0'>
            {showLogo ? (
              <div className='w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/95 p-2 flex items-center justify-center shadow-md ring-4 ring-white/20'>
                <img
                  src={resolvePreviewUrl(profile.logo_url)}
                  alt='Logo'
                  className='max-w-full max-h-full object-contain'
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className='w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center ring-4 ring-white/15'>
                <School className='w-10 h-10 md:w-12 md:h-12 text-white' />
              </div>
            )}
          </div>

          {/* Info */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 text-xs uppercase tracking-wider text-white/70 mb-1'>
              <Sparkles className='w-3.5 h-3.5' />
              <span>Identitas Sekolah</span>
            </div>
            <h1 className='text-2xl md:text-3xl font-bold leading-tight'>
              {profile.school_name || 'Belum diisi'}
            </h1>
            <div className='flex flex-wrap items-center gap-2 mt-2'>
              {profile.school_level && (
                <Badge className='bg-white/20 text-white border-white/30 hover:bg-white/25'>
                  <GraduationCap className='w-3 h-3 mr-1' />
                  {profile.school_level}
                </Badge>
              )}
              {profile.accreditation && (
                <Badge className='bg-amber-400/30 text-amber-50 border-amber-300/50 hover:bg-amber-400/40'>
                  <Award className='w-3 h-3 mr-1' />
                  Akreditasi {profile.accreditation}
                </Badge>
              )}
              {profile.npsn && (
                <Badge className='bg-white/15 text-white border-white/20 hover:bg-white/25'>
                  <Hash className='w-3 h-3 mr-1' />
                  NPSN {profile.npsn}
                </Badge>
              )}
              {profile.city && (
                <Badge className='bg-white/15 text-white border-white/20 hover:bg-white/25'>
                  <MapPin className='w-3 h-3 mr-1' />
                  {profile.city}
                </Badge>
              )}
            </div>
            {profile.principal_name && (
              <p className='text-sm text-white/80 mt-2 flex items-center gap-1.5'>
                <User className='w-3.5 h-3.5' />
                Kepala Sekolah: <strong className='text-white'>{profile.principal_name}</strong>
              </p>
            )}
          </div>

          {/* Save button */}
          <div className='flex-shrink-0 w-full md:w-auto'>
            <Button
              onClick={handleSave}
              disabled={saving}
              size='lg'
              className='w-full md:w-auto bg-white text-sky-700 hover:bg-white/90 shadow-md font-semibold'
            >
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
        </div>
      </motion.div>

      {/* ═══════ FORM GRID ═══════ */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-4'>
        {/* Identitas Sekolah */}
        <SectionCard
          className='lg:col-span-7'
          icon={<School className='w-4 h-4' />}
          title='Identitas Sekolah'
          subtitle='Informasi dasar tentang sekolah'
          accent='sky'
        >
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div className='space-y-1.5 sm:col-span-2'>
              <Label htmlFor='school_name' className='text-xs'>Nama Sekolah <span className='text-red-500'>*</span></Label>
              <Input
                id='school_name'
                value={profile.school_name}
                onChange={(e) => handleChange('school_name', e.target.value)}
                placeholder='Contoh: SMA Negeri 1 Parigi'
                className='h-10 w-full'
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='npsn' className='text-xs flex items-center gap-1'><Hash className='w-3 h-3' /> NPSN</Label>
              <Input
                id='npsn'
                value={profile.npsn}
                onChange={(e) => handleChange('npsn', e.target.value)}
                placeholder='Nomor Pokok Sekolah'
                maxLength={20}
                className='h-10 w-full font-mono'
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='principal_name' className='text-xs flex items-center gap-1'><User className='w-3 h-3' /> Kepala Sekolah</Label>
              <Input
                id='principal_name'
                value={profile.principal_name}
                onChange={(e) => handleChange('principal_name', e.target.value)}
                placeholder='Nama lengkap'
                className='h-10 w-full'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs flex items-center gap-1'><GraduationCap className='w-3 h-3' /> Jenjang</Label>
              <Select value={profile.school_level} onValueChange={(v) => handleChange('school_level', v)}>
                <SelectTrigger className='h-10 w-full'>
                  <SelectValue placeholder='Pilih jenjang' />
                </SelectTrigger>
                <SelectContent>
                  {SCHOOL_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs flex items-center gap-1'><Award className='w-3 h-3' /> Akreditasi</Label>
              <Select value={profile.accreditation} onValueChange={(v) => handleChange('accreditation', v)}>
                <SelectTrigger className='h-10 w-full'>
                  <SelectValue placeholder='Pilih akreditasi' />
                </SelectTrigger>
                <SelectContent>
                  {ACCREDITATIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SectionCard>

        {/* Logo & Website */}
        <SectionCard
          className='lg:col-span-5'
          icon={<ImageIcon className='w-4 h-4' />}
          title='Logo & Website'
          subtitle='Logo akan muncul di seluruh aplikasi'
          accent='violet'
        >
          <div className='space-y-4'>
            <ImageUploader
              value={profile.logo_url}
              onChange={(url) => handleChange('logo_url', url)}
              bucket='logo'
              label='Logo Sekolah'
              hint='Direkomendasikan PNG transparan, rasio 1:1, maks 5MB'
              previewClassName='w-20 h-20'
            />

            <div className='space-y-1.5'>
              <Label htmlFor='website' className='text-xs flex items-center gap-1'><Globe className='w-3 h-3' /> Website</Label>
              <Input
                id='website'
                value={profile.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder='https://sekolah.sch.id'
                className='h-10 w-full'
              />
            </div>
          </div>
        </SectionCard>

        {/* Alamat */}
        <SectionCard
          className='lg:col-span-7'
          icon={<MapPin className='w-4 h-4' />}
          title='Alamat'
          subtitle='Lokasi fisik sekolah'
          accent='emerald'
        >
          <div className='space-y-3'>
            <div className='space-y-1.5'>
              <Label htmlFor='address' className='text-xs'>Alamat Lengkap</Label>
              <Textarea
                id='address'
                value={profile.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder='Jalan, RT/RW, kelurahan, kecamatan...'
                rows={2}
                className='w-full resize-none'
              />
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
              <div className='space-y-1.5'>
                <Label htmlFor='city' className='text-xs'>Kota/Kabupaten</Label>
                <Input
                  id='city'
                  value={profile.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder='Kota/Kabupaten'
                  className='h-10 w-full'
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='province' className='text-xs'>Provinsi</Label>
                <Input
                  id='province'
                  value={profile.province}
                  onChange={(e) => handleChange('province', e.target.value)}
                  placeholder='Provinsi'
                  className='h-10 w-full'
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='postal_code' className='text-xs'>Kode Pos</Label>
                <Input
                  id='postal_code'
                  value={profile.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                  placeholder='Kode pos'
                  maxLength={10}
                  className='h-10 w-full font-mono'
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Kontak */}
        <SectionCard
          className='lg:col-span-5'
          icon={<Phone className='w-4 h-4' />}
          title='Kontak'
          subtitle='Cara orang menghubungi sekolah'
          accent='rose'
        >
          <div className='space-y-3'>
            <div className='space-y-1.5'>
              <Label htmlFor='phone' className='text-xs flex items-center gap-1'><Phone className='w-3 h-3' /> Telepon</Label>
              <Input
                id='phone'
                value={profile.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder='Contoh: (021) 1234567'
                className='h-10 w-full'
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='email' className='text-xs flex items-center gap-1'><Mail className='w-3 h-3' /> Email</Label>
              <Input
                id='email'
                type='email'
                value={profile.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder='info@sekolah.sch.id'
                className='h-10 w-full'
              />
            </div>
            {(profile.phone || profile.email) && (
              <div className='rounded-lg bg-rose-50/60 border border-rose-100 px-3 py-2'>
                <p className='text-[11px] text-rose-700 flex items-center gap-1.5'>
                  <Building2 className='w-3 h-3' />
                  Kontak ini akan muncul di footer dokumen ujian
                </p>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </AdminLayout>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────
const ACCENT = {
  sky: { iconBg: 'bg-sky-100', iconText: 'text-sky-700', bar: 'from-sky-400 to-sky-600' },
  violet: { iconBg: 'bg-violet-100', iconText: 'text-violet-700', bar: 'from-violet-400 to-violet-600' },
  emerald: { iconBg: 'bg-emerald-100', iconText: 'text-emerald-700', bar: 'from-emerald-400 to-emerald-600' },
  rose: { iconBg: 'bg-rose-100', iconText: 'text-rose-700', bar: 'from-rose-400 to-rose-600' },
};

function SectionCard({ icon, title, subtitle, accent = 'sky', className = '', children }) {
  const a = ACCENT[accent] || ACCENT.sky;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`bg-white border rounded-xl shadow-sm overflow-hidden ${className}`}
    >
      <div className={`h-1 w-full bg-gradient-to-r ${a.bar}`} />
      <div className='flex items-start gap-3 px-4 pt-3 pb-2 border-b'>
        <div className={`w-8 h-8 rounded-lg ${a.iconBg} ${a.iconText} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div className='flex-1 min-w-0'>
          <h3 className='font-semibold text-sm text-gray-800'>{title}</h3>
          {subtitle && <p className='text-[11px] text-gray-500'>{subtitle}</p>}
        </div>
      </div>
      <div className='p-4'>{children}</div>
    </motion.div>
  );
}
