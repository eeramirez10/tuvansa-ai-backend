import { MissingProductAiRawItemDto } from "./missing-product-ai-raw-item.dto";

export class MissingProductAiRawResponseDto {
  private readonly items: MissingProductAiRawItemDto[];

  private constructor(items: MissingProductAiRawItemDto[]) {
    this.items = items;
  }

  public static fromUnknown(data: unknown): MissingProductAiRawResponseDto {
    if (!data || typeof data !== "object") {
      throw new Error("La respuesta de IA debe ser un objeto JSON.");
    }

    const candidate = data as Record<string, unknown>;
    if (!Array.isArray(candidate.items)) {
      throw new Error("La respuesta de IA debe incluir un arreglo 'items'.");
    }

    const items = candidate.items.map((item) => MissingProductAiRawItemDto.fromUnknown(item));
    return new MissingProductAiRawResponseDto(items);
  }

  public getItems(): MissingProductAiRawItemDto[] {
    return [...this.items];
  }
}
