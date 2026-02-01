import prisma from '@/lib/db/prisma';
import { generateEmbedding } from '@/lib/ai/google';

interface ExperienceInput {
  company?: string;
  role?: string;
  duration?: string;
  description?: string;
}

export async function getExperiences(resumeId: string) {
  return prisma.parsedExperience.findMany({
    where: { resumeId },
  });
}

export async function replaceExperiences(resumeId: string, experiences: ExperienceInput[]) {
  // Delete existing
  await prisma.parsedExperience.deleteMany({
    where: { resumeId },
  });

  // Create new
  if (experiences.length > 0) {
    await prisma.parsedExperience.createMany({
      data: experiences.map((exp) => ({
        resumeId,
        company: exp.company || null,
        role: exp.role || null,
        duration: exp.duration || null,
        description: exp.description || null,
      })),
    });
  }
}

export async function getSkills(resumeId: string) {
  return prisma.parsedSkill.findMany({
    where: { resumeId },
  });
}

export async function replaceSkills(resumeId: string, skills: string[]) {
  await prisma.parsedSkill.deleteMany({
    where: { resumeId },
  });

  if (skills.length > 0) {
    await prisma.parsedSkill.createMany({
      data: skills.map((skill) => ({
        resumeId,
        skill,
      })),
    });
  }
}

export async function getOrCreateResume(userId: string, fileName: string = 'manual_entry') {
  const existing = await prisma.resume.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) return existing;

  return prisma.resume.create({
    data: {
      userId,
      fileName,
      fileUrl: null,
      rawText: null,
    },
  });
}

export async function updateResumeEmbedding(resumeId: string, text: string) {
  if (!text) return;

  const vector = await generateEmbedding(text);
  if (!vector) return;

  // Use raw query to update vector
  const vectorString = `[${vector.join(',')}]`;
  await prisma.$executeRaw`
    UPDATE resumes 
    SET embedding = ${vectorString}::vector 
    WHERE id = ${resumeId}
  `;
}
