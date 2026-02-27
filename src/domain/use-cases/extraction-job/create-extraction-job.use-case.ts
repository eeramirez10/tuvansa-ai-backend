import { ExtractionJobMapper } from '../../../infrastructure/mappers/extraction-job/extraction-job.mapper';
import { ExtractionJobRepository } from '../../repositories/extraction-job.repository';


export class CreateExtractionJobUseCase {

  constructor(private readonly repository: ExtractionJobRepository) { }


  public async execute(fileName: string, filePath: string) {

    const job = await this.repository.createQueued(fileName, filePath)

    return ExtractionJobMapper.toEntity({ ...job })
  }
}