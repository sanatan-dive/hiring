'use client';

import { useState, useEffect } from 'react';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  skills: string[];
  resume: {
    fileName: string;
    experiences: Array<{
      company: string;
      role: string;
      duration: string;
      description: string;
    }>;
  } | null;
  preferences: {
    desiredRoles: string[];
    experienceLevel: string | null;
    workLocation: string | null;
    salaryRange: { min: number; max: number; currency: string };
    jobType: string | null;
  } | null;
  socialLinks: Array<{ platform: string; url: string }>;
  projects: Array<{
    name: string;
    description: string;
    url: string;
    techUsed: string[];
  }>;
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user');
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data.user);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const refetch = () => fetchProfile();

  return { profile, isLoading, error, refetch };
}

export default useProfile;
