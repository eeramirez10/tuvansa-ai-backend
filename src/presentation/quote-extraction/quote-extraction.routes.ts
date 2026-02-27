import { Router } from "express";
import multer from "multer";
import { QuoteExtractionController } from "./quote-extraction.controller";

export class QuoteExtractionRoutes {
  private readonly controller: QuoteExtractionController;

  constructor(controller: QuoteExtractionController) {
    this.controller = controller;
  }

  public build(): Router {
    const router = Router();
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 20 * 1024 * 1024,
      },
    });

    router.post("/extract", upload.single("file"), this.controller.extract);

    return router;
  }
}
