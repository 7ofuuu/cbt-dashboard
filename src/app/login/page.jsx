'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Eye, EyeOff, School, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import request from '@/utils/request';
import { resolvePreviewUrl } from '@/components/ImageUploader';
import useSchoolProfile from '@/hooks/useSchoolProfile';
import { useAuthContext } from '@/contexts/AuthContext';
import { PageTransition } from '@/components/motion/page-transition';

const PRIMARY = '#03356C';

export default function LoginPage() {
  const router = useRouter();
  const { login: authLogin } = useAuthContext();

  const [showPassword, setShowPassword] = useState(false);
  const [data, setData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [logoError, setLogoError] = useState(false);

  // Pull the school identity from the same source used by the dashboard headers,
  // so the logo + name shown here stay in sync with the school-profile feature.
  const { profile: school } = useSchoolProfile();
  const schoolName = school?.school_name || 'CBT Dashboard';
  const logoUrl = school?.logo_url || '';

  const usernameRef = useRef(null);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    const token = Cookies.get('token');
    const userStr = Cookies.get('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const role = user.role?.toLowerCase();
        if (role === 'admin') {
          router.replace('/admin/dashboard');
        } else if (role === 'teacher') {
          router.replace('/teacher/dashboard');
        }
      } catch {
        // Invalid cookie data, stay on login
      }
    }
  }, [router]);

  // A freshly-loaded (or freshly-updated) logo deserves another paint attempt.
  useEffect(() => {
    setLogoError(false);
  }, [logoUrl]);

  const onSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await request.post('/auth/login', {
        username: data.username.trim(),
        password: data.password,
      });

      if (response?.data) {
        const { token, user, message: apiMessage } = response.data;

        if (token && user) {
          // Ensure username is included (fallback to form input)
          if (!user.username) {
            user.username = data.username.trim();
          }
          // Use AuthContext login method
          authLogin(token, user);

          setMessage({
            type: 'success',
            text: apiMessage || 'Login berhasil! Mengarahkan ke dashboard...',
          });

          // Role-based routing
          const role = user.role?.toLowerCase();
          setTimeout(() => {
            if (role === 'student') {
              // Students use the mobile app, not the web dashboard
              setMessage({ type: 'error', text: 'Siswa harus menggunakan aplikasi mobile untuk mengerjakan ujian.' });
              return;
            } else if (role === 'teacher') {
              router.push('/teacher/dashboard');
            } else if (role === 'admin') {
              router.push('/admin/dashboard');
            } else {
              // Unknown role - redirect to login instead of admin dashboard
              setMessage({ type: 'error', text: 'Role tidak dikenali. Silakan hubungi administrator.' });
              return;
            }
          }, 1000);
        }
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || error?.response?.data?.error || 'Login gagal. Periksa username/password kamu.',
      });
      // Clear password but keep username so the user doesn't have to retype it,
      // and return focus to the form so the fix is one keystroke away.
      setData(prev => ({ ...prev, password: '' }));
      usernameRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const showLogo = logoUrl && !logoError;
  const logoSrc = resolvePreviewUrl(logoUrl);

  const LogoMark = ({ size = 'md' }) => {
    const box = size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';
    const icon = size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
    return showLogo ? (
      <div className={`${box} rounded-2xl bg-white p-2 flex items-center justify-center shadow-sm ring-1 ring-black/5`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt={`Logo ${schoolName}`}
          className='max-w-full max-h-full object-contain'
          onError={() => setLogoError(true)}
        />
      </div>
    ) : (
      <div className={`${box} rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20`}>
        <School className={`${icon} text-white`} />
      </div>
    );
  };

  return (
    <PageTransition className='min-h-dvh grid lg:grid-cols-2 bg-white'>
      {/* ───────── Branded panel (desktop) ───────── */}
      <div
        className='relative hidden lg:flex flex-col justify-between overflow-hidden p-12 text-white'
        style={{ backgroundImage: `linear-gradient(135deg, ${PRIMARY} 0%, #064a91 55%, #11B1E2 130%)` }}
      >
        {/* Decorative glows */}
        <div className='absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl' />
        <div className='absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-cyan-300/20 blur-3xl' />

        <div className='relative flex items-center gap-4'>
          <LogoMark size='md' />
          <div>
            <p className='text-[11px] uppercase tracking-[0.2em] text-white/60'>Portal</p>
            <h1 className='text-xl font-bold leading-tight'>{schoolName}</h1>
          </div>
        </div>

        <div className='relative max-w-md'>
          <h2 className='text-4xl font-bold leading-tight'>
            Sistem Ujian Berbasis Komputer
          </h2>
          <p className='mt-4 text-white/80 leading-relaxed'>
            Kelola jadwal ujian, bank soal, peserta, dan hasil ujian siswa dalam satu tempat.
          </p>
        </div>

        <p className='relative text-xs text-white/55'>
          © {new Date().getFullYear()} {schoolName} · CBT System
        </p>
      </div>

      {/* ───────── Form panel ───────── */}
      <div className='flex items-center justify-center p-6 sm:p-10'>
        <div className='w-full max-w-sm'>
          {/* Mobile-only brand header */}
          <div className='lg:hidden flex flex-col items-center text-center mb-8'>
            <div style={{ color: PRIMARY }}>
              <LogoMark size='lg' />
            </div>
            <h1 className='mt-3 text-lg font-bold text-gray-900'>{schoolName}</h1>
          </div>

          <div className='mb-8'>
            <h2 className='text-2xl font-bold text-gray-900'>Masuk</h2>
            <p className='text-sm text-gray-500 mt-1'>Gunakan akun guru atau admin Anda.</p>
          </div>

          <form onSubmit={onSubmit} className='flex flex-col gap-5'>
            {message.text && (
              <div
                role='alert'
                aria-live='assertive'
                className={`flex items-start gap-2.5 p-3 text-sm rounded-lg border ${
                  message.type === 'success'
                    ? 'text-green-700 bg-green-50 border-green-200'
                    : 'text-red-700 bg-red-50 border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className='w-4 h-4 mt-0.5 flex-shrink-0' />
                ) : (
                  <AlertCircle className='w-4 h-4 mt-0.5 flex-shrink-0' />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <div className='grid gap-2'>
              <Label htmlFor='username' className='text-gray-900 font-medium'>
                Username
              </Label>
              <Input
                id='username'
                ref={usernameRef}
                type='text'
                placeholder='Masukan Username'
                required
                maxLength={50}
                autoComplete='username'
                autoFocus
                value={data.username}
                onChange={e => setData({ ...data, username: e.target.value })}
                disabled={isLoading}
                className='h-11 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='password' className='text-gray-900 font-medium'>
                Password
              </Label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Masukan Password'
                  required
                  maxLength={128}
                  autoComplete='current-password'
                  value={data.password}
                  onChange={e => setData({ ...data, password: e.target.value })}
                  disabled={isLoading}
                  className='h-11 pr-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                />
                <button
                  type='button'
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 hover:cursor-pointer transition-colors'
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                </button>
              </div>
            </div>

            <Button
              type='submit'
              disabled={isLoading}
              className='w-full h-11 text-white bg-[#03356C] hover:bg-[#02509E] hover:cursor-pointer mt-1 disabled:opacity-60 disabled:cursor-not-allowed'
            >
              {isLoading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' /> Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}
