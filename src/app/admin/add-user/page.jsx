'use client';

import AdminLayout from '../adminLayout';
import AddUserForm from './components/AddUserForm';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function TambahPenggunaPage() {
  useAuth(['admin']);
  return (
    <AdminLayout>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/admin/dashboard'>
              <Home className='w-4 h-4' />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Tambah Pengguna</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Tambah Pengguna"
        description="Tambahkan pengguna baru (admin, guru, atau siswa) ke sistem CBT"
      />

      <AddUserForm role="general" />
    </AdminLayout>
  );
}
