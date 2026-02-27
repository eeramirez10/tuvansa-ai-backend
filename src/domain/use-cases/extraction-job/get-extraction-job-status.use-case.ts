import { ExtractionJobMapper } from "../../../infrastructure/mappers/extraction-job/extraction-job.mapper";
import { ExtractionJobRepository } from "../../repositories/extraction-job.repository";

export class GetExtractionJobStatusUseCase {

  constructor(private readonly repository: ExtractionJobRepository){}


  public async execute(id: string){

    const job = await this.repository.findById(id)

    return ExtractionJobMapper.toEntity({...job})
  }


}