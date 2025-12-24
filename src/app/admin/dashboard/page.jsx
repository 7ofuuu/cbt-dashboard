'use client';

import Image from 'next/image';
import AdminLayout from '../adminLayout';
import { useAuth } from '@/hooks/useAuth';
import { Users, Laptop, CheckCircle, GraduationCap } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function DashboardAdmin() {
  // Protect this page - only admin can access
  useAuth(['admin']);

  const [userCounts, setUserCounts] = useState({
    total: 0,
    admin: 0,
    guru: 0,
    siswa: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserCounts();
  }, []);

  const fetchUserCounts = async () => {
    try {
      const token = Cookies.get('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_LARAVEL_API}/users/count`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setUserCounts(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching user counts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Stats data
  const stats = [
    {
      id: 1,
      title: 'Total Siswa',
      value: loading ? '...' : userCounts.siswa.toString(),
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      id: 2,
      title: 'Total Guru',
      value: loading ? '...' : userCounts.guru.toString(),
      icon: GraduationCap,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-500',
    },
    {
      id: 3,
      title: 'Ujian Aktif',
      value: '24',
      icon: Laptop,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-500',
    },
  ];

  // Sample exam data - replace with actual data from your backend
  const exams = [
    {
      id: 1,
      subject: 'Matematika Wajib',
      class: 'XII IPA 1',
      participants: '32 / 35',
      status: 'Sedang Berjalan',
      statusColor: 'bg-green-100 text-green-700',
    },
    {
      id: 2,
      subject: 'Bahasa Indonesia',
      class: 'X IPS 2',
      participants: '0 / 30',
      status: 'Menunggu',
      statusColor: 'bg-yellow-100 text-yellow-700',
    },
    {
      id: 3,
      subject: 'Biologi',
      class: 'XI IPA 3',
      participants: '34 / 34',
      status: 'Selesai',
      statusColor: 'bg-gray-100 text-gray-700',
    },
    {
      id: 4,
      subject: 'Sejarah Indonesia',
      class: 'XII IPS 1',
      participants: '28 / 30',
      status: 'Sedang Berjalan',
      statusColor: 'bg-green-100 text-green-700',
    },
  ];

  return (
    <AdminLayout>
      <div className='space-y-6'>
        {/* Welcome Banner */}
        <div className='bg-gradient-to-r from-blue-800 to-blue-600 rounded-xl p-8 text-white'>
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

        {/* Stats Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {stats.map(stat => {
            const IconComponent = stat.icon;
            return (
              <div
                key={stat.id}
                className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
              >
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='text-3xl font-bold text-gray-900 mb-1'>{stat.value}</h3>
                    <p className='text-sm text-gray-500'>{stat.title}</p>
                  </div>
                  <div className={`w-16 h-16 ${stat.bgColor} rounded-full flex items-center justify-center`}>
                    <IconComponent className={`w-8 h-8 ${stat.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Ujian Berlangsung Section */}
          <div className='lg:col-span-3'>
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
              <div className='p-6 border-b border-gray-200 flex items-center justify-between'>
                <h3 className='text-xl font-semibold text-gray-900'>Ujian Berlangsung</h3>
                <button className='px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors'>Lihat Semua</button>
              </div>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Mata Pelajaran</th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Kelas</th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Peserta Login</th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Status</th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {exams.map(exam => (
                      <tr
                        key={exam.id}
                        className='hover:bg-gray-50'
                      >
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>{exam.subject}</td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600'>{exam.class}</td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600'>{exam.participants}</td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${exam.statusColor}`}>{exam.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
    