'use client';

import AdminLayout from '../../adminLayout';
import TambahPenggunaForm from '../components/TambahPenggunaForm';

export default function TambahPenggunaGuruPage() {
  return (
    <AdminLayout>
      <TambahPenggunaForm role="guru" />
    </AdminLayout>
  );
}
