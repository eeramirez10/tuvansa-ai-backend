import { DocumentTextExtractorPort } from "../contracts/document-text-extractor.port";
import { QuoteAiExtractorPort } from "../contracts/quote-ai-extractor.port";
import { ExtractQuoteResponseDto } from "../dtos/extract-quote-response.dto";
import { UploadQuoteFileDto } from "../dtos/upload-quote-file.dto";

export class ExtractQuoteItemsUseCase {
  private readonly documentTextExtractor: DocumentTextExtractorPort;
  private readonly quoteAiExtractor: QuoteAiExtractorPort;

  constructor(
    documentTextExtractor: DocumentTextExtractorPort,
    quoteAiExtractor: QuoteAiExtractorPort,
  ) {
    this.documentTextExtractor = documentTextExtractor;
    this.quoteAiExtractor = quoteAiExtractor;
  }

  public async execute(file: UploadQuoteFileDto): Promise<ExtractQuoteResponseDto> {
    const documentText = await this.documentTextExtractor.extract(file);
    const extractionResult = await this.quoteAiExtractor.extract(documentText);
    return new ExtractQuoteResponseDto({
      fileName: file.getOriginalName(),
      fileType: documentText.getFileType(),
      items: extractionResult.getItems(),
    });
  }
}
