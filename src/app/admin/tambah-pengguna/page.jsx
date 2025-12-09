'use client';

import AdminLayout from '../adminLayout';
import TambahPenggunaForm from './components/TambahPenggunaForm';

export default function TambahPenggunaPage() {
  return (
    <AdminLayout>
      <TambahPenggunaForm role="general" />
    </AdminLayout>
  );
}
