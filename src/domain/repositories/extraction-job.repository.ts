import { ExtractionJobSource } from "../../generated/prisma/enums";
import { ExtractionJob } from "../entities/extraction-job.entity";


export interface ExtractionJobRepository {
  createQueued(fileName: string, filePath: string): Promise<ExtractionJob>;
  findById(id: string): Promise<ExtractionJob | null>;
  markProcessing(id: string, progress?: number): Promise<void>;
  updateProgress(id: string, progress: number): Promise<void>;
  markCompleted(id: string, resultJson: unknown): Promise<void>;
  markFailed(id: string, errorMessage: string): Promise<void>;
  createQueuedText(inputText: string, source?: ExtractionJobSource | null): Promise<ExtractionJob>
}