'use client';

import AdminLayout from '../../adminLayout';
import TambahPenggunaForm from '../components/TambahPenggunaForm';

export default function TambahPenggunaAdminPage() {
  return (
    <AdminLayout>
      <TambahPenggunaForm role="admin" />
    </AdminLayout>
  );
}
