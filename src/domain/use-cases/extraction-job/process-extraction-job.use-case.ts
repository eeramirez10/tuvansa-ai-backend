import { promises as fs } from "node:fs";
import path from "node:path";
import { UploadQuoteFileDto } from "../../dtos/upload-quote-file.dto";
import { ExtractionJobRepository } from "../../repositories/extraction-job.repository";
import { ExtractQuoteItemsUseCase } from "../extract-quote-items.use-case";
import { ExtractionJobInputType } from "../../entities/extraction-job.entity";
import { ExtractQuoteItemsFromTextUseCase } from "../extract-quote-items-from-text.use-case";


export class ProcessExtractionJobUseCase {
  constructor(
    private readonly extractionJobRepository: ExtractionJobRepository,
    private readonly extractQuoteItemsUseCase: ExtractQuoteItemsUseCase,
    private readonly extractQuoteItemsFromTextUseCase: ExtractQuoteItemsFromTextUseCase,
  ) { }

  public async execute(jobId: string): Promise<void> {
    const job = await this.extractionJobRepository.findById(jobId);
    if (!job) return;

    try {
      await this.extractionJobRepository.markProcessing(jobId, 10);

      if (job.inputType === ExtractionJobInputType.TEXT) {
        if (!job.inputText?.trim()) {
          throw new Error("El job de texto no contiene contenido para procesar.");
        }

        await this.extractionJobRepository.updateProgress(jobId, 40);
        const resultDto = await this.extractQuoteItemsFromTextUseCase.execute(job.inputText, job.source);
        await this.extractionJobRepository.updateProgress(jobId, 90);
        await this.extractionJobRepository.markCompleted(jobId, resultDto.toJSON());
        return;
      }

      const buffer = await fs.readFile(job.filePath);
      await this.extractionJobRepository.updateProgress(jobId, 40);

      const fileDto = UploadQuoteFileDto.create({
        buffer,
        originalname: job.fileName,
        mimetype: this.detectMimeType(job.fileName),
      });

      const resultDto = await this.extractQuoteItemsUseCase.execute(fileDto);
      await this.extractionJobRepository.updateProgress(jobId, 90);
      await this.extractionJobRepository.markCompleted(jobId, resultDto.toJSON());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error no controlado.";
      await this.extractionJobRepository.markFailed(jobId, message);
    }

  }

  private detectMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    if (ext === ".pdf") return "application/pdf";
    if (ext === ".xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (ext === ".xls") return "application/vnd.ms-excel";
    return "application/octet-stream";
  }
}
