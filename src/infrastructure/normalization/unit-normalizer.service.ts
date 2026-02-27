import { CanonicalUnit, NullableCanonicalUnit } from "../../domain/value-objects/canonical-unit";

export class UnitNormalizerService {
  private readonly unitMap: Map<string, CanonicalUnit>;

  constructor() {
    this.unitMap = new Map<string, CanonicalUnit>([
      ["kilo", CanonicalUnit.KG],
      ["k", CanonicalUnit.KG],
      ["kg", CanonicalUnit.KG],
      ["kgs", CanonicalUnit.KG],
      ["kilogramo", CanonicalUnit.KG],
      ["kilogram", CanonicalUnit.KG],

      ["metro", CanonicalUnit.M],
      ["metros", CanonicalUnit.M],
      ["m", CanonicalUnit.M],
      ["mt", CanonicalUnit.M],
      ["mtr", CanonicalUnit.M],

      ["pie", CanonicalUnit.FT],
      ["pies", CanonicalUnit.FT],
      ["ft", CanonicalUnit.FT],

      ["pieza", CanonicalUnit.PZA],
      ["piezas", CanonicalUnit.PZA],
      ["pza", CanonicalUnit.PZA],
      ["pzas", CanonicalUnit.PZA],
      ["pz", CanonicalUnit.PZA],
      ["mpz", CanonicalUnit.PZA],
      ["pc", CanonicalUnit.PZA],
      ["pcs", CanonicalUnit.PZA],

      ["tramo", CanonicalUnit.TRAMO],
      ["tramos", CanonicalUnit.TRAMO],
      ["tr", CanonicalUnit.TRAMO],

      ["se", CanonicalUnit.SE],
    ]);
  }

  public normalize(input: string | null | undefined): NullableCanonicalUnit {
    if (!input) {
      return null;
    }

    const cleaned = this.clean(input);
    if (!cleaned) {
      return null;
    }

    const direct = this.unitMap.get(cleaned);
    if (direct) {
      return direct;
    }

    const compact = cleaned.replace(/\s+/g, "");
    return this.unitMap.get(compact) ?? null;
  }

  public detectFromDescription(description: string): NullableCanonicalUnit {
    const cleaned = this.clean(description);
    const tokens = cleaned.split(/\s+/);

    for (const token of tokens) {
      const normalized = this.normalize(token);
      if (normalized) {
        return normalized;
      }
    }

    return null;
  }

  private clean(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[.,;:()"'`]/g, "")
      .replace(/\s+/g, " ");
  }
}
