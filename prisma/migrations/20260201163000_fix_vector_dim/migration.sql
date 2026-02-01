-- AlterTable
ALTER TABLE "jobs" ALTER COLUMN "embedding" TYPE vector(768) USING NULL;

-- AlterTable
ALTER TABLE "resumes" ALTER COLUMN "embedding" TYPE vector(768) USING NULL;
