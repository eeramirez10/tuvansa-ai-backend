import { Request, Response } from "express";
import { NormalizeMissingProductsRequestDto } from "../../domain/dtos/normalize-missing-products-request.dto";
import { NormalizeMissingProductsUseCase } from "../../domain/use-cases/normalize-missing-products.use-case";

export class MissingProductsNormalizationController {
  constructor(private readonly normalizeMissingProductsUseCase: NormalizeMissingProductsUseCase) {}

  public normalize = async (req: Request, res: Response): Promise<Response> => {
    try {
      const requestDto = NormalizeMissingProductsRequestDto.create(req.body);
      const responseDto = await this.normalizeMissingProductsUseCase.execute(requestDto);
      return res.status(200).json(responseDto.toJSON());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error no controlado.";
      return res.status(400).json({ error: message });
    }
  };
}
