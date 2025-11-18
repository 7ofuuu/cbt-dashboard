'use client';

import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation'


export default function LoginPage() {
  const router = useRouter();

    const [showPassword, setShowPassword] = useState(false);

    function handleSubmit(event) {
        event.preventDefault();
        router.push('/admin/dashboard');
    }


  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-100 p-4'>
      <Card className='w-full max-w-sm py-8 bg-white'>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className='flex flex-col gap-6'>
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
                className='w-full bg-[#03356C] text-white hover:bg-[#02509E] hover:cursor-pointer mt-2'
              >
                Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
