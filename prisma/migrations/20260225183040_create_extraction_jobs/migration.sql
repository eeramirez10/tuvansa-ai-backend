-- CreateEnum
CREATE TYPE "ExtractionJobStatus" AS ENUM ('queued', 'processing', 'completed', 'failed');

-- CreateTable
CREATE TABLE "extraction_jobs" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "status" "ExtractionJobStatus" NOT NULL DEFAULT 'queued',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "result_json" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "extraction_jobs_pkey" PRIMARY KEY ("id")
);
