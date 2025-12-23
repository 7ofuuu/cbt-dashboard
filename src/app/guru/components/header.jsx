'use client';

import Image from 'next/image';
import { useAuthContext } from '@/contexts/AuthContext';

export default function Header() {
  const { user } = useAuthContext();

  const userName = user?.profile?.nama_lengkap || user?.username || 'User';
  const userRole = user?.role || 'guru';

  return (
    <header className='fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 h-16'>
      <div className='flex items-center justify-between h-full px-6'>
        {/* Logo and Title */}
        <div className='flex items-center gap-3'>
          <Image
            src='/logo-sekolah.png'
            alt='Logo'
            width={40}
            height={40}
            className='w-10 h-10 object-cover'
          />
          <h1 className='text-xl font-bold text-gray-900'>SMAN 1 Parigi</h1>
        </div>

        {/* User Profile */}
        <div className='flex items-center gap-3'>
          <div className='text-right'>
            <p className='text-sm font-semibold text-gray-900'>{userName}</p>
            <p className='text-xs text-gray-500 capitalize'>{userRole}</p>
          </div>
          <div className='w-10 h-10 rounded-full bg-gray-200 overflow-hidden'>
            <Image
              src='/next.svg'
              alt={userName}
              width={40}
              height={40}
              className='w-full h-full object-cover'
            />
          </div>
        </div>
      </div>
    </header>
  );
}
