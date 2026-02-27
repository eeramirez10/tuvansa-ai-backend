import { AiRawItemDto } from "./ai-raw-item.dto";

export class AiRawResponseDto {
  private readonly items: AiRawItemDto[];

  private constructor(items: AiRawItemDto[]) {
    this.items = items;
  }

  public static fromUnknown(data: unknown): AiRawResponseDto {
    if (!data || typeof data !== "object") {
      throw new Error("La respuesta de IA debe ser un objeto JSON.");
    }

    const candidate = data as Record<string, unknown>;
    if (!Array.isArray(candidate.items)) {
      throw new Error("La respuesta de IA debe incluir un arreglo 'items'.");
    }

    const items = candidate.items.map((item) => AiRawItemDto.fromUnknown(item));
    return new AiRawResponseDto(items);
  }

  public getItems(): AiRawItemDto[] {
    return [...this.items];
  }
}
