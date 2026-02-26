'use client';

import AdminLayout from '../../adminLayout';
import AddUserForm from '../components/AddUserForm';
import { useAuth } from '@/hooks/useAuth';

export default function TambahPenggunaAdminPage() {
  useAuth(['admin']);
  return (
    <AdminLayout>
      <AddUserForm role="admin" />
    </AdminLayout>
  );
}
