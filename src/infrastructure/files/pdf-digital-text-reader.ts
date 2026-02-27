import { PdfDigitalReconciliationService } from "./pdf-digital-reconciliation.service";

interface PdfDigitalTextReadResult {
  textContent: string;
  extractionHints: string | null;
}

interface PositionedToken {
  text: string;
  x: number;
  y: number;
}

interface PdfTextItemLike {
  str?: unknown;
  transform?: unknown;
}

export class PdfDigitalTextReader {
  private readonly reconciler: PdfDigitalReconciliationService;
  private readonly lineTolerance = 2;

  constructor(reconciler: PdfDigitalReconciliationService) {
    this.reconciler = reconciler;
  }

  public async read(buffer: Buffer): Promise<PdfDigitalTextReadResult> {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];
    const pageHints: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = this.buildPageText(textContent.items as PdfTextItemLike[]);

      if (pageText) {
        pageTexts.push(pageText);
      }

      const hint = this.extractHints(this.reconciler.reconcilePage(pageText), pageNumber);
      if (hint) {
        pageHints.push(hint);
      }
    }

    await loadingTask.destroy();

    return {
      textContent: pageTexts.join("\n\n").trim(),
      extractionHints: pageHints.length > 0 ? pageHints.join("\n\n") : null,
    };
  }

  private buildPageText(items: PdfTextItemLike[]): string {
    const tokens = items
      .map((item) => this.toToken(item))
      .filter((token): token is PositionedToken => token !== null)
      .sort((a, b) => {
        const sameLine = Math.abs(a.y - b.y) <= this.lineTolerance;
        if (!sameLine) {
          return b.y - a.y;
        }

        return a.x - b.x;
      });

    if (tokens.length === 0) {
      return "";
    }

    const lines: string[] = [];
    let currentLineTokens: PositionedToken[] = [];
    let currentLineY = tokens[0].y;

    for (const token of tokens) {
      if (Math.abs(token.y - currentLineY) > this.lineTolerance) {
        lines.push(this.joinLineTokens(currentLineTokens));
        currentLineTokens = [token];
        currentLineY = token.y;
        continue;
      }

      currentLineTokens.push(token);
    }

    if (currentLineTokens.length > 0) {
      lines.push(this.joinLineTokens(currentLineTokens));
    }

    return lines.map((line) => line.trim()).filter(Boolean).join("\n");
  }

  private toToken(item: PdfTextItemLike): PositionedToken | null {
    if (!item || typeof item !== "object") {
      return null;
    }

    const text = typeof item.str === "string" ? item.str.trim() : "";
    if (!text) {
      return null;
    }

    if (!Array.isArray(item.transform) || item.transform.length < 6) {
      return null;
    }

    const x = Number(item.transform[4]);
    const y = Number(item.transform[5]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }

    return { text, x, y };
  }

  private joinLineTokens(tokens: PositionedToken[]): string {
    if (tokens.length === 0) {
      return "";
    }

    const ordered = [...tokens].sort((a, b) => a.x - b.x);
    const parts: string[] = [];

    for (const token of ordered) {
      if (parts.length === 0) {
        parts.push(token.text);
        continue;
      }

      const previous = parts[parts.length - 1];
      const needsSpace = !/[(/-]$/.test(previous) && !/^[,.;:)]/.test(token.text);
      parts.push(needsSpace ? ` ${token.text}` : token.text);
    }

    return parts.join("");
  }

  private extractHints(reconciledPageText: string, pageNumber: number): string | null {
    const marker = "\n\nEXTRACTION_HINTS\n";
    const markerIndex = reconciledPageText.indexOf(marker);
    if (markerIndex < 0) {
      return null;
    }

    const hints = reconciledPageText.slice(markerIndex + marker.length).trim();
    if (!hints) {
      return null;
    }

    return `PAGE_${pageNumber}\n${hints}`;
  }
}
