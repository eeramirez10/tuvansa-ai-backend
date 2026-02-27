import { ExtractionJobDatasource } from "../../domain/datasources/extraction-job.datasource";
import { ExtractionJob, ExtractionJobInputType, ExtractionJobSource, ExtractionJobStatus } from "../../domain/entities/extraction-job.entity";
import {   } from "../../generated/prisma/enums";

import { prisma } from "../database/prisma-client";
import { ExtractionJobMapper } from "../mappers/extraction-job/extraction-job.mapper";


export class PostgresqlExtractionJobDatasource implements ExtractionJobDatasource {


  async createQueuedText(inputText: string, source?: ExtractionJobSource | null): Promise<ExtractionJob> {
    const row = await prisma.extractionJob.create({
      data:{
        fileName:'TEXT_INPUT',
        filePath:'TEXT_INPUT',
        status: ExtractionJobStatus.QUEUED,
        progress:0,
        inputType:ExtractionJobInputType.TEXT,
        inputText,
        source: source ?? null
      }
    })

    return ExtractionJobMapper.toEntity(row)
  }


  async createQueued(fileName: string, filePath: string): Promise<ExtractionJob> {
    const row = await prisma.extractionJob.create({
      data: {
        fileName,
        filePath,
        status: ExtractionJobStatus.QUEUED,
        progress: 0,
      },
    });

    return ExtractionJobMapper.toEntity(row)
  }

  async findById(id: string): Promise<ExtractionJob | null> {
    const row = await prisma.extractionJob.findUnique({ where: { id } });
    return row ? ExtractionJobMapper.toEntity(row) : null;
  }
  public async markProcessing(id: string, progress = 5): Promise<void> {
    await prisma.extractionJob.update({
      where: { id },
      data: {
        status: ExtractionJobStatus.PROCESSING,
        progress: this.normalizeProgress(progress),
        startedAt: new Date(),
        errorMessage: null,
      },
    });
  }
  public async updateProgress(id: string, progress: number): Promise<void> {
    await prisma.extractionJob.update({
      where: { id },
      data: {
        progress: this.normalizeProgress(progress),
      },
    });
  }

  public async markCompleted(id: string, resultJson: unknown): Promise<void> {
    await prisma.extractionJob.update({
      where: { id },
      data: {
        status: ExtractionJobStatus.COMPLETED,
        progress: 100,
        resultJson: resultJson as object,
        completedAt: new Date(),
        errorMessage: null,
      },
    });
  }

  public async markFailed(id: string, errorMessage: string): Promise<void> {
    await prisma.extractionJob.update({
      where: { id },
      data: {
        status: ExtractionJobStatus.FAILED,
        errorMessage: errorMessage.trim() || "Error no controlado.",
        completedAt: new Date(),
      },
    });
  }

  private normalizeProgress(value: number): number {
    if (!Number.isFinite(value)) return 0;
    if (value < 0) return 0;
    if (value > 100) return 100;
    return Math.trunc(value);
  }

}