import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const userCookie = cookieStore.get('user')?.value;

  if (token && userCookie) {
    try {
      const user = JSON.parse(decodeURIComponent(userCookie));
      const role = user.role?.toLowerCase();
      if (role === 'admin') return redirect('/admin/dashboard');
      if (role === 'teacher') return redirect('/teacher/dashboard');
    } catch {
      // Invalid cookie, fall through to login
    }
  }

  return redirect('/login');
}
