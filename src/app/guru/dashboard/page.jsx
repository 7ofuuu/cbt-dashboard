'use client';

import GuruLayout from '../guruLayout';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  // Protect this page - only guru can access
  useAuth(['guru']);

  return (
    <GuruLayout>
      <h2 className='text-2xl font-bold'>Dashboard</h2>
      <p>Welcome to the guru dashboard!</p>
    </GuruLayout>
  );
}
