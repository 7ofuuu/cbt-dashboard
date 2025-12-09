import TambahPenggunaForm from '../components/TambahPenggunaForm';

export const metadata = {
  title: 'Tambah Pengguna Guru',
};

export default function TambahPenggunaGuruPage() {
  return (
    <div className="space-y-6">
      <TambahPenggunaForm role="guru" />
    </div>
  );
}
