import { DocumentTextDto } from "../dtos/document-text.dto";
import { UploadQuoteFileDto } from "../dtos/upload-quote-file.dto";

export interface DocumentTextExtractorPort {
  extract(file: UploadQuoteFileDto): Promise<DocumentTextDto>;
}
