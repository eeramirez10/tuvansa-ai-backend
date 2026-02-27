import { QuoteItem } from "./quote-item.entity";

export class QuoteExtractionResult {
  private readonly items: QuoteItem[];

  constructor(items: QuoteItem[]) {
    this.items = items;
  }

  public getItems(): QuoteItem[] {
    return [...this.items];
  }

  public count(): number {
    return this.items.length;
  }
}
