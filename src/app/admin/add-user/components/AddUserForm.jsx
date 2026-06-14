'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import request from '@/utils/request';
import { Checkbox } from '@/components/ui/checkbox';
import { useTaxonomy } from '@/contexts/TaxonomyContext';
import { Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, RotateCcw, Upload } from 'lucide-react';
import BatchImportDialog from './BatchImportDialog';

export default function AddUserForm({ role = 'general' }) {
  const router = useRouter();
  const { subjects, gradeLevels, majors } = useTaxonomy();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkError, setCheckError] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    role: role === 'general' ? '' : role,
    major: '',
    grade_level: '',
    classroom: '',
    nomorKelas: '',
    nisn: '',
    nip: '',
    subject: '',
    is_coordinator: false,
  });

  // Password strength calculation
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Lemah', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Sedang', color: 'bg-yellow-500' };
    return { strength, label: 'Kuat', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Check username availability (debounced)
  useEffect(() => {
    if (!formData.username) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      await checkUsernameAvailability(formData.username);
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username]);

  const checkUsernameAvailability = async (username) => {
    try {
      setCheckingUsername(true);

      const response = await request.get(`/users?username=${username}`);

      // If users found with this username, it's taken
      const isTaken = response.data.data?.some(u => u.username === username);
      setUsernameAvailable(!isTaken);
      setCheckError(null);
    } catch (error) {
      setUsernameAvailable(null);
      setCheckError('Gagal mengecek ketersediaan username');
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value,
      };

      // Auto-generate classroom when grade_level, major, or nomorKelas changes (for siswa)
      if (newData.role === 'student' && ['grade_level', 'major', 'nomorKelas'].includes(name)) {
        if (newData.grade_level && newData.major && newData.nomorKelas) {
          newData.classroom = `${newData.grade_level}-${newData.major}-${newData.nomorKelas}`;
        } else {
          newData.classroom = '';
        }
      }

      // Reset classroom-related fields when role changes
      if (name === 'role' && value !== 'student') {
        newData.grade_level = '';
        newData.major = '';
        newData.classroom = '';
        newData.nomorKelas = '';
      }

      if (name === 'role' && value !== 'teacher') {
        newData.nip = '';
        newData.subject = '';
        newData.is_coordinator = false;
      }

      return newData;
    });
  };

  const handleResetForm = () => {
    setFormData({
      full_name: '',
      username: '',
      password: '',
      role: role === 'general' ? '' : role,
      major: '',
      grade_level: '',
      classroom: '',
      nomorKelas: '',
      nisn: '',
      nip: '',
      subject: '',
      is_coordinator: false,
    });
    setUsernameAvailable(null);
  };

  const handleSubmitClick = (e) => {
    e.preventDefault();
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmDialog(false);
    setIsLoading(true);

    try {
      // Prepare payload
      const payload = {
        username: formData.username,
        password: formData.password,
        role: formData.role,
        full_name: formData.full_name,
      };

      // Add siswa-specific fields
      if (formData.role === 'student') {
        payload.classroom = formData.classroom;
        payload.grade_level = formData.grade_level;
        payload.major = formData.major;
        if (formData.nisn) payload.nisn = formData.nisn;
      }

      // Add guru-specific fields
      if (formData.role === 'teacher') {
        if (!formData.subject) {
          toast.error('Mata pelajaran wajib diisi untuk guru');
          setIsLoading(false);
          return;
        }

        payload.subject = formData.subject;
        payload.is_coordinator = formData.is_coordinator;
        if (formData.nip) payload.nip = formData.nip;
      }

      // Call backend API
      const response = await request.post('/users', payload);

      if (response.data.message) {
        toast.success('Pengguna berhasil ditambahkan!');

        // Reset form after success
        handleResetForm();
      }

    } catch (error) {
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Gagal menambahkan pengguna';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const getPageTitle = () => {
    switch (role) {
      case 'admin':
        return 'Tambah Pengguna Admin';
      case 'teacher':
        return 'Tambah Pengguna Guru';
      case 'student':
        return 'Tambah Pengguna Siswa';
      default:
        return 'Tambah Pengguna';
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmitClick} className="w-full space-y-4" autoComplete="off" noValidate>
        {/* Identity row - Nama / Username / Password / Role fill the full width */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="full_name" className="text-xs">Nama <span className="text-red-500">*</span></Label>
            <Input
              id="full_name"
              type="text"
              name="full_name"
              placeholder="Nama lengkap"
              value={formData.full_name}
              onChange={handleInputChange}
              required
              className="h-10 w-full"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs">Username <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                required
                minLength={4}
                className={`h-10 w-full pr-9 ${
                  usernameAvailable === true
                    ? 'border-green-500 focus-visible:ring-green-500'
                    : usernameAvailable === false
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                }`}
              />
              {formData.username && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingUsername ? (
                    <AlertCircle className="h-4 w-4 text-gray-400 animate-pulse" />
                  ) : usernameAvailable === true ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : usernameAvailable === false ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : null}
                </div>
              )}
            </div>
            {formData.username && usernameAvailable === false && (
              <p className="text-[11px] text-red-500">Username sudah digunakan</p>
            )}
            {formData.username && usernameAvailable === true && (
              <p className="text-[11px] text-green-600">Username tersedia</p>
            )}
            {checkError && <p className="text-[11px] text-yellow-600">{checkError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs">Password <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Min. 6 karakter"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                className="h-10 w-full pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {formData.password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < passwordStrength.strength ? passwordStrength.color : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p
                  className={`text-[11px] ${
                    passwordStrength.strength <= 2
                      ? 'text-red-500'
                      : passwordStrength.strength <= 3
                        ? 'text-yellow-500'
                        : 'text-green-600'
                  }`}
                >
                  Kekuatan: {passwordStrength.label}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role" className="text-xs">Role <span className="text-red-500">*</span></Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleSelectChange('role', value)}
              disabled={role !== 'general'}
            >
              <SelectTrigger id="role" className="h-10 w-full">
                <SelectValue placeholder="Pilih Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">Guru</SelectItem>
                <SelectItem value="student">Siswa</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Student-specific row */}
        {formData.role === 'student' && (
          <div className="rounded-lg border bg-gray-50/40 p-3 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Data Siswa</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nisn" className="text-xs">NISN <span className="text-gray-400">(opsional)</span></Label>
                <Input
                  id="nisn"
                  type="text"
                  name="nisn"
                  placeholder="Nomor Induk Siswa"
                  value={formData.nisn}
                  onChange={handleInputChange}
                  className="h-10 w-full"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="grade_level" className="text-xs">Tingkat <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.grade_level}
                  onValueChange={(value) => handleSelectChange('grade_level', value)}
                >
                  <SelectTrigger id="grade_level" className="h-10 w-full">
                    <SelectValue placeholder="Pilih Tingkat" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevels.map((g) => (
                      <SelectItem key={g.grade_level_id} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="major" className="text-xs">Jurusan <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.major}
                  onValueChange={(value) => handleSelectChange('major', value)}
                >
                  <SelectTrigger id="major" className="h-10 w-full">
                    <SelectValue placeholder="Pilih Jurusan" />
                  </SelectTrigger>
                  <SelectContent>
                    {majors.map((m) => (
                      <SelectItem key={m.major_id} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nomorKelas" className="text-xs">Nomor Kelas <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.nomorKelas || ''}
                  onValueChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      nomorKelas: value,
                      classroom:
                        prev.grade_level && prev.major
                          ? `${prev.grade_level}-${prev.major}-${value}`
                          : '',
                    }));
                  }}
                  disabled={!formData.grade_level || !formData.major}
                >
                  <SelectTrigger id="nomorKelas" className="h-10 w-full">
                    <SelectValue placeholder="Pilih Nomor" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generated classroom preview - compact strip */}
            <div className="flex items-center gap-2 rounded-md border bg-white px-3 py-2">
              <Label className="text-xs text-gray-500 m-0">Kelas:</Label>
              {formData.grade_level && formData.major && formData.nomorKelas ? (
                <span className="text-sm font-semibold text-gray-800 font-mono">
                  {`${formData.grade_level}-${formData.major}-${formData.nomorKelas}`}
                </span>
              ) : (
                <span className="text-xs text-gray-400">Pilih tingkat, jurusan, dan nomor kelas terlebih dahulu</span>
              )}
            </div>
          </div>
        )}

        {/* Teacher-specific row */}
        {formData.role === 'teacher' && (
          <div className="rounded-lg border bg-gray-50/40 p-3 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Data Guru</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs">Mata Pelajaran <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => handleSelectChange('subject', value)}
                >
                  <SelectTrigger id="subject" className="h-10 w-full">
                    <SelectValue placeholder="Pilih Mata Pelajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.subject_id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nip" className="text-xs">NIP <span className="text-gray-400">(opsional)</span></Label>
                <Input
                  id="nip"
                  type="text"
                  name="nip"
                  placeholder="Nomor Induk Pegawai"
                  value={formData.nip}
                  onChange={handleInputChange}
                  className="h-10 w-full"
                />
              </div>
              <label
                htmlFor="is_coordinator"
                className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 cursor-pointer h-10 mt-[22px]"
              >
                <Checkbox
                  id="is_coordinator"
                  checked={formData.is_coordinator}
                  onCheckedChange={(checked) => handleSelectChange('is_coordinator', checked === true)}
                />
                <div className="leading-tight">
                  <span className="text-xs font-medium text-gray-800">Koordinator</span>
                  <p className="text-[10px] text-gray-500">Akses semua mapel</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowBatchImport(true)}
            disabled={!formData.role || formData.role === 'general'}
            className={`gap-2 ${
              formData.role && formData.role !== 'general'
                ? 'bg-green-50 hover:bg-green-100 text-green-700 border-green-300'
                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
          >
            <Upload className="h-4 w-4" />
            Import CSV/Excel
          </Button>

          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetForm}
              disabled={isLoading}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Batalkan
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading || usernameAvailable === false || checkingUsername}
            >
              {isLoading ? 'Menyimpan...' : 'Konfirmasi'}
            </Button>
          </div>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Tambah Pengguna</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Apakah Anda yakin ingin menambahkan pengguna dengan data berikut?</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Nama:</span>
                    <span>{formData.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Username:</span>
                    <span>{formData.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Role:</span>
                    <span className="capitalize">{formData.role}</span>
                  </div>
                  {formData.role === 'student' && (
                    <>
                      {formData.nisn && (
                        <div className="flex justify-between">
                          <span className="font-medium">NISN:</span>
                          <span>{formData.nisn}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="font-medium">Kelas:</span>
                        <span>{formData.classroom}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Tingkat:</span>
                        <span>{formData.grade_level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Jurusan:</span>
                        <span>{formData.major}</span>
                      </div>
                    </>
                  )}
                  {formData.role === 'teacher' && (
                    <>
                      <div className="flex justify-between">
                        <span className="font-medium">Mata Pelajaran:</span>
                        <span>{formData.subject || '-'}</span>
                      </div>
                      {formData.nip && (
                        <div className="flex justify-between">
                          <span className="font-medium">NIP:</span>
                          <span>{formData.nip}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="font-medium">Koordinator:</span>
                        <span>{formData.is_coordinator ? 'Ya' : 'Tidak'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit} className="bg-blue-600 hover:bg-blue-700">
              Ya, Tambahkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Import Dialog */}
      <BatchImportDialog
        open={showBatchImport}
        onOpenChange={setShowBatchImport}
        role={formData.role}
        onSuccess={() => {
          toast.success('Import berhasil! Data telah ditambahkan.');
        }}
      />
    </div>
  );
}
