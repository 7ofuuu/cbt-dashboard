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
import request from '@/utils/request';
import toast from 'react-hot-toast';
import { Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, RotateCcw, Upload } from 'lucide-react';
import BatchImportDialog from '@/components/admin/BatchImportDialog';

export default function TambahPenggunaForm({ role = 'general' }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  // Debug: Log role to verify it's being passed correctly
  useEffect(() => {
    console.log('🔍 TambahPenggunaForm role:', role);
    console.log('🔍 Should show batch import button:', role === 'admin');
  }, [role]);
  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    password: '',
    role: role === 'general' ? '' : role,
    jurusan: '',
    tingkat: '',
    kelas: '',
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
    if (!formData.username || formData.username.length < 4) {
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
      const isTaken = response.data.users?.some(u => u.username === username);
      setUsernameAvailable(!isTaken);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResetForm = () => {
    setFormData({
      nama: '',
      username: '',
      password: '',
      role: role === 'general' ? '' : role,
      jurusan: '',
      tingkat: '',
      kelas: '',
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
        nama: formData.nama,
      };

      // Add siswa-specific fields
      if (formData.role === 'siswa') {
        payload.kelas = formData.kelas;
        payload.tingkat = formData.tingkat;
        payload.jurusan = formData.jurusan;
      }

      // Call backend API
      const response = await request.post('/users', payload);

      toast.success('Pengguna berhasil ditambahkan!');
      console.log('User created:', response.data);

      // Reset form after success
      handleResetForm();

    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error?.response?.data?.error || 'Gagal menambahkan pengguna';
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
      case 'guru':
        return 'Tambah Pengguna Guru';
      case 'siswa':
        return 'Tambah Pengguna Siswa';
      default:
        return 'Tambah Pengguna';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <h2 className="text-2xl font-semibold text-gray-900">{getPageTitle()}</h2>

      <form onSubmit={handleSubmitClick} className="w-full" autoComplete="off" noValidate>
      {/* Row 1: Nama and Username */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <Label htmlFor="nama">Nama</Label>
          <Input
            id="nama"
            type="text"
            name="nama"
            placeholder="masukan nama *"
            value={formData.nama}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <Input
              id="username"
              type="text"
              name="username"
              placeholder="Username *"
              value={formData.username}
              onChange={handleInputChange}
              required
              minLength={4}
              className="pr-10"
            />
            {formData.username.length >= 4 && (
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
          {formData.username.length >= 4 && usernameAvailable === false && (
            <p className="text-xs text-red-500">Username sudah digunakan</p>
          )}
          {formData.username.length >= 4 && usernameAvailable === true && (
            <p className="text-xs text-green-500">Username tersedia</p>
          )}
        </div>
      </div>

      {/* Row 2: Password and Role */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="masukan password *"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={6}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {/* Password Strength Indicator */}
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
              <p className={`text-xs ${
                passwordStrength.strength <= 2 ? 'text-red-500' : 
                passwordStrength.strength <= 3 ? 'text-yellow-500' : 
                'text-green-500'
              }`}>
                Kekuatan: {passwordStrength.label}
              </p>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => handleSelectChange('role', value)}
            disabled={role !== 'general'}
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="Pilih Role *" />
            </SelectTrigger>
            <SelectContent className="w-full">
              <SelectItem value="guru">Guru</SelectItem>
              <SelectItem value="siswa">Siswa</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Additional fields for Siswa role */}
      {formData.role === 'siswa' && (
        <>
          {/* Row 3: Jurusan and Tingkat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="jurusan">Jurusan</Label>
              <Select
                value={formData.jurusan}
                onValueChange={(value) => handleSelectChange('jurusan', value)}
              >
                <SelectTrigger id="jurusan">
                  <SelectValue placeholder="Pilih Jurusan *" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="IPA">IPA</SelectItem>
                  <SelectItem value="IPS">IPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tingkat">Tingkat</Label>
              <Select
                value={formData.tingkat}
                onValueChange={(value) => handleSelectChange('tingkat', value)}
              >
                <SelectTrigger id="tingkat">
                  <SelectValue placeholder="Pilih Tingkat *" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="X">X</SelectItem>
                  <SelectItem value="XI">XI</SelectItem>
                  <SelectItem value="XII">XII</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: Kelas */}
          <div className="mb-6">
            <div className="space-y-2">
              <Label htmlFor="kelas">Kelas</Label>
              <Input
                id="kelas"
                type="text"
                name="kelas"
                placeholder="contoh: IPA 01 *"
                value={formData.kelas}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </>
      )}

      {/* Form Actions */}
      <div className="flex gap-4 justify-between mt-8 pt-6 border-t border-gray-200">
        {/* Left side: Batch Import Button (always visible when role is selected) */}
        <div>
          {formData.role && formData.role !== 'general' && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBatchImport(true)}
              className="gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
            >
              <Upload className="h-4 w-4" />
              Import CSV/Excel
            </Button>
          )}
        </div>
        
        {/* Right side: Action buttons */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleResetForm}
            disabled={isLoading}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Form
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Batalkan
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isLoading || (usernameAvailable === false) || checkingUsername}
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
            <AlertDialogDescription className="space-y-2">
              <p>Apakah Anda yakin ingin menambahkan pengguna dengan data berikut?</p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Nama:</span>
                  <span>{formData.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Username:</span>
                  <span>{formData.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Role:</span>
                  <span className="capitalize">{formData.role}</span>
                </div>
                {formData.role === 'siswa' && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium">Kelas:</span>
                      <span>{formData.kelas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Tingkat:</span>
                      <span>{formData.tingkat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Jurusan:</span>
                      <span>{formData.jurusan}</span>
                    </div>
                  </>
                )}
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
