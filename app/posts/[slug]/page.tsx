import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { getAllEntries, getEntryBySlug } from "@/entities/post";
import { HomePage } from "@/pages/home";
import {
  createArticleJsonLd,
  createBreadcrumbJsonLd,
  JsonLd,
} from "@/shared/lib";

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://seunan.dev";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getEntryBySlug(slug);
  if (!post) return {};

  const postUrl = `${SITE_URL}/posts/${slug}`;

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      url: postUrl,
      authors: ["Aiden Ahn"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export function generateStaticParams() {
  return getAllEntries().map((entry) => ({ slug: entry.slug }));
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getEntryBySlug(slug);
  if (!post) notFound();

  const posts = getAllEntries();
  const postUrl = `${SITE_URL}/posts/${slug}`;

  return (
    <>
      <JsonLd
        data={createArticleJsonLd({
          title: post.title,
          description: post.description,
          url: postUrl,
          image: `${SITE_URL}/og-image.png`,
          datePublished: post.date,
          authorName: "Aiden Ahn",
        })}
      />
      <JsonLd
        data={createBreadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          { name: post.title, url: postUrl },
        ])}
      />
      {/* SSR content for crawlers (visually hidden) */}
      <article className="sr-only">
        <h1>{post.title}</h1>
        <time>{post.date}</time>
        <p>{post.description}</p>
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
          {post.content}
        </ReactMarkdown>
      </article>
      {/* Terminal UI with cat command auto-executed */}
      <HomePage posts={posts} initialCommand={`cat ${post.category}/${slug}`} />
    </>
  );
}
