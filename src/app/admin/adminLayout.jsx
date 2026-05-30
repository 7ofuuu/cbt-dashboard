'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from './components/header';
import Sidebar from './components/sidebar';
import { PageTransition } from '@/components/motion/page-transition';

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className='min-h-screen bg-gray-50'>
      <Header />
      <Sidebar />
      <main className='ml-64 mt-16 p-6'>
        <PageTransition key={pathname}>{children}</PageTransition>
      </main>
    </div>
  );
}
