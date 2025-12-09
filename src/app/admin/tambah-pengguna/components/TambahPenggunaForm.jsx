'use client';

import { useState } from 'react';
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
import { useRouter } from 'next/navigation';

export default function TambahPenggunaForm({ role = 'general' }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    password: '',
    role: role === 'general' ? '' : role,
    jurusan: '',
    tingkat: '',
    kelas: '',
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission here
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
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
        <Link href="/admin/dashboard" className="text-gray-500 hover:text-blue-600">Daftar Pengguna</Link>
        <span className="text-gray-400">›</span>
        <span>{getPageTitle()}</span>
      </div>

      <form onSubmit={handleSubmit} className="w-full" autoComplete="off" noValidate>
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
          <Input
            id="username"
            type="text"
            name="username"
            placeholder="Username *"
            value={formData.username}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      {/* Row 2: Password and Role */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="masukan password *"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => handleSelectChange('role', value)}
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
                  <SelectItem value="ipa">IPA</SelectItem>
                  <SelectItem value="ips">IPS</SelectItem>
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
      <div className="flex gap-4 justify-end mt-8 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
        >
          Batalkan
        </Button>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700"
        >
          Konfirmasi
        </Button>
      </div>
      </form>
    </div>
  );
}
