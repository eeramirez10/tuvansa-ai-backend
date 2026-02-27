import { Request, Response } from "express";
import { UploadQuoteFileDto } from "../../domain/dtos/upload-quote-file.dto";
import { ExtractQuoteItemsUseCase } from "../../domain/use-cases/extract-quote-items.use-case";

export class QuoteExtractionController {
  private readonly extractQuoteItemsUseCase: ExtractQuoteItemsUseCase;

  constructor(extractQuoteItemsUseCase: ExtractQuoteItemsUseCase) {
    this.extractQuoteItemsUseCase = extractQuoteItemsUseCase;
  }

  public extract = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Debes enviar un archivo en el campo 'file'." });
      }

      const fileDto = UploadQuoteFileDto.create({
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
      });

      const responseDto = await this.extractQuoteItemsUseCase.execute(fileDto);
      return res.status(200).json(responseDto.toJSON());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error no controlado.";
      return res.status(400).json({ error: message });
    }
  };
}
