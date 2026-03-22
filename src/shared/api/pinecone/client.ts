import { Pinecone } from "@pinecone-database/pinecone";

let pineconeClient: Pinecone | null = null;

export function getPinecone(): Pinecone {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY ?? "",
    });
  }
  return pineconeClient;
}

export const PINECONE_INDEX_NAME = "blog-search";
