import "server-only";
import type { Post } from "@/entities/post";
import { getEntryBySlug } from "@/entities/post";
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
    // 벡터 ID = 엔트리 slug. posts만이 아니라 모든 엔트리를 해석한다.
    // "about" 벡터는 about 본문이 항상 시스템 프롬프트에 주입되므로 별도 소스로
    // 노출하지 않고 자연히 건너뛴다(드롭이 아니라 의도된 동작).
    const post = getEntryBySlug(match.id);
    if (post) {
      posts.push(post);
    }
  }

  return posts;
}
