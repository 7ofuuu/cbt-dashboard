'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import useSchoolProfile from '@/hooks/useSchoolProfile';
import { School } from 'lucide-react';

export default function Header() {
  const { user } = useAuthContext();
  const { profile: school } = useSchoolProfile();

  const displayName = user?.full_name || user?.profile?.full_name || user?.username || 'User';
  const displayRole = user?.role || 'teacher';

  const schoolName = school?.school_name || 'CBT Dashboard';
  const logoUrl = school?.logo_url || null;

  return (
    <header className='fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 h-16'>
      <div className='flex items-center justify-between h-full px-6'>
        {/* Logo and Title */}
        <div className='flex items-center gap-3'>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt='Logo'
              width={40}
              height={40}
              className='w-10 h-10 object-cover'
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <School className='w-8 h-8 text-blue-600' />
          )}
          <h1 className='text-xl font-bold text-gray-900'>{schoolName}</h1>
        </div>

        {/* User Profile */}
        <div className='flex items-center gap-3'>
          <div className='text-right'>
            <p className='text-sm font-semibold text-gray-900'>{displayName}</p>
            <p className='text-xs text-gray-500 capitalize'>{displayRole}</p>
          </div>
          <div className='w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center'>
            <span className='text-sm font-bold text-sky-600'>
              {(displayName || '?')[0].toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
