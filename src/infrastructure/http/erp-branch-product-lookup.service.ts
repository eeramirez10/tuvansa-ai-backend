import {
  BranchProductLookupPort,
  BranchProductLookupResult,
} from "../../domain/contracts/branch-product-lookup.port";

interface ErpProductRow {
  average_cost?: unknown;
  last_cost?: unknown;
  AVERAGE_COST?: unknown;
  LAST_COST?: unknown;
  ID?: unknown;
  CODE?: unknown;
  EAN?: unknown;
  DESCRIPTION?: unknown;
  STOCK?: unknown;
  UNIT?: unknown;
  CURRENCY?: unknown;
  AVERAGECOST?: unknown;
  LASTCOST?: unknown;
  id?: unknown;
  code?: unknown;
  ean?: unknown;
  description?: unknown;
  stock?: unknown;
  unit?: unknown;
  currency?: unknown;
  averageCost?: unknown;
  lastCost?: unknown;
}

export class ErpBranchProductLookupService implements BranchProductLookupPort {
  private readonly supportedBranchCodes = ["01", "02", "03", "04", "05", "06", "07"];

  constructor(
    private readonly baseUrl: string | undefined,
    private readonly timeoutMs: number = 3500,
  ) {}

  public isEnabled(): boolean {
    return Boolean(this.baseUrl && this.baseUrl.trim().length > 0);
  }

  public async findByEanAndBranch(ean: string, branchCode: string): Promise<BranchProductLookupResult | null> {
    if (!this.isEnabled()) return null;

    const baseUrl = this.baseUrl?.trim().replace(/\/+$/, "");
    if (!baseUrl) return null;

    const lookupValue = ean.trim();
    if (!lookupValue) return null;

    const requestedBranch = branchCode.trim();
    const branchOrder = this.buildBranchOrder(requestedBranch);

    for (const currentBranchCode of branchOrder) {
      const found = await this.lookupInBranch(baseUrl, lookupValue, currentBranchCode);
      if (found) return found;
    }

    return null;
  }

  private buildBranchOrder(requestedBranch: string): string[] {
    const list: string[] = [];
    if (/^\d{2}$/.test(requestedBranch)) {
      list.push(requestedBranch);
    }

    for (const candidate of this.supportedBranchCodes) {
      if (list.includes(candidate)) continue;
      list.push(candidate);
    }

    return list;
  }

  private async lookupInBranch(
    baseUrl: string,
    ean: string,
    branchCode: string,
  ): Promise<BranchProductLookupResult | null> {
    const url = `${baseUrl}/by-ean/${encodeURIComponent(ean)}/branch/${encodeURIComponent(branchCode)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) return null;

      const json = (await response.json()) as unknown;
      const row = this.extractRow(json);
      if (!row) return null;

      const parsedEan = this.asString(this.readFirst(row, ["ean", "EAN"])) ?? ean;
      const parsedCode = this.asString(this.readFirst(row, ["code", "CODE"]));

      if (!parsedCode) return null;

      return {
        branchCode,
        id: this.asString(this.readFirst(row, ["id", "ID"])) ?? parsedCode,
        code: parsedCode,
        ean: parsedEan,
        description: this.asString(this.readFirst(row, ["description", "DESCRIPTION"])) ?? "",
        stock: this.asNumber(this.readFirst(row, ["stock", "STOCK"])),
        unit: this.asString(this.readFirst(row, ["unit", "UNIT"])) ?? "",
        currency: this.asString(this.readFirst(row, ["currency", "CURRENCY"])) ?? "",
        averageCost: this.asNumber(
          this.readFirst(row, ["averageCost", "AVERAGECOST", "average_cost", "AVERAGE_COST"]),
        ),
        lastCost: this.asNumber(this.readFirst(row, ["lastCost", "LASTCOST", "last_cost", "LAST_COST"])),
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractRow(input: unknown): ErpProductRow | null {
    if (Array.isArray(input) && input.length > 0 && typeof input[0] === "object" && input[0] !== null) {
      return input[0] as ErpProductRow;
    }

    if (input && typeof input === "object") {
      return input as ErpProductRow;
    }

    return null;
  }

  private asString(value: unknown): string | null {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    if (typeof value === "number") {
      return String(value);
    }
    return null;
  }

  private asNumber(value: unknown): number {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  private readFirst(row: ErpProductRow, keys: string[]): unknown {
    for (const key of keys) {
      const value = row[key as keyof ErpProductRow];
      if (typeof value !== "undefined" && value !== null) {
        return value;
      }
    }

    return null;
  }
}
