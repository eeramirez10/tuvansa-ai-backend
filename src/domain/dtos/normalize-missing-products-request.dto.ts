import { MissingProductNormalizationInput } from "../contracts/missing-products-normalizer.port";

interface NormalizeMissingProductsRequestDtoProps {
  items: MissingProductNormalizationInput[];
}

export class NormalizeMissingProductsRequestDto {
  private readonly items: MissingProductNormalizationInput[];

  private constructor(props: NormalizeMissingProductsRequestDtoProps) {
    this.items = props.items;
  }

  public static create(input: unknown): NormalizeMissingProductsRequestDto {
    if (!input || typeof input !== "object") {
      throw new Error("Body invalido.");
    }

    const candidate = input as Record<string, unknown>;
    if (!Array.isArray(candidate.items) || candidate.items.length === 0) {
      throw new Error("Debes enviar un arreglo no vacio en 'items'.");
    }

    const items = candidate.items.map((raw, index) => {
      if (!raw || typeof raw !== "object") {
        throw new Error(`items[${index}] invalido.`);
      }

      const row = raw as Record<string, unknown>;
      const itemId =
        typeof row.itemId === "string"
          ? row.itemId.trim()
          : typeof row.item_id === "string"
            ? row.item_id.trim()
            : "";

      const description =
        typeof row.description === "string"
          ? row.description.trim()
          : typeof row.description_original === "string"
            ? row.description_original.trim()
            : typeof row.descriptionOriginal === "string"
              ? row.descriptionOriginal.trim()
              : "";

      const quantity = NormalizeMissingProductsRequestDto.parseNullableNumber(
        row.quantity ?? row.cantidad ?? row.qty
      );

      const unitRaw = row.unit ?? row.unidad ?? row.unidad_original ?? row.unit_original ?? row.unitOriginal;
      const unit = typeof unitRaw === "string" && unitRaw.trim().length > 0 ? unitRaw.trim() : null;

      if (!itemId) {
        throw new Error(`items[${index}].itemId es obligatorio.`);
      }

      if (!description) {
        throw new Error(`items[${index}].description es obligatorio.`);
      }

      if (typeof quantity === "number" && (!Number.isFinite(quantity) || quantity <= 0)) {
        throw new Error(`items[${index}].quantity es invalido.`);
      }

      return {
        itemId,
        description,
        quantity,
        unit,
      };
    });

    return new NormalizeMissingProductsRequestDto({ items });
  }

  public getItems(): MissingProductNormalizationInput[] {
    return this.items.map((item) => ({ ...item }));
  }

  private static parseNullableNumber(value: unknown): number | null {
    if (value === null || typeof value === "undefined" || value === "") return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : Number.NaN;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? Number.NaN : parsed;
    }
    return Number.NaN;
  }
}
