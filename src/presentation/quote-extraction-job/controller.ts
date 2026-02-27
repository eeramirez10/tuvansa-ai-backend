import { Request, Response } from "express";
import { CreateExtractionJobUseCase } from "../../domain/use-cases/extraction-job/create-extraction-job.use-case";
import { GetExtractionJobResultUseCase } from "../../domain/use-cases/extraction-job/get-extraction-job-result.use-case";
import { GetExtractionJobStatusUseCase } from "../../domain/use-cases/extraction-job/get-extraction-job-status.use-case";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ProcessExtractionJobUseCase } from "../../domain/use-cases/extraction-job/process-extraction-job.use-case";
import { ExtractionJobSource } from "../../domain/entities/extraction-job.entity";
import { CreateTextExtractionJobUseCase } from '../../domain/use-cases/extraction-job/create-text-extraction-job.use-case';


export class QuoteExtractionJobsController {

  private readonly uploadsDir = path.resolve(process.cwd(), "storage", "uploads");

  constructor(
    private readonly createExtractionJobUseCase: CreateExtractionJobUseCase,
    private readonly getExtractionJobStatusUseCase: GetExtractionJobStatusUseCase,
    private readonly getExtractionJobResultUseCase: GetExtractionJobResultUseCase,
    private readonly processExtractionJobUseCase: ProcessExtractionJobUseCase,
    private readonly createTextExtractionJobUseCase: CreateTextExtractionJobUseCase
  ) { }

  public createJob = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Debes enviar un archivo en el campo 'file'." });
      }

      await fs.mkdir(this.uploadsDir, { recursive: true });

      const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storedFileName = `${Date.now()}-${safeName}`;
      const filePath = path.join(this.uploadsDir, storedFileName);

      await fs.writeFile(filePath, req.file.buffer);

      const job = await this.createExtractionJobUseCase.execute(req.file.originalname, filePath);

      setImmediate(() => {
        void this.processExtractionJobUseCase.execute(job.id);
      });

      return res.status(202).json({
        job_id: job.id,
        status: job.status,
        created_at: job.createdAt,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error no controlado.";
      return res.status(400).json({ error: message });
    }
  };

  public createTextJob = async (req: Request, res: Response): Promise<Response> => {
    try {
      const text = String(req.body?.text ?? "").trim();
      const sourceRaw = String(req.body?.source ?? "").trim().toLowerCase();

      const source =
        sourceRaw === "email"
          ? ExtractionJobSource.EMAIL
          : sourceRaw === "whatsapp"
            ? ExtractionJobSource.WHATSAPP
            : sourceRaw === "manual"
              ? ExtractionJobSource.MANUAL
              : null;

      const job = await this.createTextExtractionJobUseCase.execute(text, source);

      setImmediate(() => {
        void this.processExtractionJobUseCase.execute(job.id);
      });

      return res.status(202).json({
        job_id: job.id,
        status: job.status,
        created_at: job.createdAt,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error no controlado.";
      return res.status(400).json({ error: message });
    }
  };

  public getStatus = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = req.params.id as string;
      const job = await this.getExtractionJobStatusUseCase.execute(id);

      if (!job) {
        return res.status(404).json({ error: "Job no encontrado." });
      }

      return res.status(200).json({
        job_id: job.id,
        status: job.status,
        progress: job.progress,
        error: job.errorMessage,
        created_at: job.createdAt,
        updated_at: job.updatedAt,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error no controlado.";
      return res.status(400).json({ error: message });
    }
  };

  public getResult = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = req.params.id as string;
      const result = await this.getExtractionJobResultUseCase.execute(id);

      if (!result.found) {
        return res.status(404).json({ error: "Job no encontrado." });
      }

      if (!result.ready) {
        return res.status(202).json({
          job_id: id,
          status: result.status,
          error: result.error,
          message: "El procesamiento aun no termina.",
        });
      }

      return res.status(200).json({
        job_id: id,
        status: result.status,
        result: result.result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error no controlado.";
      return res.status(400).json({ error: message });
    }
  };


}