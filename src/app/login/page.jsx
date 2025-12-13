'use client';

import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import request from '@/utils/request';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [data, setData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const onSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await request.post('/auth/login', {
        username: data.username,
        password: data.password,
      });

      console.log('API Response:', response.data);

      if (response?.data) {
        const { token, user, message: apiMessage } = response.data;

        if (token && user) {
          // Store token and user data
          Cookies.set('token', token);
          Cookies.set('user', JSON.stringify(user));
          Cookies.set('username', data.username);

          // Store user profile if available
          if (user.profile) {
            localStorage.setItem('userProfile', JSON.stringify(user.profile));
          }

          setMessage({
            type: 'success',
            text: apiMessage || 'Login berhasil! Mengarahkan ke dashboard...',
          });

          // Role-based routing
          const role = user.role?.toLowerCase();
          setTimeout(() => {
            if (role === 'admin') {
              router.push('/admin/dashboard');
            } else if (role === 'guru') {
              router.push('/guru/dashboard');
            } else {
              router.push('/admin/dashboard'); // Default fallback
            }
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Login gagal. Periksa username/password kamu.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-100 p-4'>
      <Card className='w-full max-w-sm py-8 bg-white'>
        <CardContent>
          <form onSubmit={onSubmit}>
            <div className='flex flex-col gap-6'>
              {message.text && <div className={`p-3 text-sm rounded-md ${message.type === 'success' ? 'text-green-600 bg-green-50 border border-green-200' : 'text-red-600 bg-red-50 border border-red-200'}`}>{message.text}</div>}
              <div className='grid gap-2'>
                <Label
                  htmlFor='username'
                  className='text-gray-900 font-medium'
                >
                  Username
                </Label>
                <Input
                  id='username'
                  type='text'
                  placeholder='Masukan Username'
                  required
                  value={data.username}
                  onChange={e => setData({ ...data, username: e.target.value })}
                  disabled={isLoading}
                  className='bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                />
              </div>
              <div className='grid gap-2'>
                <div className='flex items-center'>
                  <Label
                    htmlFor='password'
                    className='text-gray-900 font-medium'
                  >
                    Password
                  </Label>
                </div>
                <div className='relative'>
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Masukan Password'
                    required
                    value={data.password}
                    onChange={e => setData({ ...data, password: e.target.value })}
                    disabled={isLoading}
                    className='pr-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                  />
                  <button
                    type='button'
                    tabIndex={-1}
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
                className='w-full bg-[#03356C] text-white hover:bg-[#02509E] hover:cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
