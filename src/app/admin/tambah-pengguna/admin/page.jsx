import TambahPenggunaForm from '../components/TambahPenggunaForm';

export const metadata = {
  title: 'Tambah Pengguna Admin',
};

export default function TambahPenggunaAdminPage() {
  return (
    <div className="space-y-6">
      <TambahPenggunaForm role="admin" />
    </div>
  );
}
