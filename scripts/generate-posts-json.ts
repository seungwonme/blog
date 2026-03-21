import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content/posts");
const ABOUT_PATH = path.join(process.cwd(), "content/about.md");
const OUTPUT_PATH = path.join(process.cwd(), "src/shared/generated/posts.json");

interface PostEntry {
  title: string;
  slug: string;
  category: string;
  tags: string[];
  date: string;
  description: string;
  content: string;
}

interface GeneratedData {
  posts: PostEntry[];
  about: string;
  generatedAt: string;
}

function main() {
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Parse posts
  const posts: PostEntry[] = [];
  if (fs.existsSync(POSTS_DIR)) {
    const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
      const { data, content } = matter(raw);
      posts.push({
        title: data.title ?? file.replace(".md", ""),
        slug: data.slug ?? file.replace(".md", ""),
        category: data.category ?? "uncategorized",
        tags: data.tags ?? [],
        date: data.date ? String(data.date).slice(0, 10) : "1970-01-01",
        description: data.description ?? "",
        content,
      });
    }
  }

  posts.sort((a, b) => (a.date > b.date ? -1 : 1));

  // Parse about
  let about = "";
  if (fs.existsSync(ABOUT_PATH)) {
    const raw = fs.readFileSync(ABOUT_PATH, "utf-8");
    const { content } = matter(raw);
    about = content;
  }

  const data: GeneratedData = {
    posts,
    about,
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Generated ${posts.length} posts → ${OUTPUT_PATH}`);
}

main();
