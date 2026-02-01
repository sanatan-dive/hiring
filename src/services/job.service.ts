import prisma from '@/lib/db/prisma';
import { searchAdzunaJobs } from '@/lib/api/adzuna';
import { searchJSearchJobs } from '@/lib/api/jsearch';
import { generateEmbedding } from '@/lib/ai/google';

export async function fetchAndSaveJobs(query: string, location: string = 'us') {
  console.log(`Fetching jobs for: ${query} in ${location}`);

  // Fetch from sources in parallel
  const [adzunaJobs, jsearchJobs] = await Promise.all([
    searchAdzunaJobs(query, location).catch(() => []),
    searchJSearchJobs(`${query} in ${location}`).catch(() => []),
  ]);

  console.log(`Found ${adzunaJobs.length} Adzuna and ${jsearchJobs.length} JSearch jobs`);

  // Transform to common format
  const jobs = [
    ...adzunaJobs.map((job) => ({
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      description: job.description,
      url: job.redirect_url,
      salary: job.salary_min ? `${job.salary_min} - ${job.salary_max}` : null,
      source: 'adzuna',
      scrapedAt: new Date(),
    })),
    ...jsearchJobs.map((job) => ({
      title: job.job_title,
      company: job.employer_name,
      location: `${job.job_city}, ${job.job_state}, ${job.job_country}`,
      description: job.job_description,
      url: job.job_apply_link,
      salary: job.job_min_salary ? `${job.job_min_salary} - ${job.job_max_salary}` : null,
      source: 'jsearch',
      scrapedAt: new Date(),
    })),
  ];

  // Bulk upsert (one by one for safety or use createMany with skipDuplicates if unique constraint exists)
  // Since we have `url` as unique, we can use upsert or createMany (createMany skips duplicates is efficient)
  // But createMany doesn't update existing records. Upsert loop is safer for updates but slower.
  // For now, let's just loop and upsert to keep data fresh.
  let savedCount = 0;
  for (const job of jobs) {
    if (!job.url) continue;
    try {
      await prisma.job.upsert({
        where: { url: job.url },
        update: {
          title: job.title,
          description: job.description,
          // const jobs = await prisma.job.createMany({
          //   data: jobsToSave.map(job => ({
          //     title: job.title,
          //     company: job.company,
          //     location: job.location,
          //     salary: job.salary,
          //     description: job.description,
          //     url: job.url,
          //     source: source || 'scraper',
          //     techStack: job.techStack || [],
          //   })),
          //   skipDuplicates: true,
          // });
          salary: job.salary,
        },
        create: {
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          url: job.url,
          salary: job.salary,
          source: job.source,
          techStack: [],
        },
      });

      // Generate embedding for the new job
      const textToEmbed =
        `${job.title} ${job.description} ${job.company} ${job.location}`.substring(0, 8000);
      const vector = await generateEmbedding(textToEmbed);

      if (vector) {
        // Update vector using raw query
        const vectorString = `[${vector.join(',')}]`;
        await prisma.$executeRaw`
          UPDATE jobs 
          SET embedding = ${vectorString}::vector 
          WHERE url = ${job.url}
        `;
      }

      savedCount++;
    } catch (err) {
      console.error(`Failed to save job ${job.url}:`, err);
    }
  }

  return savedCount;
}

export async function getJobs(page: number = 1, limit: number = 10, filters?: { source?: string }) {
  const skip = (page - 1) * limit;
  return prisma.job.findMany({
    where: filters,
    orderBy: { scrapedAt: 'desc' },
    skip,
    take: limit,
  });
}

export async function updateJobEmbeddings() {
  // Find jobs without embeddings using raw query
  // const jobs = await prisma.$queryRaw<{ id: string; title: string; description: string; company: string; location: string }[]>`
  //   SELECT id, title, description, company, location
  //   FROM jobs
  //   WHERE embedding IS NULL
  //   LIMIT 50
  // `;
  // Process them (placeholder for now, as we moved logic to fetchAndSave)
  // Logic to update these would go here if needed
}
