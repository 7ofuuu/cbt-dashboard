'use client';

import AdminLayout from '../adminLayout';
import { useAuth } from '@/hooks/useAuth';
import { useAuthContext } from '@/contexts/AuthContext';
import { Users, Activity, GraduationCap, LogIn, Clock, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';
import request from '@/utils/request';

export default function DashboardAdmin() {
  // Protect this page - only admin can access
  useAuth(['admin']);
  const { user: authUser } = useAuthContext();

  const [userCounts, setUserCounts] = useState({
    total: 0,
    admin: 0,
    teacher: 0,
    student: 0,
  });
  const [activityLogs, setActivityLogs] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setLogsLoading(true);

        // Fetch all data in parallel
        const [countRes, logsRes, activeRes] = await Promise.allSettled([
          request.get('/users/count'),
          request.get('/activity-logs?limit=15'),
          request.get('/activity-logs/active-users?hours=24'),
        ]);

        if (countRes.status === 'fulfilled') {
          setUserCounts(countRes.value.data);
        }

        if (logsRes.status === 'fulfilled' && logsRes.value.data.success) {
          setActivityLogs(logsRes.value.data.logs || []);
        }

        if (activeRes.status === 'fulfilled' && activeRes.value.data.success) {
          setActiveUsers(activeRes.value.data.users || []);
        }
      } catch (err) {
      } finally {
        setLoading(false);
        setLogsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return `${diffDays} hari lalu`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'LOGIN': return <LogIn className='w-4 h-4 text-green-500' />;
      case 'LOGOUT': return <LogIn className='w-4 h-4 text-red-500 rotate-180' />;
      default: return <Activity className='w-4 h-4 text-blue-500' />;
    }
  };

  const getActivityBadgeColor = (type) => {
    switch (type) {
      case 'LOGIN': return 'bg-green-100 text-green-700';
      case 'LOGOUT': return 'bg-red-100 text-red-700';
      case 'START_EXAM': return 'bg-blue-100 text-blue-700';
      case 'FINISH_EXAM': return 'bg-purple-100 text-purple-700';
      case 'AUTO_FINISH': return 'bg-orange-100 text-orange-700';
      case 'BLOCK_STUDENT': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Stats data
  const stats = [
    {
      id: 1,
      title: 'Total Siswa',
      value: loading ? '...' : userCounts.student.toString(),
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      id: 2,
      title: 'Total Guru',
      value: loading ? '...' : userCounts.teacher.toString(),
      icon: GraduationCap,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-500',
    },
    {
      id: 3,
      title: 'User Aktif (24 Jam)',
      value: loading ? '...' : activeUsers.length.toString(),
      icon: Monitor,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-500',
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
              <h2 className='text-3xl font-bold mb-2'>Selamat Datang{authUser?.full_name ? `, ${authUser.full_name}` : ''}</h2>
              <p className='text-blue-100'>Selamat datang di dashboard admin. Di sini Anda dapat mengelola seluruh sistem dan memantau aktivitas terbaru.</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
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
          {/* Activity Logs Section */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
              <div className='p-6 border-b border-gray-200 flex items-center justify-between'>
                <h3 className='text-xl font-semibold text-gray-900'>Log Aktivitas Terbaru</h3>
              </div>
              <div className='divide-y divide-gray-100 max-h-[400px] overflow-y-auto'>
                {logsLoading ? (
                  <div className='p-6 text-center text-gray-500'>Memuat log aktivitas...</div>
                ) : activityLogs.length === 0 ? (
                  <div className='p-6 text-center text-gray-500'>Belum ada log aktivitas</div>
                ) : (
                  activityLogs.map((log, idx) => (
                    <div key={log.log_id || idx} className='flex items-center gap-3 px-6 py-3 hover:bg-gray-50'>
                      <div className='flex-shrink-0'>
                        {getActivityIcon(log.activity_type)}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm text-gray-900 truncate'>{log.description}</p>
                        <div className='flex items-center gap-2 mt-0.5'>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${getActivityBadgeColor(log.activity_type)}`}>
                            {log.activity_type}
                          </span>
                          {log.ip_address && (
                            <span className='text-[10px] text-gray-400'>{log.ip_address}</span>
                          )}
                        </div>
                      </div>
                      <div className='flex-shrink-0 text-xs text-gray-400 whitespace-nowrap'>
                        {formatTimeAgo(log.created_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Active Users Section */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
              <div className='p-6 border-b border-gray-200'>
                <h3 className='text-xl font-semibold text-gray-900'>User Aktif</h3>
                <p className='text-sm text-gray-500 mt-1'>Login dalam 24 jam terakhir</p>
              </div>
              <div className='divide-y divide-gray-100 max-h-[400px] overflow-y-auto'>
                {logsLoading ? (
                  <div className='p-6 text-center text-gray-500'>Memuat...</div>
                ) : activeUsers.length === 0 ? (
                  <div className='p-6 text-center text-gray-500'>Tidak ada user aktif</div>
                ) : (
                  activeUsers.map((user, idx) => (
                    <div key={user.user_id || idx} className='flex items-center gap-3 px-6 py-3 hover:bg-gray-50'>
                      <div className='flex-shrink-0'>
                        <div className='w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center'>
                          <span className='text-xs font-bold text-gray-600'>
                            {(user.full_name || user.username || '?')[0].toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-gray-900 truncate'>{user.full_name || user.username}</p>
                        <div className='flex items-center gap-1.5'>
                          <span className='text-[10px] text-gray-400 capitalize'>{user.role}</span>
                          <span className='text-[10px] text-gray-300'>•</span>
                          <span className='text-[10px] text-gray-400'>{formatTimeAgo(user.last_login)}</span>
                        </div>
                      </div>
                      <div className='flex-shrink-0'>
                        <span className='inline-block w-2 h-2 rounded-full bg-green-400'></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
