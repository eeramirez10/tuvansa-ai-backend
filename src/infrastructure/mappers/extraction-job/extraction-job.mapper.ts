import { ExtractionJob, ExtractionJobStatus } from "../../../domain/entities/extraction-job.entity";
import { ExtractionJobInputType } from "../../../generated/prisma/enums";



export class ExtractionJobMapper {

  static toEntity(json: Record<string, any>): ExtractionJob {

    return new ExtractionJob({
      id: json.id,
      fileName: json.fileName,
      filePath: json.filePath,
      status: json.status as ExtractionJobStatus,
      progress: json.progress,
      resultJson: json.resultJson ?? null,
      errorMessage: json.errorMessage ?? null,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
      startedAt: json.startedAt ?? null,
      completedAt: json.completedAt ?? null,
      inputType: json.inputType ?? 'file' as ExtractionJobInputType,
      inputText: json.inputText ?? null,
      source: json.source ?? null,
    })
  }
}