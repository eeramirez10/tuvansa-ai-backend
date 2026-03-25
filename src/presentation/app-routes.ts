import { Express } from "express";
import { QuoteExtractionRoutes } from "./quote-extraction/quote-extraction.routes";
import { QuoteExtractionJobsRoutes } from "./quote-extraction-job/routes.job";
import { MissingProductsNormalizationRoutes } from "./missing-products-normalization/routes";
import { AiProductsRoutes } from "./ai-products/routes";

export class AppRoutes {


  constructor(
    private readonly quoteExtractionRoutes: QuoteExtractionRoutes,
    private readonly quoteExtractionJobsRoutes: QuoteExtractionJobsRoutes,
    private readonly missingProductsNormalizationRoutes: MissingProductsNormalizationRoutes,
    private readonly aiProductsRoutes: AiProductsRoutes
  ) {

  }

  public register(app: Express): void {
    app.get("/health", (_req, res) => {
      res.json({ ok: true, service: "quote-extractor-backend" });
    });

    app.use("/api", this.quoteExtractionRoutes.build());
    app.use("/api", this.quoteExtractionJobsRoutes.build());
    app.use("/api", this.missingProductsNormalizationRoutes.build());
    app.use("/api", this.aiProductsRoutes.build());
  }
}
