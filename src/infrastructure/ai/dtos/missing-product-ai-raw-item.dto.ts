interface MissingProductAiRawItemDtoProps {
  itemId: string | null;
  descriptionOriginal: string | null;
  descriptionNormalized: string | null;
  quantity: number | string | null;
  originalUnit: string | null;
  normalizedUnit: string | null;
  eanSuggested: string | null;
  confidence: number | string | null;
  requiresReview: boolean | null;
}

export class MissingProductAiRawItemDto {
  private readonly itemId: string | null;
  private readonly descriptionOriginal: string | null;
  private readonly descriptionNormalized: string | null;
  private readonly quantity: number | string | null;
  private readonly originalUnit: string | null;
  private readonly normalizedUnit: string | null;
  private readonly eanSuggested: string | null;
  private readonly confidence: number | string | null;
  private readonly requiresReview: boolean | null;

  private constructor(props: MissingProductAiRawItemDtoProps) {
    this.itemId = props.itemId;
    this.descriptionOriginal = props.descriptionOriginal;
    this.descriptionNormalized = props.descriptionNormalized;
    this.quantity = props.quantity;
    this.originalUnit = props.originalUnit;
    this.normalizedUnit = props.normalizedUnit;
    this.eanSuggested = props.eanSuggested;
    this.confidence = props.confidence;
    this.requiresReview = props.requiresReview;
  }

  public static fromUnknown(data: unknown): MissingProductAiRawItemDto {
    if (!data || typeof data !== "object") {
      throw new Error("Cada item de IA debe ser un objeto.");
    }

    const candidate = data as Record<string, unknown>;

    const itemId =
      typeof candidate.item_id === "string"
        ? candidate.item_id
        : typeof candidate.itemId === "string"
          ? candidate.itemId
          : null;

    const descriptionOriginal = MissingProductAiRawItemDto.pickString(
      candidate.description_original,
      candidate.descriptionOriginal,
      candidate.description
    );
    const descriptionNormalized = MissingProductAiRawItemDto.pickString(
      candidate.description_normalized,
      candidate.descriptionNormalized
    );
    const quantity =
      typeof candidate.quantity === "number" || typeof candidate.quantity === "string"
        ? candidate.quantity
        : typeof candidate.cantidad === "number" || typeof candidate.cantidad === "string"
          ? candidate.cantidad
          : null;
    const originalUnit = MissingProductAiRawItemDto.pickString(
      candidate.unit_original,
      candidate.originalUnit,
      candidate.unidad_original,
      candidate.unit
    );
    const normalizedUnit = MissingProductAiRawItemDto.pickString(
      candidate.unit_normalized,
      candidate.unitNormalized,
      candidate.unidad_normalizada
    );
    const eanSuggested = MissingProductAiRawItemDto.pickString(
      candidate.ean_suggested,
      candidate.eanSuggested
    );
    const confidence =
      typeof candidate.confidence === "number" || typeof candidate.confidence === "string"
        ? candidate.confidence
        : null;
    const requiresReview =
      typeof candidate.requires_review === "boolean"
        ? candidate.requires_review
        : typeof candidate.requiresReview === "boolean"
          ? candidate.requiresReview
          : typeof candidate.requiere_revision === "boolean"
            ? candidate.requiere_revision
            : null;

    return new MissingProductAiRawItemDto({
      itemId: itemId?.trim() || null,
      descriptionOriginal: descriptionOriginal?.trim() || null,
      descriptionNormalized: descriptionNormalized?.trim() || null,
      quantity,
      originalUnit: originalUnit?.trim() || null,
      normalizedUnit: normalizedUnit?.trim() || null,
      eanSuggested: eanSuggested?.trim() || null,
      confidence,
      requiresReview,
    });
  }

  private static pickString(...values: unknown[]): string | null {
    for (const value of values) {
      if (typeof value === "string") {
        return value;
      }
    }

    return null;
  }

  public getItemId(): string | null {
    return this.itemId;
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

  public getEanSuggested(): string | null {
    return this.eanSuggested;
  }

  public getConfidence(): number | string | null {
    return this.confidence;
  }

  public getRequiresReview(): boolean | null {
    return this.requiresReview;
  }
}
