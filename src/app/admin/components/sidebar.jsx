'use client';

import { useState, useRef, useLayoutEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import { House, History, UserPlus, School, UserCog, KeyRound, UsersRound, ChevronDown, Database } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const userMgmtItems = [
  { name: 'Semua Admin', href: '/admin/all-admins' },
  { name: 'Semua Guru', href: '/admin/all-teachers' },
  { name: 'Semua Siswa', href: '/admin/all-students' },
];

const topItems = [
  { name: 'Beranda', href: '/admin/dashboard', icon: <House className='w-5 h-5' /> },
  { name: 'Tambah Pengguna', href: '/admin/add-user', icon: <UserPlus className='w-5 h-5' /> },
];

const BOTTOM_ITEMS_BASE = [
  { name: 'Aktivitas', href: '/admin/activity', icon: <History className='w-5 h-5' /> },
  { name: 'Master Data', href: '/admin/master-data', icon: <Database className='w-5 h-5' /> },
  { name: 'Profil Sekolah', href: '/admin/school-profile', icon: <School className='w-5 h-5' /> },
  // Profil Saya - super-admin only (inserted at render time)
  { name: 'Ubah Password', href: '/admin/change-password', icon: <KeyRound className='w-5 h-5' /> },
];

const PROFILE_ITEM = { name: 'Profil Saya', href: '/admin/profile', icon: <UserCog className='w-5 h-5' /> };

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuthContext();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Profil Saya is reserved for the super admin only.
  const bottomItems = useMemo(() => {
    if (!user?.is_super_admin) return BOTTOM_ITEMS_BASE;
    // Insert "Profil Saya" right after "Profil Sekolah"
    const out = [...BOTTOM_ITEMS_BASE];
    const idx = out.findIndex(i => i.href === '/admin/school-profile');
    out.splice(idx + 1, 0, PROFILE_ITEM);
    return out;
  }, [user?.is_super_admin]);

  const isUserMgmtPath = userMgmtItems.some(item => item.href === pathname);
  const [groupOpen, setGroupOpen] = useState(() => isUserMgmtPath);

  // Auto-open the group when navigating into one of its sub-pages. Comparing the
  // previous pathname in state (not a ref) is the React-recommended way to adjust
  // state during render without an effect.
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    if (isUserMgmtPath) setGroupOpen(true);
  }

  const containerRef = useRef(null);
  const itemRefs = useRef({});
  const groupBtnRef = useRef(null);
  const [indicator, setIndicator] = useState({ top: 0, height: 0, visible: false });

  // Measure the active item's position relative to the (scrollable) container so
  // the highlight is placed in container coordinates - correct regardless of
  // scroll offset (fixes the bottom->top jump).
  const measureIndicator = () => {
    const container = containerRef.current;
    // Normally the highlight tracks the link matching the current path. But when
    // the path is a User Management child AND the group is collapsed, that child
    // is hidden - so track the parent toggle button instead, letting the
    // highlight slide up to it as the dropdown closes.
    const activeEl =
      isUserMgmtPath && !groupOpen ? groupBtnRef.current : itemRefs.current[pathname];
    if (!container || !activeEl) {
      setIndicator(prev => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const elRect = activeEl.getBoundingClientRect();
    setIndicator({
      top: elRect.top - containerRect.top + container.scrollTop,
      height: elRect.height,
      visible: true,
    });
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- positioning the highlight requires reading DOM layout then committing it to state
  useLayoutEffect(measureIndicator, [pathname, groupOpen, isUserMgmtPath]);

  // Hold the latest measureIndicator in a ref (updated in an effect, never during
  // render). The panel's onAnimationComplete must re-measure after the expand
  // animation so items BELOW the panel - pushed down as it grows - land correctly.
  // But AnimatePresence keeps the OLD panel mounted for its exit animation, whose
  // onAnimationComplete carries a stale closure (groupOpen=true). Calling through
  // this ref always runs the current closure, so closing no longer bounces back.
  const measureRef = useRef(measureIndicator);
  useLayoutEffect(() => {
    measureRef.current = measureIndicator;
  });

  const linkClass = (isActive, extra = '') =>
    `relative z-10 flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
      isActive ? 'text-sky-900 font-medium' : 'text-gray-600 hover:bg-gray-100/60'
    } ${extra}`;

  const renderIcon = icon => (
    <motion.span
      className='relative z-10 flex items-center'
      whileHover={{ scale: 1.08 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {icon}
    </motion.span>
  );

  return (
    <aside className='fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-30'>
      <nav className='flex flex-col h-full'>
        {/* Menu Title */}
        <div className='px-6 py-4'>
          <h2 className='text-lg font-semibold text-gray-600'>Menu</h2>
        </div>

        {/* Menu Items */}
        <div ref={containerRef} className='relative flex-1 px-3 overflow-y-auto'>
          {/* Single shared highlight indicator */}
          {indicator.visible && (
            <>
              <motion.span
                className='absolute left-3 right-3 bg-sky-100 rounded-lg pointer-events-none z-0'
                initial={false}
                animate={{ top: indicator.top, height: indicator.height }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
              <motion.span
                className='absolute left-3 w-1 bg-sky-600 rounded-r-full pointer-events-none z-0'
                initial={false}
                animate={{ top: indicator.top + 8, height: Math.max(indicator.height - 16, 0) }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            </>
          )}

          {topItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                ref={el => { itemRefs.current[item.href] = el; }}
                className={linkClass(isActive)}
              >
                {renderIcon(item.icon)}
                <span className='relative z-10'>{item.name}</span>
              </Link>
            );
          })}

          {/* User Management group */}
          <button
            type='button'
            ref={groupBtnRef}
            onClick={() => setGroupOpen(open => !open)}
            className={`relative z-10 flex items-center gap-3 w-full px-4 py-3 rounded-lg mb-1 transition-colors ${
              isUserMgmtPath ? 'text-sky-900 font-medium' : 'text-gray-600 hover:bg-gray-100/60'
            }`}
          >
            {renderIcon(<UsersRound className='w-5 h-5' />)}
            <span className='relative z-10 flex-1 text-left'>Manajemen Pengguna</span>
            <motion.span
              className='relative z-10'
              animate={{ rotate: groupOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className='w-4 h-4' />
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {groupOpen && (
              <motion.div
                key='user-mgmt-group'
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className='overflow-hidden'
                onAnimationComplete={() => measureRef.current()}
              >
                {userMgmtItems.map(item => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      ref={el => { itemRefs.current[item.href] = el; }}
                      className={linkClass(isActive, 'pl-11')}
                    >
                      <span className='relative z-10 text-sm'>{item.name}</span>
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {bottomItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                ref={el => { itemRefs.current[item.href] = el; }}
                className={linkClass(isActive)}
              >
                {renderIcon(item.icon)}
                <span className='relative z-10'>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Logout Button */}
        <div className='p-3 mb-4'>
          <button
            onClick={() => setShowLogoutDialog(true)}
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

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar dari sistem? Anda perlu login kembali untuk mengakses dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={logout}
              className='bg-red-600 hover:bg-red-700'
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
