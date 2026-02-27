export interface UploadQuoteFileDtoProps {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export class UploadQuoteFileDto {
  private readonly buffer: Buffer;
  private readonly originalname: string;
  private readonly mimetype: string;

  private constructor(props: UploadQuoteFileDtoProps) {
    this.buffer = props.buffer;
    this.originalname = props.originalname;
    this.mimetype = props.mimetype;
  }

  public static create(data: unknown): UploadQuoteFileDto {
    if (!data || typeof data !== "object") {
      throw new Error("Archivo inválido.");
    }

    const candidate = data as Partial<UploadQuoteFileDtoProps>;

    if (!candidate.buffer || !Buffer.isBuffer(candidate.buffer)) {
      throw new Error("El buffer del archivo es obligatorio.");
    }

    if (!candidate.originalname || typeof candidate.originalname !== "string") {
      throw new Error("El nombre del archivo es obligatorio.");
    }

    if (!candidate.mimetype || typeof candidate.mimetype !== "string") {
      throw new Error("El mimetype del archivo es obligatorio.");
    }

    return new UploadQuoteFileDto({
      buffer: candidate.buffer,
      originalname: candidate.originalname,
      mimetype: candidate.mimetype,
    });
  }

  public getBuffer(): Buffer {
    return this.buffer;
  }

  public getOriginalName(): string {
    return this.originalname;
  }

  public getMimeType(): string {
    return this.mimetype;
  }
}
