import { MissingProductNormalizationOutput } from "../contracts/missing-products-normalizer.port";

interface NormalizeMissingProductsResponseDtoProps {
  items: MissingProductNormalizationOutput[];
}

export class NormalizeMissingProductsResponseDto {
  private readonly items: MissingProductNormalizationOutput[];

  constructor(props: NormalizeMissingProductsResponseDtoProps) {
    this.items = props.items;
  }

  public toJSON(): {
    items_count: number;
    items: Array<{
      item_id: string;
      description_original: string;
      description_normalized: string;
      quantity: number | null;
      unit_original: string | null;
      unit_normalized: "KG" | "M" | "FT" | "PZA" | "TRAMO" | "SE" | null;
      ean_suggested: string | null;
      confidence: number;
      requires_review: boolean;
    }>;
  } {
    return {
      items_count: this.items.length,
      items: this.items.map((item) => ({
        item_id: item.itemId,
        description_original: item.descriptionOriginal,
        description_normalized: item.descriptionNormalized,
        quantity: item.quantity,
        unit_original: item.originalUnit,
        unit_normalized: item.normalizedUnit,
        ean_suggested: item.eanSuggested,
        confidence: item.confidence,
        requires_review: item.requiresReview,
      })),
    };
  }
}
