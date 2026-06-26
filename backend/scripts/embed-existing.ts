import prisma from "../config/prisma";
import { ingestDocumentService } from "../services/client/rag.service";

async function main() {
  const documents = await prisma.document.findMany({
    where: {
      isDeleted: false,
    }
  });
  console.log(`Found ${documents.length} active documents.`);
  let successCount = 0;
  let failCount = 0;

  for (const doc of documents) {
    console.log(`Processing document: ${doc.name} (${doc.id})...`);
    try {
      await ingestDocumentService(doc.id);
      console.log(`Successfully ingested: ${doc.name}`);
      successCount++;
    } catch (err: any) {
      console.error(`Failed to ingest document ${doc.name}:`, err.message);
      failCount++;
    }
  }

  console.log(`Ingestion completed. Success: ${successCount}, Fail: ${failCount}`);
}

main().catch(console.error);
