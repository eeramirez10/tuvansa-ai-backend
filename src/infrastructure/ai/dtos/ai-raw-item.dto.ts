import { DetectedLanguage } from "../../../domain/value-objects/detected-language";

interface AiRawItemDtoProps {
  descriptionOriginal: string | null;
  descriptionNormalized: string | null;
  quantity: number | string | null;
  originalUnit: string | null;
  normalizedUnit: string | null;
  language: DetectedLanguage | null;
  requiresReview: boolean | null;
}

export class AiRawItemDto {
  private readonly descriptionOriginal: string | null;
  private readonly descriptionNormalized: string | null;
  private readonly quantity: number | string | null;
  private readonly originalUnit: string | null;
  private readonly normalizedUnit: string | null;
  private readonly language: DetectedLanguage | null;
  private readonly requiresReview: boolean | null;

  private constructor(props: AiRawItemDtoProps) {
    this.descriptionOriginal = props.descriptionOriginal;
    this.descriptionNormalized = props.descriptionNormalized;
    this.quantity = props.quantity;
    this.originalUnit = props.originalUnit;
    this.normalizedUnit = props.normalizedUnit;
    this.language = props.language;
    this.requiresReview = props.requiresReview;
  }

  public static fromUnknown(data: unknown): AiRawItemDto {
    if (!data || typeof data !== "object") {
      throw new Error("Cada item de IA debe ser un objeto.");
    }

    const candidate = data as Record<string, unknown>;
    return new AiRawItemDto({
      descriptionOriginal:
        typeof candidate.description_original === "string" ? candidate.description_original : null,
      descriptionNormalized:
        typeof candidate.description_normalizada === "string"
          ? candidate.description_normalizada
          : null,
      quantity:
        typeof candidate.cantidad === "number" || typeof candidate.cantidad === "string"
          ? candidate.cantidad
          : null,
      originalUnit: typeof candidate.unidad_original === "string" ? candidate.unidad_original : null,
      normalizedUnit:
        typeof candidate.unidad_normalizada === "string" ? candidate.unidad_normalizada : null,
      language: AiRawItemDto.parseLanguage(candidate.idioma),
      requiresReview: typeof candidate.requiere_revision === "boolean" ? candidate.requiere_revision : null,
    });
  }

  private static parseLanguage(value: unknown): DetectedLanguage | null {
    if (value === DetectedLanguage.ES || value === DetectedLanguage.EN || value === DetectedLanguage.MIXED) {
      return value;
    }

    return null;
  }

  public getDescriptionOriginal(): string | null {
    return this.descriptionOriginal;
  }

  public getDescriptionNormalized(): string | null {
    return this.descriptionNormalized;
  }

  public getQuantity(): number | string | null {
    return this.quantity;
  }

  public getOriginalUnit(): string | null {
    return this.originalUnit;
  }

  public getNormalizedUnit(): string | null {
    return this.normalizedUnit;
  }

  public getLanguage(): DetectedLanguage | null {
    return this.language;
  }

  public getRequiresReview(): boolean | null {
    return this.requiresReview;
  }
}
