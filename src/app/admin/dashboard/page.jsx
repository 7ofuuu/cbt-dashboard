'use client';

import Image from 'next/image';
import AdminLayout from '../adminLayout';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardAdmin() {
  // Protect this page - only admin can access
  useAuth(['admin']);

  // Sample data - replace with actual data from your backend
  const activities = [
    {
      id: 1,
      name: 'Braum Chad',
      class: 'XII',
      subject: 'IPA 01',
      topic: 'Bahasa Indonesia',
      status: 'On Progress',
    },
    {
      id: 2,
      name: 'Braum Chad',
      class: 'XII',
      subject: 'IPA 01',
      topic: 'Bahasa Indonesia',
      status: 'Submitted',
    },
    {
      id: 3,
      name: 'Braum Chad',
      class: 'XII',
      subject: 'IPA 01',
      topic: 'Bahasa Indonesia',
      status: 'Blocked',
    },
  ];

  const users = [
    {
      id: 1,
      name: 'Braum Chad',
      role: 'Admin',
      avatar: '/next.svg',
    },
  ];

  const getStatusStyle = status => {
    switch (status) {
      case 'On Progress':
        return 'bg-yellow-200 text-yellow-800';
      case 'Submitted':
        return 'bg-green-200 text-green-800';
      case 'Blocked':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Welcome Banner */}
        <div className='bg-linear-to-r from-blue-800 to-blue-600 rounded-xl p-8 text-white'>
          <div className='flex items-center gap-6'>
            <div className='w-24 h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden'>
              <svg
                className='w-16 h-16 text-white'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
            <div>
              <h2 className='text-3xl font-bold mb-2'>Selamat Datang Admin</h2>
              <p className='text-blue-100'>Selamat datang di dashboard admin. Di sini Anda dapat mengelola seluruh sistem dan memantau aktivitas terbaru.</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Aktivitas Section */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
              <div className='p-6 border-b border-gray-200'>
                <h3 className='text-xl font-semibold text-gray-900'>Aktivitas</h3>
              </div>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Nama</th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Kelas</th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Mata Pelajaran</th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Topik</th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Status</th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {activities.map(activity => (
                      <tr
                        key={activity.id}
                        className='hover:bg-gray-50'
                      >
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>{activity.name}</td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600'>{activity.class}</td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600'>{activity.subject}</td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600'>{activity.topic}</td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(activity.status)}`}>{activity.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pengguna Section */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
              <div className='p-6 border-b border-gray-200'>
                <h3 className='text-xl font-semibold text-gray-900'>Pengguna</h3>
              </div>
              <div className='p-6'>
                {users.map(user => (
                  <div
                    key={user.id}
                    className='flex items-center gap-4 mb-6'
                  >
                    <div className='w-12 h-12 rounded-full bg-gray-200 overflow-hidden'>
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        width={48}
                        height={48}
                        className='w-full h-full object-cover'
                      />
                    </div>
                    <div>
                      <p className='font-semibold text-gray-900'>{user.name}</p>
                      <p className='text-sm text-gray-500'>{user.role}</p>
                    </div>
                  </div>
                ))}
                <button className='w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-3 px-4 rounded-lg transition-colors'>Lihat Semua Pengguna</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
    