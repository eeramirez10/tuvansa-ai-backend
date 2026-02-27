import { ExtractionJobStatus } from "../../entities/extraction-job.entity";
import { ExtractionJobRepository } from "../../repositories/extraction-job.repository";


export class GetExtractionJobResultUseCase {
  constructor(private readonly repository: ExtractionJobRepository) {}

  public async execute(id: string): Promise<{
    found: boolean;
    ready: boolean;
    failed: boolean;
    status: ExtractionJobStatus | null;
    result: unknown | null;
    error: string | null;
  }> {
    const job = await this.repository.findById(id);

    if (!job) {
      return {
        found: false,
        ready: false,
        failed: false,
        status: null,
        result: null,
        error: null,
      };
    }

    const data = job.toPrimitives();

    return {
      found: true,
      ready: data.status === ExtractionJobStatus.COMPLETED,
      failed: data.status === ExtractionJobStatus.FAILED,
      status: data.status,
      result: data.result_json,
      error: data.error_message,
    };
  }
}
