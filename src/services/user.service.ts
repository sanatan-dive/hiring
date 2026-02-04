import prisma from '@/lib/db/prisma';

export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
    include: {
      resumes: {
        include: {
          parsedSkills: true,
          parsedExperiences: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      jobPreferences: true,
      socialLinks: true,
      projects: true,
      subscription: true,
    },
  });
}

export async function createUser(data: {
  clerkId: string;
  email: string;
  name?: string;
  imageUrl?: string;
}) {
  return prisma.user.create({
    data: {
      clerkId: data.clerkId,
      email: data.email,
      name: data.name,
      imageUrl: data.imageUrl,
    },
  });
}

export async function updateUser(
  clerkId: string,
  data: { name?: string; email?: string; imageUrl?: string; skills?: string[] }
) {
  return prisma.user.update({
    where: { clerkId },
    data,
  });
}

export async function upsertUser(data: {
  clerkId: string;
  email: string;
  name?: string;
  imageUrl?: string;
}) {
  return prisma.user.upsert({
    where: { clerkId: data.clerkId },
    update: {
      email: data.email,
      name: data.name,
      imageUrl: data.imageUrl,
    },
    create: {
      clerkId: data.clerkId,
      email: data.email,
      name: data.name,
      imageUrl: data.imageUrl,
    },
  });
}
