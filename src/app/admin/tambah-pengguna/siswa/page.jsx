'use client';

import AdminLayout from '../../adminLayout';
import TambahPenggunaForm from '../components/TambahPenggunaForm';

export default function TambahPenggaunaSiswaPage() {
  return (
    <AdminLayout>
      <TambahPenggunaForm role="siswa" />
    </AdminLayout>
  );
}
