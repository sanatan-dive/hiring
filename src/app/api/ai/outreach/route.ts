import { log } from '@/lib/log';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ratelimit } from '@/lib/ratelimit';

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const VALID_CHANNELS = ['linkedin_dm', 'email_cold', 'twitter_dm'] as const;
type Channel = (typeof VALID_CHANNELS)[number];

const VALID_TARGETS = ['recruiter', 'hiring_manager', 'engineer', 'founder'] as const;
type Target = (typeof VALID_TARGETS)[number];

/**
 * POST /api/ai/outreach
 * Body: {
 *   companyName: string,
 *   jobTitle?: string,           // optional — what role you're applying for
 *   targetRole: 'recruiter' | 'hiring_manager' | 'engineer' | 'founder',
 *   targetName?: string,         // recipient's name if known
 *   channel: 'linkedin_dm' | 'email_cold' | 'twitter_dm',
 *   customAngle?: string,        // e.g. "we're both ex-Stripe"
 * }
 *
 * Generates a short, personal outreach message. NOT auto-sent — copied to
 * clipboard for the user to send manually.
 *
 * Pro-only, 20/day rate-limited (shared bucket with cover letter).
 */
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        subscription: true,
        resumes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { parsedSkills: true, parsedExperiences: true },
        },
      },
    });

    const isPro = user?.subscription?.plan === 'PRO' && user?.subscription?.status === 'active';
    if (!isPro) {
      return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });
    }

    const { success, remaining, reset } = await ratelimit.aiPro.limit(`ai:outreach:${clerkId}`);
    if (!success) {
      return NextResponse.json(
        { error: 'Daily AI limit reached (20/day)', retryAfter: reset },
        { status: 429, headers: { 'X-RateLimit-Remaining': remaining.toString() } }
      );
    }

    const body = await req.json();
    const companyName: string = body.companyName ?? '';
    const jobTitle: string | undefined = body.jobTitle;
    const targetRole: Target = VALID_TARGETS.includes(body.targetRole)
      ? body.targetRole
      : 'recruiter';
    const targetName: string | undefined = body.targetName;
    const channel: Channel = VALID_CHANNELS.includes(body.channel) ? body.channel : 'linkedin_dm';
    const customAngle: string | undefined = body.customAngle;

    if (!companyName.trim()) {
      return NextResponse.json({ error: 'companyName required' }, { status: 400 });
    }

    if (!genAI) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const resume = user.resumes[0];
    const experienceLine = resume?.parsedExperiences?.[0]
      ? `${resume.parsedExperiences[0].role} at ${resume.parsedExperiences[0].company}`
      : 'experienced engineer';
    const topSkills = resume?.parsedSkills?.slice(0, 5).map((s) => s.skill).join(', ') || '';

    const channelGuidance = {
      linkedin_dm: 'Max 300 chars. Professional but conversational. End with a single clear ask.',
      email_cold: 'Max 150 words. Subject line + body. Concrete, specific, no fluff.',
      twitter_dm: 'Max 280 chars. Casual but respectful. Reference something specific.',
    }[channel];

    const targetGuidance = {
      recruiter: 'Reach out about an open role. Express interest, summarize fit in 1 sentence.',
      hiring_manager: 'Reach out directly about an open role. Lead with a specific accomplishment relevant to their team.',
      engineer: 'Reach out for a coffee chat / referral. Reference their work specifically. No direct ask for a job.',
      founder: 'Reach out about the company mission. Lead with why their problem space resonates. Ask for 15 min.',
    }[targetRole];

    const prompt = `Write a brief outreach message from a job seeker. Output ONLY the message — no markdown, no quotes, no labels.

CONTEXT:
- Sender: ${user.name ?? 'A candidate'} — ${experienceLine}${topSkills ? `, skilled in ${topSkills}` : ''}
- Target: ${targetName ? `${targetName} (${targetRole.replace('_', ' ')})` : `a ${targetRole.replace('_', ' ')}`} at ${companyName}
- Channel: ${channel.replace('_', ' ')}
${jobTitle ? `- Specific role of interest: ${jobTitle}` : ''}
${customAngle ? `- Personal angle to weave in: ${customAngle}` : ''}

GUIDANCE:
- ${channelGuidance}
- ${targetGuidance}
- Use the sender's name only if signing off (e.g. "— Sarah")
- Avoid: "I hope this message finds you well", "I came across your profile", em-dashes for emphasis, generic flattery
- Be specific. Reference one concrete thing about ${companyName} or the role.
- End with a clear, low-friction ask (e.g. "open to a 15 min chat next week?")
${channel === 'email_cold' ? 'For email, output as: SUBJECT: <line>\\n\\n<body>' : ''}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    return NextResponse.json(
      { message: text, channel, targetRole },
      { headers: { 'X-RateLimit-Remaining': remaining.toString() } }
    );
  } catch (err) {
    log.error('outreach generation failed', err);
    return NextResponse.json({ error: 'Failed to generate outreach' }, { status: 500 });
  }
}
