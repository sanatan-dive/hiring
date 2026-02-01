import prisma from '@/lib/db/prisma';

export async function findSimilarJobs(embedding: number[], limit = 20) {
  if (!embedding || embedding.length === 0) return [];

  // Use raw SQL for pgvector similarity search
  // <=> is the cosine distance operator
  // We explicitly cast the embedding to vector
  const vectorQuery = `[${embedding.join(',')}]`;

  try {
    const jobs = await prisma.$queryRaw`
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

    return jobs;
  } catch (error) {
    console.error('Error finding similar jobs:', error);
    return [];
  }
}
