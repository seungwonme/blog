import { GoogleGenAI } from "@google/genai";

let geminiClient: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY ?? "",
    });
  }
  return geminiClient;
}

export async function getEmbedding(text: string): Promise<number[]> {
  const client = getGemini();
  const result = await client.models.embedContent({
    model: "gemini-embedding-2-preview",
    contents: text,
    config: {
      outputDimensionality: 3072,
    },
  });
  return result.embeddings?.[0]?.values ?? [];
}
