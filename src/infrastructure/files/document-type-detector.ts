import path from "node:path";
import { SupportedFileType } from "../../domain/value-objects/supported-file-type";

export class DocumentTypeDetector {
  public detect(originalName: string, mimeType: string): SupportedFileType {
    const extension = path.extname(originalName).toLowerCase();
    const normalizedMimeType = mimeType.toLowerCase();

    if (
      extension === ".xlsx" ||
      extension === ".xls" ||
      normalizedMimeType.includes("spreadsheetml") ||
      normalizedMimeType.includes("excel")
    ) {
      return SupportedFileType.XLSX;
    }

    if (extension === ".pdf" || normalizedMimeType.includes("pdf")) {
      return SupportedFileType.PDF_DIGITAL;
    }

    throw new Error("Formato no soportado. Usa xlsx/xls o pdf digital.");
  }
}
