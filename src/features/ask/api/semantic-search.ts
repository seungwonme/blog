import "server-only";
import type { Post } from "@/entities/post";
import { getPostBySlug } from "@/entities/post";
import { getEmbedding, getPinecone, PINECONE_INDEX_NAME } from "@/shared/api";

export async function semanticSearch(query: string, topK = 3): Promise<Post[]> {
  const queryEmbedding = await getEmbedding(query);

  if (queryEmbedding.length === 0) return [];

  const index = getPinecone().index(PINECONE_INDEX_NAME);
  const results = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: false,
  });

  const posts: Post[] = [];
  for (const match of results.matches ?? []) {
    const post = getPostBySlug(match.id);
    if (post) {
      posts.push(post);
    }
  }

  return posts;
}
