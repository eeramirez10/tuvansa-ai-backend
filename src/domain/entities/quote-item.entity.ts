import { DetectedLanguage } from "../value-objects/detected-language";
import { NullableCanonicalUnit } from "../value-objects/canonical-unit";

export interface QuoteItemPrimitives {
  description_original: string;
  description_normalizada: string;
  cantidad: number | null;
  unidad_original: string | null;
  unidad_normalizada: NullableCanonicalUnit;
  idioma: DetectedLanguage;
  requiere_revision: boolean;
}

interface QuoteItemProps {
  descriptionOriginal: string;
  descriptionNormalized: string;
  quantity: number | null;
  originalUnit: string | null;
  normalizedUnit: NullableCanonicalUnit;
  language: DetectedLanguage;
  requiresReview: boolean;
}

export class QuoteItem {
  private readonly descriptionOriginal: string;
  private readonly descriptionNormalized: string;
  private readonly quantity: number | null;
  private readonly originalUnit: string | null;
  private readonly normalizedUnit: NullableCanonicalUnit;
  private readonly language: DetectedLanguage;
  private readonly requiresReview: boolean;

  constructor(props: QuoteItemProps) {
    const descriptionOriginal = props.descriptionOriginal.trim();
    const descriptionNormalized = props.descriptionNormalized.trim();

    if (!descriptionOriginal) {
      throw new Error("description_original es obligatorio.");
    }

    if (!descriptionNormalized) {
      throw new Error("description_normalizada es obligatorio.");
    }

    this.descriptionOriginal = descriptionOriginal;
    this.descriptionNormalized = descriptionNormalized;
    this.quantity = props.quantity;
    this.originalUnit = props.originalUnit?.trim() || null;
    this.normalizedUnit = props.normalizedUnit;
    this.language = props.language;
    this.requiresReview = props.requiresReview;
  }

  public toPrimitives(): QuoteItemPrimitives {
    return {
      description_original: this.descriptionOriginal,
      description_normalizada: this.descriptionNormalized,
      cantidad: this.quantity,
      unidad_original: this.originalUnit,
      unidad_normalizada: this.normalizedUnit,
      idioma: this.language,
      requiere_revision: this.requiresReview,
    };
  }
}
