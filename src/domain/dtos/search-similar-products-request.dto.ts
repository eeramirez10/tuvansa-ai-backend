interface SearchSimilarProductsRequestDtoProps {
  query: string;
  branchCode: string;
  topK: number;
  limit: number;
  minScore: number;
  filters: {
    tipo?: string;
    product?: string;
    material?: string;
  };
}

export class SearchSimilarProductsRequestDto {
  public readonly query: string;
  public readonly branchCode: string;
  public readonly topK: number;
  public readonly limit: number;
  public readonly minScore: number;
  public readonly filters: {
    tipo?: string;
    product?: string;
    material?: string;
  };

  private constructor(props: SearchSimilarProductsRequestDtoProps) {
    this.query = props.query;
    this.branchCode = props.branchCode;
    this.topK = props.topK;
    this.limit = props.limit;
    this.minScore = props.minScore;
    this.filters = props.filters;
  }

  public static create(input: unknown): SearchSimilarProductsRequestDto {
    if (!input || typeof input !== "object") {
      throw new Error("Body invalido.");
    }

    const body = input as Record<string, unknown>;
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (query.length < 2) {
      throw new Error("'query' es obligatorio y debe tener al menos 2 caracteres.");
    }

    const branchRaw =
      typeof body.branchCode === "string"
        ? body.branchCode
        : typeof body.branch_code === "string"
          ? body.branch_code
          : "";
    const branchCode = branchRaw.trim();

    if (!/^\d{2}$/.test(branchCode)) {
      throw new Error("'branchCode' es obligatorio y debe tener formato de 2 digitos (ej: 01).");
    }

    const topK = this.parseNumber(body.topK ?? body.top_k, 30, 5, 50, "topK");
    const limit = this.parseNumber(body.limit, 10, 1, 20, "limit");
    const minScore = this.parseDecimal(body.minScore ?? body.min_score, 0.7, 0, 1, "minScore");

    const filtersInput =
      body.filters && typeof body.filters === "object"
        ? (body.filters as Record<string, unknown>)
        : ({} as Record<string, unknown>);

    const filters = {
      tipo: this.parseOptionalString(filtersInput.tipo),
      product: this.parseOptionalString(filtersInput.product),
      material: this.parseOptionalString(filtersInput.material),
    };

    return new SearchSimilarProductsRequestDto({
      query,
      branchCode,
      topK,
      limit,
      minScore,
      filters,
    });
  }

  private static parseNumber(
    input: unknown,
    defaultValue: number,
    min: number,
    max: number,
    fieldName: string,
  ): number {
    if (typeof input === "undefined" || input === null || input === "") return defaultValue;
    const parsed = Number(input);
    if (!Number.isFinite(parsed)) {
      throw new Error(`'${fieldName}' debe ser numerico.`);
    }
    const intValue = Math.trunc(parsed);
    if (intValue < min || intValue > max) {
      throw new Error(`'${fieldName}' debe estar entre ${min} y ${max}.`);
    }
    return intValue;
  }

  private static parseDecimal(
    input: unknown,
    defaultValue: number,
    min: number,
    max: number,
    fieldName: string,
  ): number {
    if (typeof input === "undefined" || input === null || input === "") return defaultValue;
    const parsed = Number(input);
    if (!Number.isFinite(parsed)) {
      throw new Error(`'${fieldName}' debe ser numerico.`);
    }
    if (parsed < min || parsed > max) {
      throw new Error(`'${fieldName}' debe estar entre ${min} y ${max}.`);
    }
    return parsed;
  }

  private static parseOptionalString(value: unknown): string | undefined {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
}
