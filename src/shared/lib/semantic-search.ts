import "server-only";
import { getEmbedding } from "@/shared/api/gemini/client";
import { getPinecone, PINECONE_INDEX_NAME } from "@/shared/api/pinecone/client";
import type { PostData } from "./content";
import { getPostBySlug } from "./content";

export async function semanticSearch(
  query: string,
  topK = 3,
): Promise<PostData[]> {
  const queryEmbedding = await getEmbedding(query);

  if (queryEmbedding.length === 0) return [];

  const index = getPinecone().index(PINECONE_INDEX_NAME);
  const results = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: false,
  });

  const posts: PostData[] = [];
  for (const match of results.matches ?? []) {
    const post = getPostBySlug(match.id);
    if (post) {
      posts.push(post);
    }
  }

  return posts;
}
