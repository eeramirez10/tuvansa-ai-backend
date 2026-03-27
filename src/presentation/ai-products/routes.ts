import { Router } from "express";
import { AiProductsController } from "./controller";

export class AiProductsRoutes {
  constructor(private readonly controller: AiProductsController) {}

  public build(): Router {
    const router = Router();
    router.post("/ai/products/similar", this.controller.searchSimilar);
    return router;
  }
}
