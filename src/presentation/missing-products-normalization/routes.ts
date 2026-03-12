import { Router } from "express";
import { MissingProductsNormalizationController } from "./controller";

export class MissingProductsNormalizationRoutes {
  constructor(private readonly controller: MissingProductsNormalizationController) {}

  public build(): Router {
    const router = Router();
    router.post("/products/normalize-missing", this.controller.normalize);
    return router;
  }
}
