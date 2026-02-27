import { ExtractionJobMapper } from "../../../infrastructure/mappers/extraction-job/extraction-job.mapper";
import { ExtractionJobSource } from "../../entities/extraction-job.entity";
import { ExtractionJobRepository } from "../../repositories/extraction-job.repository";

export class CreateTextExtractionJobUseCase {

  constructor(private readonly repository: ExtractionJobRepository) { }

  public async execute(text: string, source?: ExtractionJobSource | null) {
    const cleanText = text.trim()
    if (!cleanText) throw new Error('Debes enviar texto para procesar')
    if (cleanText.length > 20000) throw new Error("El texto excede el maximo permitido (20000 caracteres).");

    const job = await this.repository.createQueuedText(text,source);

    return ExtractionJobMapper.toEntity(job)

  }
}