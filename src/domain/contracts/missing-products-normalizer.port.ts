export interface MissingProductNormalizationInput {
  itemId: string;
  description: string;
  quantity: number | null;
  unit: string | null;
}

export interface MissingProductNormalizationOutput {
  itemId: string;
  descriptionOriginal: string;
  descriptionNormalized: string;
  quantity: number | null;
  originalUnit: string | null;
  normalizedUnit: "KG" | "M" | "FT" | "PZA" | "TRAMO" | "SE" | null;
  eanSuggested: string | null;
  confidence: number;
  requiresReview: boolean;
}

export interface MissingProductsNormalizerPort {
  normalize(items: MissingProductNormalizationInput[]): Promise<MissingProductNormalizationOutput[]>;
}
