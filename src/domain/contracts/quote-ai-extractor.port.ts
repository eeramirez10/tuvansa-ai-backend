import { DocumentTextDto } from "../dtos/document-text.dto";
import { QuoteExtractionResult } from "../entities/quote-extraction-result.entity";

export interface QuoteAiExtractorPort {
  extract(documentText: DocumentTextDto): Promise<QuoteExtractionResult>;
}
