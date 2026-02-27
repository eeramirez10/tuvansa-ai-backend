import { SupportedFileType } from "../value-objects/supported-file-type";

interface DocumentTextDtoProps {
  textContent: string;
  fileType: SupportedFileType;
  extractionHints?: string | null;
}

export class DocumentTextDto {
  private readonly textContent: string;
  private readonly fileType: SupportedFileType;
  private readonly extractionHints: string | null;

  constructor(props: DocumentTextDtoProps) {
    const normalizedText = props.textContent.trim();

    if (!normalizedText) {
      throw new Error("No se extrajo texto del documento.");
    }

    this.textContent = normalizedText;
    this.fileType = props.fileType;
    this.extractionHints = props.extractionHints?.trim() || null;
  }

  public getTextContent(): string {
    return this.textContent;
  }

  public getFileType(): SupportedFileType {
    return this.fileType;
  }

  public getExtractionHints(): string | null {
    return this.extractionHints;
  }
}
