import { useState, useEffect, useCallback } from 'react';
import request from '@/utils/request';

/**
 * Hook to fetch and cache the school profile.
 * Listens for 'school-profile-updated' window events to re-fetch.
 */
export default function useSchoolProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await request.get('/school-profile');
      setProfile(res.data?.data || null);
    } catch {
      // Silently fail — header will show fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    // Re-fetch when admin updates the school profile
    const onUpdate = () => fetchProfile();
    window.addEventListener('school-profile-updated', onUpdate);
    return () => window.removeEventListener('school-profile-updated', onUpdate);
  }, [fetchProfile]);

  return { profile, loading };
}
