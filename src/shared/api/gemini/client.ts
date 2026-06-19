import "server-only";
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
  try {
    const result = await client.models.embedContent({
      model: "gemini-embedding-2",
      contents: text,
      config: {
        outputDimensionality: 3072,
      },
    });
    const values = result.embeddings?.[0]?.values;
    if (!values?.length) {
      console.warn("[gemini] getEmbedding: empty embedding response");
      return [];
    }
    return values;
  } catch (error) {
    // 실패를 빈 배열로 조용히 삼키지 않고 로깅. 호출측(semanticSearch)은
    // []를 받으면 키워드 검색으로 graceful 폴백한다.
    console.error("[gemini] getEmbedding failed:", error);
    return [];
  }
}
