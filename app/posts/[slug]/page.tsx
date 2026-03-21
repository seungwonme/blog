import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPostBySlug, getPosts } from "@/entities/post";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
    },
  };
}

export function generateStaticParams() {
  const posts = getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto p-8 bg-ctp-base text-ctp-text min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-ctp-blue mb-2">{post.title}</h1>
        <div className="flex gap-3 text-ctp-overlay0 text-sm">
          <time>{post.date}</time>
          <span>{post.category}</span>
          {post.tags.map((tag) => (
            <span key={tag} className="text-ctp-mauve">
              #{tag}
            </span>
          ))}
        </div>
        {post.description && (
          <p className="mt-2 text-ctp-subtext0">{post.description}</p>
        )}
      </header>
      <div className="terminal-markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </ReactMarkdown>
      </div>
      <footer className="mt-12 pt-4 border-t border-ctp-surface1 text-ctp-overlay0 text-sm">
        <p>
          Visit{" "}
          <a href="/" className="text-ctp-sapphire underline">
            seunan.dev
          </a>{" "}
          for the full terminal experience.
        </p>
      </footer>
    </article>
  );
}
