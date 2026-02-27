import { QuoteAiExtractorPort } from "../contracts/quote-ai-extractor.port";
import { DocumentTextDto } from "../dtos/document-text.dto";
import { ExtractQuoteResponseDto } from "../dtos/extract-quote-response.dto";
import { SupportedFileType } from "../value-objects/supported-file-type";
import { ExtractionJobSource } from "../entities/extraction-job.entity";

export class ExtractQuoteItemsFromTextUseCase {
  constructor(private readonly quoteAiExtractor: QuoteAiExtractorPort) {}

  public async execute(text: string, source?: ExtractionJobSource | null): Promise<ExtractQuoteResponseDto> {
    const normalizedText = text.trim();
    if (!normalizedText) {
      throw new Error("No se recibio texto para extraer.");
    }

    const documentText = new DocumentTextDto({
      textContent: normalizedText,
      fileType: SupportedFileType.TEXT,
      extractionHints: null,
    });

    const extractionResult = await this.quoteAiExtractor.extract(documentText);

    return new ExtractQuoteResponseDto({
      fileName: `TEXT_${source ?? "manual"}`,
      fileType: SupportedFileType.TEXT,
      items: extractionResult.getItems(),
    });
  }
}
