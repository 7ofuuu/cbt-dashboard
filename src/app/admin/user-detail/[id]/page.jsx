'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '../../adminLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Trash2, Save, Home, ShieldCheck, Power } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import toast from 'react-hot-toast';
import request from '@/utils/request';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { SUBJECT_OPTIONS } from '@/lib/constants';

export default function UserDetailPage() {
  useAuth(['admin']);
  const router = useRouter();
  const params = useParams();
  const userId = params.id;
  const { user: currentUser } = useAuthContext();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  // Super admin protection flags
  const isSuperAdmin = user?.is_super_admin || false;
  const isOwnProfile = currentUser?.id?.toString() === userId?.toString();
  const canEdit = !isSuperAdmin || isOwnProfile;
  const canDelete = !isSuperAdmin;
  const canToggleStatus = !isSuperAdmin && !isOwnProfile;
  const isActive = user?.is_active !== false;

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    role: '',
    major: '',
    grade_level: '',
    classroom: '',
    nomorKelas: '',
    nisn: '',
    nip: '',
    subject: '',
    is_coordinator: false,
  });

  useEffect(() => {
    if (userId) {
      fetchUserDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);

      const response = await request.get(`/users/${userId}`);

      if (response.data.user) {
        const userData = response.data.user;
        setUser(userData);
        // Initialize form data - user data is flat (no nested profile)
        const classroom = userData.classroom || '';

        // Parse classroom to extract nomorKelas (format: X-IPA-1)
        let nomorKelas = '';
        if (classroom) {
          const kelasMatch = classroom.match(/^(X|XI|XII)-(IPA|IPS|Bahasa)-(\d+)$/);
          if (kelasMatch) {
            nomorKelas = kelasMatch[3];
          }
        }

        setFormData({
          full_name: userData.full_name || '',
          username: userData.username || '',
          password: '',
          role: userData.role || '',
          major: userData.major || '',
          grade_level: userData.grade_level || '',
          classroom: classroom,
          nomorKelas: nomorKelas,
          nisn: userData.nisn || '',
          nip: userData.nip || '',
          subject: userData.subject || '',
          is_coordinator: userData.is_coordinator === true,
        });
      }
    } catch (err) {
      setError('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value,
      };

      // Auto-generate classroom when grade_level, major, or nomorKelas changes (for student)
      if (newData.role === 'student' && ['grade_level', 'major', 'nomorKelas'].includes(field)) {
        if (newData.grade_level && newData.major && newData.nomorKelas) {
          newData.classroom = `${newData.grade_level}-${newData.major}-${newData.nomorKelas}`;
        }
      }

      return newData;
    });
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);


      // Prepare update payload - send flat fields (not nested profile)
      const updatePayload = {
        username: formData.username,
        full_name: formData.full_name,
      };

      // Add password if provided
      if (formData.password && formData.password !== '') {
        updatePayload.password = formData.password;
      }

      // Add student-specific fields
      if (formData.role === 'student') {
        updatePayload.major = formData.major;
        updatePayload.grade_level = formData.grade_level;
        updatePayload.classroom = formData.classroom;
        if (formData.nisn !== undefined) updatePayload.nisn = formData.nisn || null;
      }

      // Add teacher-specific fields
      if (formData.role === 'teacher') {
        if (!formData.subject) {
          toast.error('Mata pelajaran wajib diisi untuk guru');
          setSaving(false);
          return;
        }
        updatePayload.subject = formData.subject;
        updatePayload.is_coordinator = formData.is_coordinator;
        if (formData.nip !== undefined) updatePayload.nip = formData.nip || null;
      }


      const response = await request.put(`/users/${userId}`, updatePayload);


      if (response.data.message) {
        toast.success('Data pengguna berhasil diperbarui');
        fetchUserDetail(); // Refresh data
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui data pengguna');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);


      const response = await request.delete(`/users/${userId}`);


      if (response.data.message) {
        toast.success('Pengguna berhasil dihapus');
        setShowDeleteDialog(false);
        const redirectPath = user.role === 'admin' ? '/admin/all-admins' : user.role === 'teacher' ? '/admin/all-teachers' : '/admin/all-students';
        router.push(redirectPath);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus pengguna');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      setTogglingStatus(true);
      const response = await request.patch(`/users/${userId}/status`);
      toast.success(response.data.message || 'Status pengguna berhasil diubah');
      setShowStatusDialog(false);
      fetchUserDetail();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Gagal mengubah status pengguna');
    } finally {
      setTogglingStatus(false);
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

  const isSiswa = user.role === 'student';
  const isGuru = user.role === 'teacher';

  return (
    <AdminLayout>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/admin/dashboard'>
              <Home className='w-4 h-4' />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/admin/${user.role === 'admin' ? 'all-admins' : user.role === 'teacher' ? 'all-teachers' : 'all-students'}`}>
              Daftar {user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Guru' : 'Siswa'}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Detail Pengguna</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='space-y-6'>
        <PageHeader
          title="Detail Pengguna"
          description="Lihat dan edit informasi pengguna"
        />

        {/* User Header Card */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center'>
                <span className='text-xl font-semibold text-indigo-600'>
                  {(user.full_name || user.username).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <div className='flex items-center gap-2'>
                  <h2 className='text-2xl font-bold text-gray-900'>{user.full_name || user.username}</h2>
                  {isSuperAdmin && (
                    <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300'>
                      <ShieldCheck className='w-3.5 h-3.5' />
                      Super Admin
                    </span>
                  )}
                </div>
                <p className='text-sm text-gray-500 lowercase'>{user.role}</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Badge className={isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-200 text-gray-600 border-gray-300'}>
                {isActive ? 'Aktif' : 'Nonaktif'}
              </Badge>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${isSiswa ? 'bg-blue-100 text-blue-700' : isGuru ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                {user.role === 'student' ? 'Siswa' : user.role === 'teacher' ? 'Guru' : 'Admin'}
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
                  htmlFor='full_name'
                  className='text-gray-700'
                >
                  Nama
                </Label>
                <Input
                  id='full_name'
                  type='text'
                  value={formData.full_name}
                  onChange={e => handleInputChange('full_name', e.target.value)}
                  disabled={!canEdit}
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
                  disabled={!canEdit}
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
                  disabled={!canEdit}
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
                <Input
                  id='role'
                  type='text'
                  value={formData.role === 'student' ? 'Siswa' : formData.role === 'teacher' ? 'Guru' : 'Admin'}
                  disabled
                  className='bg-gray-100 border-gray-300 text-gray-600'
                />
              </div>

              {/* Siswa specific fields */}
              {formData.role === 'student' && (
                <>
                  {/* NISN */}
                  <div className='space-y-2'>
                    <Label
                      htmlFor='nisn'
                      className='text-gray-700'
                    >
                      NISN
                    </Label>
                    <Input
                      id='nisn'
                      type='text'
                      placeholder='Nomor Induk Siswa Nasional'
                      value={formData.nisn}
                      onChange={e => handleInputChange('nisn', e.target.value)}
                      disabled={!canEdit}
                      className='bg-white border-gray-300'
                    />
                  </div>

                  {/* Tingkat */}
                  <div className='space-y-2'>
                    <Label
                      htmlFor='grade_level'
                      className='text-gray-700'
                    >
                      Tingkat
                    </Label>
                    <Select
                      value={formData.grade_level}
                      onValueChange={value => handleInputChange('grade_level', value)}
                    >
                      <SelectTrigger className='bg-white border-gray-300'>
                        <SelectValue placeholder="Pilih Tingkat" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='X'>X</SelectItem>
                        <SelectItem value='XI'>XI</SelectItem>
                        <SelectItem value='XII'>XII</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Jurusan */}
                  <div className='space-y-2'>
                    <Label
                      htmlFor='major'
                      className='text-gray-700'
                    >
                      Jurusan
                    </Label>
                    <Select
                      value={formData.major}
                      onValueChange={value => handleInputChange('major', value)}
                    >
                      <SelectTrigger className='bg-white border-gray-300'>
                        <SelectValue placeholder="Pilih Jurusan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='IPA'>IPA</SelectItem>
                        <SelectItem value='IPS'>IPS</SelectItem>
                        <SelectItem value='Bahasa'>Bahasa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Nomor Kelas */}
                  <div className='space-y-2'>
                    <Label
                      htmlFor='nomorKelas'
                      className='text-gray-700'
                    >
                      Nomor Kelas
                    </Label>
                    <Select
                      value={formData.nomorKelas}
                      onValueChange={value => handleInputChange('nomorKelas', value)}
                      disabled={!formData.grade_level || !formData.major}
                    >
                      <SelectTrigger className='bg-white border-gray-300'>
                        <SelectValue placeholder="Pilih Nomor" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                          <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Kelas (Display Only) */}
                  <div className='space-y-2'>
                    <Label className='text-gray-700'>Kelas</Label>
                    <div className='px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 font-medium'>
                      {formData.classroom || <span className='text-gray-400'>Pilih grade_level, major, dan nomor</span>}
                    </div>
                  </div>
                </>
              )}

              {/* Guru specific fields */}
              {formData.role === 'teacher' && (
                <>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='subject'
                      className='text-gray-700'
                    >
                      Mata Pelajaran
                    </Label>
                    <Select
                      value={formData.subject}
                      onValueChange={value => handleInputChange('subject', value)}
                      disabled={!canEdit}
                    >
                      <SelectTrigger className='bg-white border-gray-300'>
                        <SelectValue placeholder='Pilih Mata Pelajaran' />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECT_OPTIONS.map(subject => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label
                      htmlFor='nip'
                      className='text-gray-700'
                    >
                      NIP
                    </Label>
                    <Input
                      id='nip'
                      type='text'
                      placeholder='Nomor Induk Pegawai'
                      value={formData.nip}
                      onChange={e => handleInputChange('nip', e.target.value)}
                      disabled={!canEdit}
                      className='bg-white border-gray-300'
                    />
                  </div>

                  <div className='md:col-span-2 flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-3'>
                    <Checkbox
                      id='is_coordinator'
                      checked={formData.is_coordinator}
                      onCheckedChange={checked => handleInputChange('is_coordinator', checked === true)}
                      disabled={!canEdit}
                    />
                    <div className='space-y-0.5'>
                      <Label htmlFor='is_coordinator' className='text-gray-700'>Koordinator Mata Pelajaran</Label>
                      <p className='text-xs text-gray-500'>Koordinator memiliki akses lintas mata pelajaran.</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Super Admin Warning */}
            {isSuperAdmin && !isOwnProfile && (
              <div className='flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm'>
                <ShieldCheck className='w-4 h-4 flex-shrink-0' />
                <span>Pengguna ini adalah Super Admin. Hanya Super Admin sendiri yang dapat mengedit profil ini.</span>
              </div>
            )}

            {isSuperAdmin && isOwnProfile && (
              <div className='flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm'>
                <ShieldCheck className='w-4 h-4 flex-shrink-0' />
                <span>Anda adalah Super Admin. Akun ini tidak dapat dihapus.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className='flex justify-end gap-4 pt-4'>
              {canToggleStatus && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setShowStatusDialog(true)}
                  disabled={togglingStatus || saving || deleting}
                  className={`flex items-center gap-2 ${isActive ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : 'border-green-300 text-green-700 hover:bg-green-50'}`}
                >
                  <Power className='w-4 h-4' />
                  {isActive ? 'Nonaktifkan' : 'Aktifkan'}
                </Button>
              )}
              {canDelete && (
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
              )}
              <Button
                type='button'
                onClick={handleUpdate}
                disabled={saving || deleting || !canEdit}
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
                Apakah Anda yakin ingin menghapus pengguna <span className='font-semibold text-gray-900'>{user.full_name || user.username}</span>?
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

        {/* Toggle Status Confirmation Dialog */}
        <AlertDialog
          open={showStatusDialog}
          onOpenChange={setShowStatusDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Konfirmasi {isActive ? 'Nonaktifkan' : 'Aktifkan'} Pengguna
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isActive ? (
                  <>
                    Pengguna <span className='font-semibold text-gray-900'>{user.full_name || user.username}</span> akan dinonaktifkan dan tidak dapat login hingga diaktifkan kembali.
                  </>
                ) : (
                  <>
                    Pengguna <span className='font-semibold text-gray-900'>{user.full_name || user.username}</span> akan diaktifkan kembali dan dapat login.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={togglingStatus}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleToggleStatus}
                disabled={togglingStatus}
                className={isActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}
              >
                {togglingStatus ? 'Memproses...' : isActive ? 'Nonaktifkan' : 'Aktifkan'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
