import dotenv from "dotenv";
dotenv.config();
import { ingestDocumentService } from "./services/client/rag.service";

async function run() {
  console.log("Running manual ingestion for 7a0a7b5d-cb6d-4644-b8aa-20d7864c8d7e...");
  try {
    await ingestDocumentService("7a0a7b5d-cb6d-4644-b8aa-20d7864c8d7e");
    console.log("Done!");
  } catch (error: any) {
    console.error("Manual ingestion failed with error:", error.message, error.stack);
  }
}

run().catch(console.error);
