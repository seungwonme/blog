import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { Pinecone } from "@pinecone-database/pinecone";

const POSTS_JSON_PATH = path.join(
  process.cwd(),
  "src/shared/generated/posts.json",
);
const HASH_CACHE_PATH = path.join(
  process.cwd(),
  "src/shared/generated/embeddings-hash.json",
);
const INDEX_NAME = "blog-search";

function contentHash(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

async function getEmbedding(
  client: GoogleGenAI,
  text: string,
): Promise<number[]> {
  const result = await client.models.embedContent({
    model: "gemini-embedding-2-preview",
    contents: text,
    config: {
      outputDimensionality: 3072,
    },
  });
  return result.embeddings?.[0]?.values ?? [];
}

async function main() {
  const pineconeApiKey = process.env.PINECONE_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!pineconeApiKey || !geminiApiKey) {
    console.error("PINECONE_API_KEY and GEMINI_API_KEY are required in .env");
    process.exit(1);
  }

  const pinecone = new Pinecone({ apiKey: pineconeApiKey });
  const gemini = new GoogleGenAI({ apiKey: geminiApiKey });
  const index = pinecone.index(INDEX_NAME);

  // Load posts and about
  const raw = fs.readFileSync(POSTS_JSON_PATH, "utf-8");
  const { posts, about } = JSON.parse(raw);

  // about을 posts와 동일한 형태로 추가
  const allEntries = [
    ...posts,
    ...(about
      ? [
          {
            title: "About",
            slug: "about",
            category: "",
            tags: [],
            date: "",
            description: "블로그 주인장 소개",
            content: about,
          },
        ]
      : []),
  ];

  // Load previous hashes
  let prevHashes: Record<string, string> = {};
  if (fs.existsSync(HASH_CACHE_PATH)) {
    prevHashes = JSON.parse(fs.readFileSync(HASH_CACHE_PATH, "utf-8"));
  }

  const currentHashes: Record<string, string> = {};
  const currentSlugs = new Set<string>();
  let upserted = 0;
  let skipped = 0;

  for (const post of allEntries) {
    const text = `${post.title}\n${post.description}\n${post.content}`;
    const truncated = text.slice(0, 10000);
    const hash = contentHash(truncated);

    currentHashes[post.slug] = hash;
    currentSlugs.add(post.slug);

    // Skip if content hasn't changed
    if (prevHashes[post.slug] === hash) {
      skipped++;
      continue;
    }

    console.log(`  Embedding: ${post.slug}`);
    const values = await getEmbedding(gemini, truncated);

    if (values.length === 0) {
      console.warn(`  Skipped (empty embedding): ${post.slug}`);
      continue;
    }

    await index.upsert({
      records: [
        {
          id: post.slug,
          values,
          metadata: {
            title: post.title,
            slug: post.slug,
            category: post.category,
            tags: post.tags.join(","),
            date: post.date,
            description: post.description,
          },
        },
      ],
    });

    console.log(`  Upserted: ${post.slug}`);
    upserted++;

    // Rate limit: Gemini free tier is 100 RPM
    await new Promise((r) => setTimeout(r, 700));
  }

  // Delete vectors for removed posts
  const deletedSlugs = Object.keys(prevHashes).filter(
    (slug) => !currentSlugs.has(slug),
  );
  if (deletedSlugs.length > 0) {
    await index.deleteMany(deletedSlugs);
    console.log(`  Deleted: ${deletedSlugs.join(", ")}`);
  }

  // Save current hashes
  fs.writeFileSync(
    HASH_CACHE_PATH,
    JSON.stringify(currentHashes, null, 2),
    "utf-8",
  );

  console.log(
    `Done! Upserted: ${upserted}, Skipped (unchanged): ${skipped}, Deleted: ${deletedSlugs.length}`,
  );
}

main();
