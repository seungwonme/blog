import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import {
  getAboutContent,
  getAllEntries,
  getAllEntriesMeta,
  getEntryByCategoryAndSlug,
} from "@/entities/post";
import { HomePage } from "@/pages/home";
import {
  createArticleJsonLd,
  createBreadcrumbJsonLd,
  JsonLd,
} from "@/shared/lib";

interface Props {
  params: Promise<{ category: string; slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.seunan.dev";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllEntries().map((entry) => ({
    category: entry.category,
    slug: entry.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const post = getEntryByCategoryAndSlug(category, slug);
  if (!post) return {};

  const postUrl = `${SITE_URL}/${post.category}/${post.slug}`;

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
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
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { category, slug } = await params;
  const post = getEntryByCategoryAndSlug(category, slug);
  if (!post) notFound();

  const posts = getAllEntriesMeta();
  const aboutContent = getAboutContent();
  const postUrl = `${SITE_URL}/${post.category}/${post.slug}`;

  return (
    <>
      <JsonLd
        data={createArticleJsonLd({
          title: post.title,
          description: post.description,
          url: postUrl,
          image: `${postUrl}/opengraph-image`,
          datePublished: post.date,
          dateModified: post.updated,
          section: post.category,
          keywords: post.tags,
          wordCount: post.content.replace(/\s+/g, "").length,
        })}
      />
      <JsonLd
        data={createBreadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          { name: post.category, url: `${SITE_URL}/${post.category}` },
          { name: post.title, url: postUrl },
        ])}
      />
      {/* SSR content for crawlers (visually hidden) */}
      <article className="sr-only">
        <h1>{post.title}</h1>
        <time>{post.date}</time>
        <p>{post.description}</p>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{ h1: "h2" }}
        >
          {post.content}
        </ReactMarkdown>
      </article>
      {/* 터미널을 해당 카테고리 디렉토리에서 열고(cat은 상대 경로),
          새로고침 시에도 경로(~/카테고리)가 보존되게 한다. */}
      <HomePage
        posts={posts}
        aboutContent={aboutContent}
        initialPath={`~/${post.category}`}
        initialCommand={`cat ${post.slug}`}
        preloadedContent={{ [post.slug]: post.content }}
      />
    </>
  );
}
