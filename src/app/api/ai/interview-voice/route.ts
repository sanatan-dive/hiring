import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ratelimit } from '@/lib/ratelimit';
import { log } from '@/lib/log';
import { getVoice } from '@/lib/ai/voices';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PostBody {
  text?: unknown;
  voice?: unknown;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Voice TTS shares the AI Pro daily bucket (20/day). Heavy on bandwidth.
    const limit = await ratelimit.aiPro.limit(`voice:${userId}`);
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Daily voice limit reached. Try again tomorrow.' },
        { status: 429 }
      );
    }

    const body = (await req.json()) as PostBody;
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const voiceId = typeof body.voice === 'string' ? body.voice : 'aria';

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }
    if (text.length > 1000) {
      return NextResponse.json(
        { error: 'text too long (max 1000 chars per request)' },
        { status: 400 }
      );
    }

    const voice = getVoice(voiceId);

    // Lazy-import msedge-tts so the route doesn't crash at build time if the
    // dep isn't installed yet — it lives behind `npm install msedge-tts`.
    let MsEdgeTTS: unknown;
    let OUTPUT_FORMAT: Record<string, string> | undefined;
    try {
      const mod = await import('msedge-tts');
      MsEdgeTTS = mod.MsEdgeTTS;
      OUTPUT_FORMAT = mod.OUTPUT_FORMAT as Record<string, string>;
    } catch (err) {
      log.error('msedge-tts not installed', err);
      return NextResponse.json(
        {
          error:
            'Voice synthesis dependency is not installed. Run `npm install msedge-tts` and redeploy.',
        },
        { status: 501 }
      );
    }

    if (!MsEdgeTTS || !OUTPUT_FORMAT) {
      return NextResponse.json({ error: 'TTS module misconfigured' }, { status: 500 });
    }

    const TTSClass = MsEdgeTTS as new () => {
      setMetadata: (voice: string, fmt: string) => Promise<void>;
      toStream: (text: string) => { audioStream: AsyncIterable<Buffer> };
    };

    const tts = new TTSClass();
    const fmt =
      OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3 ||
      OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3 ||
      'audio-24khz-48kbitrate-mono-mp3';
    await tts.setMetadata(voice.msVoice, fmt);

    const result = tts.toStream(text);

    // Collect the stream into a buffer. Audio for a typical interview question
    // is ~50-200KB so this is fine.
    const chunks: Buffer[] = [];
    for await (const chunk of result.audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
        'X-Voice': voice.msVoice,
      },
    });
  } catch (err) {
    log.error('interview-voice error', err);
    return NextResponse.json({ error: 'Failed to synthesize voice' }, { status: 500 });
  }
}
