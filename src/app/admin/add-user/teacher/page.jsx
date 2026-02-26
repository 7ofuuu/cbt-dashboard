'use client';

import AdminLayout from '../../adminLayout';
import AddUserForm from '../components/AddUserForm';
import { useAuth } from '@/hooks/useAuth';

export default function TambahPenggunaGuruPage() {
  useAuth(['admin']);
  return (
    <AdminLayout>
      <AddUserForm role="teacher" />
    </AdminLayout>
  );
}
