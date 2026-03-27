import { Request, Response } from "express";
import { SearchSimilarProductsRequestDto } from "../../domain/dtos/search-similar-products-request.dto";
import { SearchSimilarProductsUseCase } from "../../domain/use-cases/search-similar-products.use-case";

export class AiProductsController {
  constructor(private readonly searchSimilarProductsUseCase: SearchSimilarProductsUseCase) {}

  public searchSimilar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const requestDto = SearchSimilarProductsRequestDto.create(req.body);
      const responseDto = await this.searchSimilarProductsUseCase.execute(requestDto);
      return res.status(200).json(responseDto.toJSON());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error no controlado.";
      return res.status(400).json({ error: message });
    }
  };
}
