'use client';

import AdminLayout from '../../adminLayout';
import AddUserForm from '../components/AddUserForm';
import { useAuth } from '@/hooks/useAuth';

export default function TambahPenggaunaSiswaPage() {
  useAuth(['admin']);
  return (
    <AdminLayout>
      <AddUserForm role="student" />
    </AdminLayout>
  );
}
