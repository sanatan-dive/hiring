import prisma from '@/lib/db/prisma';

interface RawJobRow {
  id: string;
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  description: string | null;
  url: string;
  source: string;
  scrapedAt: Date;
  similarity: unknown; // Prisma returns BigDecimal as Decimal/string
}

export async function findSimilarJobs(embedding: number[], limit = 20) {
  if (!embedding || embedding.length === 0) return [];

  // Use raw SQL for pgvector similarity search
  // <=> is the cosine distance operator
  // We explicitly cast the embedding to vector
  const vectorQuery = `[${embedding.join(',')}]`;

  try {
    const jobs = await prisma.$queryRaw<RawJobRow[]>`
      SELECT 
        id, 
        title, 
        company, 
        location, 
        salary, 
        description, 
        url, 
        source, 
        "scrapedAt",
        1 - (embedding <=> ${vectorQuery}::vector) as similarity
      FROM jobs
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorQuery}::vector
      LIMIT ${limit};
    `;

    // Prisma returns computed numeric columns as Decimal/BigDecimal strings
    // Convert to plain JS numbers for frontend consumption
    return jobs.map((job) => ({
      ...job,
      similarity: Number(job.similarity),
    }));
  } catch (error) {
    console.error('Error finding similar jobs:', error);
    return [];
  }
}
