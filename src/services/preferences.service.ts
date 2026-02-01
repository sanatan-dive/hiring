import prisma from '@/lib/db/prisma';

interface PreferencesData {
  desiredRoles?: string[];
  experienceLevel?: string;
  workLocation?: string;
  locations?: string[];
  salaryRange?: { min: number; max: number; currency: string };
  jobType?: string;
}

export async function getPreferences(userId: string) {
  return prisma.jobPreferences.findUnique({
    where: { userId },
  });
}

export async function upsertPreferences(userId: string, data: PreferencesData) {
  return prisma.jobPreferences.upsert({
    where: { userId },
    update: {
      desiredRoles: data.desiredRoles,
      experienceLevel: data.experienceLevel,
      workLocation: data.workLocation,
      locations: data.locations,
      salaryMin: data.salaryRange?.min,
      salaryMax: data.salaryRange?.max,
      salaryCurrency: data.salaryRange?.currency,
      jobType: data.jobType,
    },
    create: {
      userId,
      desiredRoles: data.desiredRoles || [],
      experienceLevel: data.experienceLevel || 'mid',
      workLocation: data.workLocation || 'remote',
      locations: data.locations || [],
      salaryMin: data.salaryRange?.min || 70000,
      salaryMax: data.salaryRange?.max || 120000,
      salaryCurrency: data.salaryRange?.currency || 'USD',
      jobType: data.jobType || 'full-time',
    },
  });
}
