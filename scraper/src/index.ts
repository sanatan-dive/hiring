import express, { type Request, type Response, type NextFunction } from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { z } from 'zod';
import { scrapeJob } from './scrapeJob';
import { signCallback } from './sign';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();
app.use(express.json({ limit: '256kb' }));
app.use(pinoHttp({ logger }));

const PORT = Number(process.env.PORT || 3001);
const AUTH_TOKEN = process.env.SCRAPER_AUTH_TOKEN || '';
const CALLBACK_URL = process.env.CALLBACK_URL || '';
const CALLBACK_SECRET = process.env.CALLBACK_SECRET || '';

if (!AUTH_TOKEN) {
  logger.warn(
    'SCRAPER_AUTH_TOKEN is not set — endpoint will reject all requests until configured.'
  );
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || '';
  const expected = `Bearer ${AUTH_TOKEN}`;
  if (!AUTH_TOKEN || auth !== expected) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

const ScrapeBody = z.object({
  url: z.string().url(),
  jobRequestId: z.string().min(1), // correlation id from the Next.js app
  userId: z.string().min(1),
});

/**
 * /scrape — accept a URL, scrape it asynchronously, and POST the result
 * to CALLBACK_URL with an HMAC-SHA256 signature. Responds immediately so
 * the Next.js app's QStash worker isn't held open.
 */
app.post('/scrape', requireAuth, async (req, res) => {
  const parsed = ScrapeBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.issues });
  }
  const { url, jobRequestId, userId } = parsed.data;

  res.status(202).json({ accepted: true, jobRequestId });

  // Fire-and-forget so the HTTP response returns fast.
  void (async () => {
    const startedAt = Date.now();
    try {
      const result = await scrapeJob(url);
      const payload = {
        jobRequestId,
        userId,
        url,
        result,
        durationMs: Date.now() - startedAt,
      };
      await postCallback(payload);
      logger.info({ jobRequestId, durationMs: payload.durationMs }, 'scrape success');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ jobRequestId, err: message }, 'scrape failed');
      await postCallback({
        jobRequestId,
        userId,
        url,
        result: null,
        error: message,
        durationMs: Date.now() - startedAt,
      });
    }
  })();
});

async function postCallback(payload: Record<string, unknown>) {
  if (!CALLBACK_URL) {
    logger.warn('CALLBACK_URL not set — dropping result');
    return;
  }
  const body = JSON.stringify(payload);
  const signature = signCallback(body, CALLBACK_SECRET);
  try {
    const res = await fetch(CALLBACK_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-scraper-signature': signature,
      },
      body,
    });
    if (!res.ok) {
      logger.error({ status: res.status }, 'callback non-2xx');
    }
  } catch (err) {
    logger.error({ err: String(err) }, 'callback transport error');
  }
}

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'hirin scraper listening');
});
