'use client';

import AdminLayout from '../adminLayout';
import TambahPenggunaForm from './components/TambahPenggunaForm';

export default function TambahPenggunaPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <TambahPenggunaForm role="general" />
      </div>
    </AdminLayout>
  );
}
