import { Router } from "express";
import { QuoteExtractionJobsController } from "./controller";
import multer from "multer";

export class QuoteExtractionJobsRoutes {


  constructor(private readonly controller: QuoteExtractionJobsController) { }

  public build(): Router {
    const router = Router();
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 20 * 1024 * 1024,
      },
    });

    router.post("/extract/jobs", upload.single("file"), this.controller.createJob);
    router.get("/extract/jobs/:id/status", this.controller.getStatus);
    router.get("/extract/jobs/:id/result", this.controller.getResult);
    router.post("/extract/jobs/text", this.controller.createTextJob);


    return router;
  }
}