-- CreateEnum
CREATE TYPE "ExtractionJobInputType" AS ENUM ('file', 'text');

-- CreateEnum
CREATE TYPE "ExtractionJobSource" AS ENUM ('email', 'whatsapp', 'manual', 'file');

-- AlterTable
ALTER TABLE "extraction_jobs" ADD COLUMN     "input_text" TEXT,
ADD COLUMN     "input_type" "ExtractionJobInputType" NOT NULL DEFAULT 'file',
ADD COLUMN     "source" "ExtractionJobSource" DEFAULT 'file';
