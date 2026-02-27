import { ExtractionJob } from "../../domain/entities/extraction-job.entity";
import { ExtractionJobRepository } from "../../domain/repositories/extraction-job.repository";
import { ExtractionJobDatasource } from '../../domain/datasources/extraction-job.datasource';
import { ExtractionJobSource } from "../../generated/prisma/enums";


export class PostgresqlExtractionJobRepositoryimpl implements ExtractionJobRepository {

  constructor(private readonly datasource: ExtractionJobDatasource) { }


  createQueuedText(inputText: string, source?: ExtractionJobSource | null): Promise<ExtractionJob> {
    return this.datasource.createQueuedText(inputText, source)
  }

  createQueued(fileName: string, filePath: string): Promise<ExtractionJob> {
    return this.datasource.createQueued(fileName, filePath)
  }
  findById(id: string): Promise<ExtractionJob | null> {
    return this.datasource.findById(id)
  }
  markProcessing(id: string, progress?: number): Promise<void> {
    return this.datasource.markProcessing(id, progress)
  }
  updateProgress(id: string, progress: number): Promise<void> {
    return this.datasource.updateProgress(id, progress)
  }
  markCompleted(id: string, resultJson: unknown): Promise<void> {
    return this.datasource.markCompleted(id, resultJson)
  }
  markFailed(id: string, errorMessage: string): Promise<void> {
    return this.datasource.markFailed(id, errorMessage)
  }

}