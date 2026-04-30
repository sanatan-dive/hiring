import { log } from '@/lib/log';
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '@/config';

const apiKey = config.google.apiKey;

if (!apiKey) {
  log.warn('GOOGLE_API_KEY is not set. Embeddings will fail.');
}

// Gemini's text-embedding-004 was retired. The current text embedding model
// is gemini-embedding-001, which defaults to 3072 dimensions but supports
// flexible output via `outputDimensionality`. Our pgvector column is
// vector(768) — we ask for 768-dim output to match.
//
// IMPORTANT: embeddings from gemini-embedding-001 are NOT comparable to
// those from text-embedding-004. Existing embeddings in the DB are dead;
// they must be regenerated. See scripts/wipe-embeddings.ts.
const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768;

// Re-export the chat client for the AI feature routes (cover letter, prep)
const genAI = new GoogleGenerativeAI(apiKey || 'dummy_key');
export { genAI };

export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!text || !apiKey) return null;

  // Clean and clip — gemini-embedding-001 caps at 2048 tokens (~8000 chars)
  const cleanText = text.replace(/\s+/g, ' ').trim().substring(0, 8000);
  if (!cleanText) return null;

  // Call REST directly — the SDK v0.24.x doesn't expose outputDimensionality
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent` +
    `?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text: cleanText }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      log.error('Gemini embedding API error', null, {
        status: res.status,
        body: detail.slice(0, 500),
      });
      return null;
    }

    const json = (await res.json()) as { embedding?: { values?: number[] } };
    const vector = json?.embedding?.values;
    if (!vector || vector.length === 0) {
      log.error('Gemini embedding returned no values', null, { json });
      return null;
    }
    return vector;
  } catch (error) {
    log.error('Error generating Gemini embedding:', error);
    return null;
  }
}
