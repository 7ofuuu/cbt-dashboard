import TambahPenggunaForm from '../components/TambahPenggunaForm';

export const metadata = {
  title: 'Tambah Pengguna Siswa',
};

export default function TambahPenggaunaSiswaPage() {
  return (
    <div className="space-y-6">
      <TambahPenggunaForm role="siswa" />
    </div>
  );
}
