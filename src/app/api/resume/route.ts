import { log } from '@/lib/log';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { fileTypeFromBuffer } from 'file-type';

const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_RESUME_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

// GET - Retrieve user's resume and parsed data
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user by Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        resumes: {
          include: {
            parsedSkills: true,
            parsedExperiences: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1, // Get the most recent resume
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const resume = user.resumes[0] || null;

    return NextResponse.json({
      resume: resume
        ? {
            id: resume.id,
            fileName: resume.fileName,
            fileUrl: resume.fileUrl,
            skills: resume.parsedSkills.map((s) => s.skill),
            experiences: resume.parsedExperiences.map((e) => ({
              company: e.company,
              role: e.role,
              duration: e.duration,
              description: e.description,
            })),
          }
        : null,
    });
  } catch (error) {
    log.error('Error fetching resume:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create/update resume record. Supports JSON metadata or a multipart
// upload with a `file` field. When uploading directly we enforce a 5MB cap
// and magic-byte validation (PDF / DOC / DOCX only).
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let fileName: string | undefined;
    let fileUrl: string | undefined;
    let rawText: string | undefined;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');

      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      if (file.size > MAX_RESUME_BYTES) {
        return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 413 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const detected = await fileTypeFromBuffer(buffer);

      if (!detected || !ALLOWED_RESUME_MIME.has(detected.mime)) {
        return NextResponse.json(
          { error: 'Unsupported file type. Only PDF, DOC, DOCX are allowed.' },
          { status: 415 }
        );
      }

      fileName = file.name;
      fileUrl = (formData.get('fileUrl') as string | null) ?? undefined;
      rawText = (formData.get('rawText') as string | null) ?? undefined;
    } else {
      const body = await req.json();
      fileName = body.fileName;
      fileUrl = body.fileUrl;
      rawText = body.rawText;
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      // Create user if not exists (fallback)
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: '', // Will be updated by webhook
        },
      });
    }

    // Create resume record
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        fileName: fileName || 'resume.pdf',
        fileUrl,
        rawText,
      },
    });

    return NextResponse.json({ resume });
  } catch (error) {
    log.error('Error creating resume:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
