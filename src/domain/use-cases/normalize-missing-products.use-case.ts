import { MissingProductsNormalizerPort } from "../contracts/missing-products-normalizer.port";
import { NormalizeMissingProductsRequestDto } from "../dtos/normalize-missing-products-request.dto";
import { NormalizeMissingProductsResponseDto } from "../dtos/normalize-missing-products-response.dto";

export class NormalizeMissingProductsUseCase {
  constructor(private readonly normalizer: MissingProductsNormalizerPort) {}

  public async execute(
    requestDto: NormalizeMissingProductsRequestDto
  ): Promise<NormalizeMissingProductsResponseDto> {
    const items = await this.normalizer.normalize(requestDto.getItems());
    return new NormalizeMissingProductsResponseDto({ items });
  }
}
