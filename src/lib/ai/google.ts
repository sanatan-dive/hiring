import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '@/config';

const apiKey = config.google.apiKey;

if (!apiKey) {
  console.warn('GOOGLE_API_KEY is not set. Embeddings will fail.');
}

// Initialize Gemini Client
const genAI = new GoogleGenerativeAI(apiKey || 'dummy_key');
const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!text || !apiKey) return null;

  // Clean text to avoid token limits or garbage
  // Gemini text-embedding-004 supports up to 2048 tokens usually, let's keep it safe.
  const cleanText = text.replace(/\n/g, ' ').substring(0, 8000);

  try {
    const result = await model.embedContent(cleanText);
    const vector = result.embedding.values;
    return vector;
  } catch (error) {
    console.error('Error generating Gemini embedding:', error);
    return null;
  }
}
