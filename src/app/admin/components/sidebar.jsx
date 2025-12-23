'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { House, Users, History } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuthContext();

  const menuItems = [
    {
      name: 'Beranda',
      href: '/admin/dashboard',
      icon: <House className='w-5 h-5' />,
    },
    {
      name: 'Semua Siswa',
      href: '/admin/semua-siswa',
      icon: <Users className='w-5 h-5' />,
    },
    {
      name: 'Semua Guru',
      href: '/admin/semua-guru',
      icon: <Users className='w-5 h-5' />,
    },
    {
      name: 'Aktivitas',
      href: '/admin/aktivitas',
      icon: <History className='w-5 h-5' />,
    },
  ];

  return (
    <aside className='fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-30'>
      <nav className='flex flex-col h-full'>
        {/* Menu Title */}
        <div className='px-6 py-4'>
          <h2 className='text-lg font-semibold text-gray-600'>Menu</h2>
        </div>

        {/* Menu Items */}
        <div className='flex-1 px-3'>
          {menuItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${isActive ? 'bg-gray-200 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className='p-3 mb-4'>
          <button
            onClick={logout}
            className='flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
              />
            </svg>
            <span className='font-medium'>Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
