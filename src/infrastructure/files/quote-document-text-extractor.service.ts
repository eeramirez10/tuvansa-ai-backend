import { DocumentTextExtractorPort } from "../../domain/contracts/document-text-extractor.port";
import { DocumentTextDto } from "../../domain/dtos/document-text.dto";
import { UploadQuoteFileDto } from "../../domain/dtos/upload-quote-file.dto";
import { SupportedFileType } from "../../domain/value-objects/supported-file-type";
import { DocumentTypeDetector } from "./document-type-detector";
import { PdfDigitalTextReader } from "./pdf-digital-text-reader";
import { XlsxTextReader } from "./xlsx-text-reader";

export class QuoteDocumentTextExtractorService implements DocumentTextExtractorPort {
  private readonly detector: DocumentTypeDetector;
  private readonly xlsxReader: XlsxTextReader;
  private readonly pdfReader: PdfDigitalTextReader;

  constructor(detector: DocumentTypeDetector, xlsxReader: XlsxTextReader, pdfReader: PdfDigitalTextReader) {
    this.detector = detector;
    this.xlsxReader = xlsxReader;
    this.pdfReader = pdfReader;
  }

  public async extract(file: UploadQuoteFileDto): Promise<DocumentTextDto> {
    const fileType = this.detector.detect(file.getOriginalName(), file.getMimeType());

    let textContent = "";
    let extractionHints: string | null = null;
    if (fileType === SupportedFileType.XLSX) {
      textContent = this.xlsxReader.read(file.getBuffer());
    }

    if (fileType === SupportedFileType.PDF_DIGITAL) {
      const pdfReadResult = await this.pdfReader.read(file.getBuffer());
      textContent = pdfReadResult.textContent;
      extractionHints = pdfReadResult.extractionHints;
    }

    if (textContent.trim().length < 8) {
      throw new Error(
        "No se pudo extraer texto util del archivo. Verifica que el documento tenga contenido legible.",
      );
    }


    return new DocumentTextDto({
      textContent,
      fileType,
      extractionHints,
    });
  }
}
