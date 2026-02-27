import { QuoteItem } from "../entities/quote-item.entity";
import { SupportedFileType } from "../value-objects/supported-file-type";

interface ExtractQuoteResponseDtoProps {
  fileName: string;
  fileType: SupportedFileType;
  items: QuoteItem[];
}

export class ExtractQuoteResponseDto {
  private readonly fileName: string;
  private readonly fileType: SupportedFileType;
  private readonly items: QuoteItem[];

  constructor(props: ExtractQuoteResponseDtoProps) {
    this.fileName = props.fileName;
    this.fileType = props.fileType;
    this.items = props.items;
  }

  public toJSON(): {
    file_name: string;
    file_type: SupportedFileType;
    items_count: number;
    items: ReturnType<QuoteItem["toPrimitives"]>[];
  } {
    return {
      file_name: this.fileName,
      file_type: this.fileType,
      items_count: this.items.length,
      items: this.items.map((item) => item.toPrimitives()),
    };
  }
}
