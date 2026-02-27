import "dotenv/config";
import cors from "cors";
import express from "express";
import { ExtractQuoteItemsUseCase } from "../domain/use-cases/extract-quote-items.use-case";
import { OpenAiQuoteAiExtractorService } from "../infrastructure/ai/openai-quote-ai-extractor.service";
import { DocumentTypeDetector } from "../infrastructure/files/document-type-detector";
import { PdfDigitalReconciliationService } from "../infrastructure/files/pdf-digital-reconciliation.service";
import { PdfDigitalTextReader } from "../infrastructure/files/pdf-digital-text-reader";
import { QuoteDocumentTextExtractorService } from "../infrastructure/files/quote-document-text-extractor.service";
import { XlsxTextReader } from "../infrastructure/files/xlsx-text-reader";
import { LanguageDetectorService } from "../infrastructure/language/language-detector.service";
import { QuantityNormalizerService } from "../infrastructure/normalization/quantity-normalizer.service";
import { UnitNormalizerService } from "../infrastructure/normalization/unit-normalizer.service";
import { AppRoutes } from "./app-routes";
import { QuoteExtractionController } from "./quote-extraction/quote-extraction.controller";
import { QuoteExtractionRoutes } from "./quote-extraction/quote-extraction.routes";
import { CreateExtractionJobUseCase } from "../domain/use-cases/extraction-job/create-extraction-job.use-case";
import { GetExtractionJobResultUseCase } from "../domain/use-cases/extraction-job/get-extraction-job-result.use-case";
import { GetExtractionJobStatusUseCase } from "../domain/use-cases/extraction-job/get-extraction-job-status.use-case";
import { PostgresqlExtractionJobDatasource } from "../infrastructure/datasources/postgresql-extraction-job.datasource";
import { PostgresqlExtractionJobRepositoryimpl } from "../infrastructure/repositories/postgresql-extraction-job.repository-impl";
import { QuoteExtractionJobsController } from "./quote-extraction-job/controller";
import { QuoteExtractionJobsRoutes } from "./quote-extraction-job/routes";
import { ProcessExtractionJobUseCase } from "../domain/use-cases/extraction-job/process-extraction-job.use-case";
import { envs } from "../config/envs";
import { CreateTextExtractionJobUseCase } from "../domain/use-cases/extraction-job/create-text-extraction-job.use-case";
import { ExtractQuoteItemsFromTextUseCase } from "../domain/use-cases/extract-quote-items-from-text.use-case";

export class Server {
  private readonly app = express();
  private readonly port: number;

  constructor(port: number) {
    this.port = port;
  }

  public configure(): void {
    this.app.use(cors());
    this.app.use(express.json({ limit: "2mb" }));

    const openAiApiKey = process.env.OPENAI_API_KEY;
    if (!openAiApiKey) {
      throw new Error("Falta OPENAI_API_KEY en variables de entorno.");
    }

    const openAiModel = process.env.OPENAI_MODEL ?? "gpt-5-nano";

    const detector = new DocumentTypeDetector();
    const xlsxReader = new XlsxTextReader();
    const pdfReconciler = new PdfDigitalReconciliationService();
    const pdfReader = new PdfDigitalTextReader(pdfReconciler);
    const documentExtractor = new QuoteDocumentTextExtractorService(detector, xlsxReader, pdfReader);

    const unitNormalizer = new UnitNormalizerService();
    const quantityNormalizer = new QuantityNormalizerService();
    const languageDetector = new LanguageDetectorService();

    const aiExtractor = new OpenAiQuoteAiExtractorService(
      openAiApiKey,
      openAiModel,
      unitNormalizer,
      quantityNormalizer,
      languageDetector,
    );

    const useCase = new ExtractQuoteItemsUseCase(documentExtractor, aiExtractor);
    const extractQuoteItemsFromTextUseCase = new ExtractQuoteItemsFromTextUseCase(aiExtractor);


    const extractionJobDatasource = new PostgresqlExtractionJobDatasource();
    const extractionJobRepository = new PostgresqlExtractionJobRepositoryimpl(extractionJobDatasource);

    const createExtractionJobUseCase = new CreateExtractionJobUseCase(extractionJobRepository);
    const getExtractionJobStatusUseCase = new GetExtractionJobStatusUseCase(extractionJobRepository);
    const getExtractionJobResultUseCase = new GetExtractionJobResultUseCase(extractionJobRepository);

    const createTextExtractionJobUseCase = new CreateTextExtractionJobUseCase(extractionJobRepository)


    const processExtractionJobUseCase = new ProcessExtractionJobUseCase(
      extractionJobRepository,
      useCase,
      extractQuoteItemsFromTextUseCase
    );


    const quoteExtractionJobsController = new QuoteExtractionJobsController(
      createExtractionJobUseCase,
      getExtractionJobStatusUseCase,
      getExtractionJobResultUseCase,
      processExtractionJobUseCase,
      createTextExtractionJobUseCase
    );




    const quoteExtractionJobsRoutes = new QuoteExtractionJobsRoutes(quoteExtractionJobsController);



    const controller = new QuoteExtractionController(useCase);
    const quoteExtractionRoutes = new QuoteExtractionRoutes(controller);
    const appRoutes = new AppRoutes(quoteExtractionRoutes, quoteExtractionJobsRoutes);





    appRoutes.register(this.app);
  }

  public start(): void {
    this.app.listen(this.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend escuchando en http://localhost:${this.port}`);
    });
  }
}

const port = Number(envs.port);
const server = new Server(port);
server.configure();
server.start();
